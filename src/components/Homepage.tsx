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
import useSound from "use-sound";

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

  function parseGems(int: BigInt) {
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
                  <div className="absolute top-0 z-1 size-full py-8 text-[10px] md:text-[12px] font-medium flex justify-between items-start px-14 gap-2 md:gap-2 pointer-events-none">
                    {/* <button
                      type="button"

                      className="cursor-pointer hover:bg-white hover:text-black bg-black px-2 whitespace-nowrap"
                    >
                      [ Inventory ]
                    </button> */}
                    <div className="flex w-full justify-between items-center gap-6">
                      {demoMode === "play" ? (
                        <>
                          <div className="[background-image:url('/hud/inventory-bg@2x.webp')] bg-cover bg-no-repeat size-16 rounded-full">
                            <ActionButton
                              label="Inventory"
                              variant={demoMode}
                              onClick={() => setOpenWalletModal(true)}
                              style={{} as React.CSSProperties}
                            >
                              <span className="z-1 mt-auto mb-1 group-hover:translate-y-[1px] transition-transform group-hover:scale-95">
                                <Overlay>
                                  <TextStroke
                                    textStroke="text-stroke-5"
                                    textColor="text-[#ffff84]"
                                    strokeColor="text-[#252525]"
                                    className="text-18 whitespace-nowrap font-semibold"
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
                          </div>

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
                                  textStroke="text-stroke-6"
                                  textColor="text-[#ffff84]"
                                  strokeColor="text-[#252525]"
                                  className="text-29 whitespace-nowrap mt-5 font-semibold"
                                >
                                  {gemsMinted.toString()}
                                </TextStroke>
                              </Overlay>
                            </Overlay>
                          </span>
                        </>
                      ) : null}
                      <div className="[background-image:url('/hud/logout-bg@2x.webp')] bg-cover bg-no-repeat size-16 rounded-full ml-auto mr-0">
                        <ActionButton
                          variant={demoMode}
                          label="Disconnect"
                          onClick={() => disconnectWallet(address)}
                        >
                          <img src="/hud/logout@2x.webp" width="32" alt="" />
                        </ActionButton>
                      </div>
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
        {/* <button
          type="button"
          onClick={() => setOpenConnectModal(true)}
          className="cursor-pointer text-17 font-semibold text-[#252525] uppercase rounded-full
             bg-gradient-to-b from-[#FEA41A] to-[#FEBE38] p-0.25
             hover:scale-105 transition-transform duration-200
             hover:shadow-[0_0_15px_rgba(255,165,0,0.6)]
             hover:animate-shimmer hover:bg-[linear-gradient(270deg,#FEA41A,#FEBE38,#FD451C,#7A280D)]
             hover:bg-[length:200%_200%]"
          style={{ animation: "shimmer 2s infinite linear" }}
        >
          <span className="rounded-full bg-gradient-to-b from-[#FED328] via-50% via-[#FD451C] to-[95%] to-[#7A280D] block p-1">
            <span className="rounded-full bg-gradient-to-b from-[#FED831] to-[#FD994F] flex py-1 px-4 shadow-[0_1px_0_0_theme(colors.white/20%)_inset]">
              Connect Wallet
            </span>
          </span>
        </button> */}

        <ActivityButton onClick={() => setOpenConnectModal(true)}>
          Connect Wallet
        </ActivityButton>
      </div>
    </>
  );
}

