import { FC, useState, useEffect } from "react";
import { Spinner } from "@0xsequence/design-system";
import { useKitWallets, useOpenConnectModal } from "@0xsequence/kit";

import {
  useAccount,
  useWalletClient,
  useWriteContract,
  useReadContract,
  useChainId,
  useSwitchChain,
} from "wagmi";

import { NFT_ABI } from "../abi";
import { demoNftContractAddress, demoNftContractChainId } from "../config";
import View3D from "./3d/View3D";
import MiningGame from "./3d/MiningGame";
import ItemViewer3D from "./3d/ItemViewer3D";
import PickAxe, { MintStatus } from "./3d/PickAxe";

import { Message } from "./Message";

import { ActivityButton } from "./ActivityButton";
import { TopHud } from "./TopHud";

export const Homepage: FC = () => {
  const { setOpenConnectModal } = useOpenConnectModal();

  const { wallets, disconnectWallet } = useKitWallets();

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const {
    data: nftBalances,
    isLoading: isLoadingNftBalances,
    refetch: refetchNftBalances,
  } = useReadContract({
    address: demoNftContractAddress,
    abi: NFT_ABI,
    functionName: "balanceOfBatch",
    args: address
      ? [
          [address, address, address],
          [0n, 1n, 2n],
        ]
      : undefined,
  });

  function parseGems(int: bigint) {
    const value = parseInt(int.toString());
    console.log(value);
    return value < 10 ? `0${value.toString()}` : value.toString();
  }

  const gemsMinted = parseGems(
    nftBalances && Array.isArray(nftBalances)
      ? nftBalances[1] + nftBalances[2]
      : 0n,
  );

  const {
    data: mintTxnData,
    isPending: isPendingMintTxn,
    writeContractAsync,
  } = useWriteContract();

  const hasPickaxe =
    nftBalances instanceof Array &&
    typeof nftBalances[0] === "bigint" &&
    nftBalances[0] > 0n;

  const [tempGemsMoon, setTempGemsMoon] = useState(0);
  const [tempGemsSun, setTempGemsSun] = useState(0);

  const runMintNFTs = async (itemIds: bigint[], itemAmts: bigint[]) => {
    if (!walletClient) {
      return;
    }

    // check if we're on the right chain
    if (chainId !== demoNftContractChainId) {
      try {
        await switchChainAsync({ chainId: demoNftContractChainId });
      } catch (e) {
        console.error("Failed to switch chain:", e);
      }
    }
    const args = [itemIds, itemAmts];
    console.log("batchMint args:", args);
    try {
      setMintStatus("pending");
      writeContractAsync({
        address: demoNftContractAddress,
        abi: NFT_ABI,
        functionName: "batchMint",
        args,
      });
    } catch (error) {
      console.error("Minting failed:", error);
      // Type assertion to access error properties safely
      const err = error as { cause?: { shortMessage?: string } };
      // this error means wallet is not connected
      if (err.cause?.shortMessage === "Transaction creation failed.") {
        disconnectWallet(address as string);
        setMintStatus("notStarted");
      } else {
        setMintStatus("failed");
      }
    }
  };

  const [mintStatus, setMintStatus] = useState<MintStatus>("notStarted");

  // Handle mint transaction status changes
  useEffect(() => {
    if (isPendingMintTxn) {
      setMintStatus("pending");
    } else if (mintTxnData) {
      // add a bit of delay before setting the demo mode to play
      setTimeout(async () => {
        await refetchNftBalances();

        setMintStatus("success");
      }, 500);
    } else if (!isPendingMintTxn && !mintTxnData && mintStatus === "pending") {
      // If we were pending but now we're not, and there's no transaction data, it failed
      console.warn("mint failed?");
      setMintStatus("failed");
    }
  }, [isPendingMintTxn, mintTxnData, mintStatus, refetchNftBalances]);

  // Set demo mode based on pickaxe ownership
  useEffect(() => {
    if (hasPickaxe) {
      setDemoMode("play");
    } else {
      setDemoMode("mint");
    }
  }, [hasPickaxe]);

  const [demoMode, setDemoMode] = useState<"mint" | "play">("mint");
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  // Check wallet connection after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingWallet(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  // Show loading state while checking wallet or NFT balance
  if (isCheckingWallet || (wallets.length > 0 && isLoadingNftBalances)) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center w-full h-full">
      <div className="relative w-full aspect-square md:aspect-[1.31/1] md:max-w-screen-lg mx-2 md:mx-auto">
        <img
          src="/tvframe.webp"
          className="object-cover relative pointer-events-none z-10 hidden md:block"
        />
        <div
          className="md:w-[60%] md:h-[67%] md:absolute md:left-[8.64%] md:top-[12.17%] size-full md:size-auto z-1 flex flex-col items-center justify-end"
          data-id="screen"
        >
          {wallets.length > 0 ? (
            <>
              <TopHud
                gemsMinted={gemsMinted}
                address={address}
                demoMode={demoMode}
                mintStatus={mintStatus}
                disconnectWallet={disconnectWallet}
              />
              <View3D env={demoMode === "play" ? "mine" : "item"}>
                {demoMode === "play" ? (
                  <MiningGame
                    collectGemMoon={() => setTempGemsMoon(tempGemsMoon + 1)}
                    collectGemSun={() => setTempGemsSun(tempGemsSun + 1)}
                  />
                ) : (
                  <ItemViewer3D>
                    <PickAxe mintStatus={mintStatus} />
                  </ItemViewer3D>
                )}
              </View3D>
              {hasPickaxe ? (
                <Hud
                  gemsMoon={tempGemsMoon}
                  gemsSun={tempGemsSun}
                  mintGems={() => {
                    const ids: bigint[] = [];
                    const amts: bigint[] = [];
                    if (tempGemsSun > 0) {
                      ids.push(1n);
                      amts.push(BigInt(tempGemsSun));
                    }
                    if (tempGemsMoon > 0) {
                      ids.push(2n);
                      amts.push(BigInt(tempGemsMoon));
                    }
                    setTempGemsMoon(0);
                    setTempGemsSun(0);
                    runMintNFTs(ids, amts);
                  }}
                  minting={mintStatus === "pending"}
                />
              ) : null}
              <Minting
                hasPickaxe={hasPickaxe}
                mintStatus={mintStatus}
                runMintNFT={() => runMintNFTs([0n], [1n])}
              />
            </>
          ) : (
            <LoginScreen setOpenConnectModal={setOpenConnectModal} />
          )}
        </div>
      </div>
    </div>
  );
};

