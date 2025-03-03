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
        setMintStatus("successs");
      }, 1500);
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
                  <div className="absolute top-0 z-1 size-full py-8 text-[10px] md:text-[12px] font-medium flex justify-between  items-start px-12 gap-1 md:gap-2 pointer-events-none [background-image:url('/hud/cave-bg@2x.webp')] bg-contain bg-no-repeat">
                    {/* <button
                      type="button"

                      className="cursor-pointer hover:bg-white hover:text-black bg-black px-2 whitespace-nowrap"
                    >
                      [ Inventory ]
                    </button> */}
                    <div className="flex w-full justify-between items-center gap-4">
                      <ActionButton
                        label="Inventory"
                        onClick={() => setOpenWalletModal(true)}
                      >
                        <span className="z-1 mt-auto mb-1 group-hover:translate-y-[1px] transition-transform group-hover:scale-95">
                          <Overlay>
                            <TextStroke
                              textStroke="text-stroke-5"
                              textColor="text-[#ffff84]"
                              strokeColor="text-[#252525]"
                              className="text-18 whitespace-nowrap"
                            >
                              {truncateAddress(address as string, 2, 3)}
                            </TextStroke>
                          </Overlay>
                        </span>

                        <img
                          src="/hud/inventory@2x.webp"
                          width="33"
                          height="37"
                          alt=""
                          className="absolute z-0 mb-1 group-hover:-translate-y-0.75 group-hover:scale-105 transition-transform"
                        />
                      </ActionButton>

                      <span className="size-16 flex items-center justify-center flex-col ml-0 mr-auto">
                        <Overlay>
                          <img
                            src="/hud/gems@2x.webp"
                            width="58"
                            height="36"
                            className="mb-4"
                          />
                          <Overlay>
                            <TextStroke
                              textStroke="text-stroke-7"
                              textColor="text-[#ffff84]"
                              strokeColor="text-[#252525]"
                              className="text-29 whitespace-nowrap mt-4"
                            >
                              8
                            </TextStroke>
                          </Overlay>
                        </Overlay>
                      </span>

                      <ActionButton
                        label="Disconnect"
                        onClick={() => disconnectWallet(address)}
                      >
                        <img
                          src="/hud/logout@2x.webp"
                          width="36"
                          alt=""
                          className="absolute z-0  group-hover:-translate-y-0.75 group-hover:scale-105 transition-transform"
                        />
                      </ActionButton>
                    </div>
                  </div>
                  <div className="absolute bottom-0 z-1 w-full pb-2 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 "></div>
                </>
              )}
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
      <button
        type="button"
        onClick={minting ? () => {} : mintGems}
        className="cursor-pointer hover:bg-white hover:text-black bg-black px-2 whitespace-nowrap"
      >
        {minting
          ? "Minting..."
          : `[ Mint ${total} Gem${total === 1 ? "" : "s"} ]`}
      </button>
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

function ActionButton(
  props: {
    children: React.ReactNode;
    label: string;
  } & React.ComponentProps<"button">,
) {
  const { label, children, ...rest } = props;

  return (
    <button
      type="button"
      className="group size-16 rounded-full bg-gradient-to-b from-[#332D24] to-[#34302C] p-0.75 flex items-center justify-center relative pointer-events-auto cursor-pointer mix-blend-hard-light"
      {...rest}
    >
      <span className="flex items-center justify-center size-full bg-gradient-to-b from-[#B08D5C] to-[#2F1E0E] rounded-full p-0.5 ">
        <span className="flex items-center justify-center size-full bg-gradient-to-b from-[#9B8569] to-[#473117] rounded-full p-0.75  ">
          <span className="flex items-center justify-center size-full bg-gradient-to-b from-[#BC8F61] to-[#7A654E] rounded-full p-0.5  "></span>
        </span>
      </span>
      <span className="size-full inset-0 absolute flex items-center justify-center z-50">
        {children}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function TextStroke(
  props: {
    strokeColor: string;
    textColor: string;
    textStroke: string;
    children: string;
  } & React.ComponentProps<"span">,
) {
  const {
    children,
    textColor,
    strokeColor,
    textStroke,
    className = "",
    ...rest
  } = props;

  return (
    <>
      <span
        {...rest}
        className={`${className} ${strokeColor} ${textStroke}`}
        // className="text-16 whitespace-nowrap mt-auto mb-0 text-[#252525] col-start-1 row-start-1 "
        aria-hidden="true"
      >
        {children}
      </span>
      <span className={`${className} ${textColor}`} {...rest}>
        {children}
      </span>
    </>
  );
}

function Overlay(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <span className="grid grid-cols-1 grid-rows-1 justify-items-center [&>*]:col-start-1 [&>*]:row-start-1">
      {children}
    </span>
  );
}