function ActivityButton(
  props: { children: React.ReactNode } & React.ComponentProps<"button">,
) {
  const { children, ...rest } = props;

  //hover:shadow-2xl hover:scale-105 cursor-pointer transition-transform
  return (
    <button
      type="button"
      {...rest}
      className="cursor-pointer relative group active:translate-y-0.25 rounded-full
      hover:shadow-[0_0_10px_0_theme(colors.white/50%)]
      hover:-translate-y-0.25
transition-all"
    >
      <div
        className="absolute inset-0.75 size-[calc(100%-6px)] group-hover:opacity-100
  group-active:hidden
  shadow-[0_1px_6px_6px_theme(colors.amber.500/80%)_inset]
  mix-blend-hard-light
  opacity-0
  transition-opacity
  rounded-full
"
      ></div>
      <div
        className="absolute inset-0 size-full group-active:block hidden
        shadow-[0_6px_6px_6px_theme(colors.black/60%)_inset]
        z-10
        bg-black/20
        rounded-full
      "
      ></div>
      <span className="text-17 font-semibold text-[#252525] uppercase rounded-full bg-gradient-to-b from-[#FEA41A] to-[#FEBE38] p-0.25 flex  z-0">
        <span className="rounded-full bg-gradient-to-b from-[#FED328] via-50% via-[#FD451C] to-[95%] to-[#7A280D] block p-1">
          <span className="rounded-full bg-gradient-to-b from-[#FED831] to-[#FD994F] flex py-1 px-4 shadow-[0_1px_0_0_theme(colors.white/20%)_inset] ">
            {children}
          </span>
        </span>
      </span>
    </button>
  );
}

function Message(
  props: { children: React.ReactNode } & React.ComponentProps<"span">,
) {
  const { children, ...rest } = props;
  return (
    <span
      className="text-white text-17 font-semibold uppercase rounded-full bg-gradient-to-b from-black to-black/50  px-5.25 py-2.25 flex z-0"
      {...rest}
    >
      {children}
    </span>
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

  const [shine] = useSound("/audio/gem-shine.mp3");
  return total === 0 && !minting ? null : (
    <div className="absolute bottom-[2rem] z-1 w-full pt-6 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 ">
      {minting ? (
        <Message>Minting...</Message>
      ) : (
        <ActivityButton
          onClick={minting ? () => {} : mintGems}
          onMouseDown={() => shine()}
        >
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

function ActionButton(
  props: {
    children: React.ReactNode;
    label: string;
    variant: "mint" | "play";
  } & React.ComponentProps<"button">,
) {
  const { variant = "game", label, children, ...rest } = props;
  const [buttonPress] = useSound("/audio/pop.mp3");

  return (
    <button
      onMouseDown={() => buttonPress()}
      type="button"
      className="
      group size-16 rounded-full bg-gradient-to-b from-[#332D24] to-[#34302C] p-0.75 flex items-center justify-center relative pointer-events-auto cursor-pointer
      data-[variant='play']:mix-blend-hard-light
      data-[variant='mint']:from-[#433F89] data-[variant='mint']:to-[#433F89]
      hover:shadow-[0_0_10px_0_theme(colors.white/30%)]
      hover:-translate-y-0.25
      active:translate-y-0.25
      transition-all
      "
      data-variant={variant}
      {...rest}
    >
      <div
        className="absolute inset-0 size-full group-active:block hidden
        shadow-[0_6px_6px_6px_theme(colors.black/60%)_inset]
        mix-blend-darken
        border-white border
        bg-black/20
        rounded-full
      "
      ></div>

      <div
        className="absolute inset-0.75 size-[calc(100%-6px)] group-hover:opacity-100
        group-active:hidden
        shadow-[0_1px_6px_6px_theme(colors.white/20%)_inset]
        mix-blend-hard-light
        opacity-0
        transition-opacity
        rounded-full
      "
      ></div>

      <span
        className="
          flex items-center justify-center size-full bg-gradient-to-b from-[#B08D5C] to-[#2F1E0E] rounded-full p-0.5
          data-[variant='mint']:from-[#7D79D3] data-[variant='mint']:to-[#49489E]
        "
        data-variant={variant}
      >
        <span
          className="
            flex items-center justify-center size-full bg-gradient-to-b from-[#9B8569] to-[#473117] rounded-full p-0.75
            data-[variant='mint']:from-[#6B67CE] data-[variant='mint']:to-[#49489E]
          "
          data-variant={variant}
        >
          <span
            className="
            flex items-center justify-center size-full bg-gradient-to-b from-[#BC8F61] to-[#7A654E] rounded-full p-0.5
            data-[variant='mint']:from-[#6A66D4] data-[variant='mint']:to-[#5C5CB6]
            "
            data-variant={variant}
          ></span>
        </span>
      </span>
      <span className="size-full inset-0 absolute flex items-center justify-center z-50 group-active:translate-y-[2px] group-active:opacity-70 transition-all">
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