function LoginScreen({
  setOpenConnectModal,
}: {
  setOpenConnectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <img
        src="/miningquest.webp"
        className="absolute size-full inset-0 object-cover"
      />
      <div className="relative mb-16">
        <ActivityButton onClick={() => setOpenConnectModal(true)}>
          Connect Wallet
        </ActivityButton>
      </div>
    </>
  );
}

function Minting({
  hasPickaxe,
  mintStatus,
  runMintNFT,
}: {
  hasPickaxe: boolean;
  mintStatus: MintStatus;
  runMintNFT: () => Promise<void>;
}) {
  return (
    <>
      {hasPickaxe ? (
        <ReadyToMine />
      ) : (
        <div className="absolute bottom-[2rem] p-4 flex flex-col gap-2 max-w-[80%] md:text-[14px] text-[12px]">
          <div className="flex items-center justify-center flex-col gap-3">
            {mintStatus === "pending" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span className="text-18 text-white">Minting...</span>
              </div>
            ) : (
              <>
                {mintStatus === "failed" ? (
                  <>
                    <ActivityButton onClick={runMintNFT}>
                      Retry Mint
                    </ActivityButton>
                    <span className="text-18 text-white">
                      Minting failed. Please try again.
                    </span>
                  </>
                ) : (
                  <ActivityButton onClick={runMintNFT}>
                    Mint a Pick Axe NFT to start mining
                  </ActivityButton>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Hud({
  gemsSun,
  gemsMoon,
  mintGems,
  minting,
}: {
  gemsSun: number;
  gemsMoon: number;
  mintGems: () => void;
  minting: boolean;
}) {
  const total = gemsSun + gemsMoon;

  return total === 0 && !minting ? null : (
    <div className="absolute bottom-[2rem] z-1 w-full pt-6 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 ">
      {minting ? (
        <Message>Minting...</Message>
      ) : (
        <ActivityButton onClick={minting ? () => {} : mintGems}>
          Mint {total} Collected Gem{total === 1 ? "" : "s"}
        </ActivityButton>
      )}
    </div>
  );
}

function ReadyToMine() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  }, []);

  return (
    <div
      className="text-white text-17 font-semibold uppercase rounded-full bg-gradient-to-b from-black to-black/50  px-5.25 py-2.25 flex z-0 absolute bottom-[6rem] bg-black/50 p-4  flex-col gap-2 max-w-[80%] data-[visible='false']:opacity-0 transition-all data-[visible='false']:translate-y-12 pointer-events-none "
      data-visible={isVisible}
    >
      Ready to Mine!
    </div>
  );
}
