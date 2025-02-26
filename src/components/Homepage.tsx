import { FC, useState, useEffect } from "react";
import { Text, Spinner, truncateAddress } from "@0xsequence/design-system";
import { useKitWallets, useOpenConnectModal } from "@0xsequence/kit";
import { useOpenWalletModal } from "@0xsequence/kit-wallet";

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

export const Homepage: FC = () => {
  const { setOpenConnectModal } = useOpenConnectModal();
  const { setOpenWalletModal } = useOpenWalletModal();
  const { wallets, disconnectWallet } = useKitWallets();

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const {
    data: nftBalance,
    isLoading: isLoadingNFT,
    refetch: refetchNftBalance,
  } = useReadContract({
    address: demoNftContractAddress,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address, 0n] : undefined,
  });

  const {
    data: mintTxnData,
    isPending: isPendingMintTxn,
    writeContract,
  } = useWriteContract();

  const hasPickaxe = typeof nftBalance === "bigint" && nftBalance > 0n;

  const runMintNFT = async () => {
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

    try {
      setMintStatus("pending");

      writeContract({
        address: demoNftContractAddress,
        abi: NFT_ABI,
        functionName: "mint",
        args: [0],
      });
    } catch (error) {
      console.error("Minting failed:", error);
      setMintStatus("failed");
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
        await refetchNftBalance();
        setMintStatus("successs");
      }, 1500);
    } else if (!isPendingMintTxn && !mintTxnData && mintStatus === "pending") {
      // If we were pending but now we're not, and there's no transaction data, it failed
      setMintStatus("failed");
    }
  }, [isPendingMintTxn, mintTxnData, mintStatus, refetchNftBalance]);

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
  const [swing, setSwing] = useState(0);
  const [broken, setBroken] = useState(0);
  const [depth, setDepth] = useState(0);
  // Check wallet connection after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingWallet(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state while checking wallet or NFT balance
  if (isCheckingWallet || (wallets.length > 0 && isLoadingNFT)) {
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
      <div className="relative w-full aspect-square md:aspect-[1.31/1] md:max-w-screen-lg">
        <img
          src="/tvframe.webp"
          className="object-cover relative pointer-events-none z-10 hidden md:block"
        />
        <div
          className="md:w-[60%] md:h-[67%] md:absolute md:left-[8.64%] md:top-[12.17%] size-full md:size-auto z-1 bg-neutral-600 flex flex-col items-center justify-end"
          data-id="screen"
        >
          {wallets.length > 0 ? (
            <>
              {address && (
                <>
                  <div className="absolute top-0 z-1 w-full pt-6 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 ">
                    <button
                      type="button"
                      onClick={() => setOpenWalletModal(true)}
                      className="cursor-pointer hover:bg-white hover:text-black bg-black px-2 whitespace-nowrap"
                    >
                      [ Inventory ]
                    </button>
                    <button
                      type="button"
                      onClick={() => disconnectWallet(address)}
                      className="cursor-pointer hover:bg-white hover:text-black bg-black px-2 whitespace-nowrap"
                    >
                      [ Disconnect ]
                    </button>
                  </div>
                  <div className="absolute bottom-0 z-1 w-full pb-2 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 ">
                    {truncateAddress(address as string, 4, 4)}
                  </div>
                </>
              )}
              <View3D env={demoMode === "play" ? "mine" : "item"}>
                {demoMode === "play" ? (
                  <MiningGame
                    setSwing={setSwing}
                    setBroken={setBroken}
                    setDepth={setDepth}
                  />
                ) : (
                  <ItemViewer3D>
                    <PickAxe mintStatus={mintStatus} />
                  </ItemViewer3D>
                )}
              </View3D>
              {hasPickaxe ? (
                <Hud swing={swing} broken={broken} depth={depth} />
              ) : null}
              <Minting
                hasPickaxe={hasPickaxe}
                mintStatus={mintStatus}
                runMintNFT={runMintNFT}
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
        <button
          type="button"
          onClick={() => setOpenConnectModal(true)}
          className="cursor-pointer hover:bg-white hover:text-black px-2 underline text-[12px] md:text-[14px]"
        >
          [ Connect Wallet ]
        </button>
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
        <div className="absolute bottom-[4rem] bg-black p-4 flex flex-col gap-2 max-w-[80%] md:text-[14px] text-[12px]">
          <div className="flex items-center justify-center flex-col gap-3">
            {mintStatus === "pending" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Minting...</span>
              </div>
            ) : (
              <>
                {mintStatus === "failed" ? (
                  <>
                    <Text className="mb-2" color="negative">
                      Minting failed. Please try again.
                    </Text>
                    <button
                      type="button"
                      onClick={runMintNFT}
                      className="cursor-pointer hover:bg-white hover:text-black px-2 underline"
                    >
                      [ Retry Mint ]
                    </button>
                  </>
                ) : (
                  <>
                    Mint a Pick Axe NFT to start mining.
                    <button
                      type="button"
                      onClick={runMintNFT}
                      className="cursor-pointer hover:bg-white hover:text-black px-2 underline"
                    >
                      [ Mint Pick Axe NFT ]
                    </button>
                  </>
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
  swing,
  broken,
  depth,
}: {
  swing: number;
  broken: number;
  depth: number;
}) {
  return (
    <div className="absolute bottom-[2rem] bg-black p-2 md:p-4  max-w-[90%] md:max-w-[80%] data-[visible='false']:opacity-0 transition-all data-[visible='false']:translate-y-12 pointer-events-none flex gap-9 text-[8px] md:text-[10px]">
      <span>
        Swings <span className="text-green-500">[{swing}]</span>
      </span>
      <span>
        Broken <span className="text-green-500">[{broken}]</span>
      </span>
      <span>
        Depth <span className="text-green-500">[{depth}]</span>
      </span>
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
      className="absolute bottom-[6rem] bg-black p-4 flex flex-col gap-2 max-w-[80%] data-[visible='false']:opacity-0 transition-all data-[visible='false']:translate-y-12 pointer-events-none"
      data-visible={isVisible}
    >
      Ready to mine!
    </div>
  );
}
