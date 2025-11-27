import { FC, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Spinner } from "@0xsequence/design-system";
import { useWallets, useOpenConnectModal } from "@0xsequence/connect";

import {
  useAccount,
  useChains,
  useWalletClient,
  useWriteContract,
  useReadContract,
  useChainId,
  useSwitchChain,
} from "wagmi";

import { NFT_ABI } from "../abi";
import {
  demoNftContractAddress,
  demoNftContractChainId,
  walletUrl,
} from "../config";
import View3D from "./3d/View3D";
import MiningGame from "./3d/MiningGame";
import ItemViewer3D from "./3d/ItemViewer3D";
import PickAxe, { MintStatus } from "./3d/PickAxe";

import { Message } from "./Message";

import { ActivityButton } from "./ActivityButton";
import { TopHud } from "./TopHud";

export const Homepage: FC = () => {
  const { setOpenConnectModal } = useOpenConnectModal();

  const { wallets, disconnectWallet } = useWallets();

  const [shouldDisconnect, setShouldDisconnect] = useState(false);

  // Step 1: On mount, check if a disconnect is needed due to walletUrl change.
  useEffect(() => {
    const lastWalletUrl = localStorage.getItem("walletUrl");
    if (lastWalletUrl && lastWalletUrl !== walletUrl) {
      setShouldDisconnect(true);
    } else {
      // If URLs match or it's the first visit, just store the current URL.
      localStorage.setItem("walletUrl", walletUrl);
    }
  }, [walletUrl]); // Only depends on walletUrl, runs once on load.

  // Step 2: If a disconnect is flagged and wallets are loaded, perform it.
  useEffect(() => {
    if (shouldDisconnect) {
      localStorage.setItem("walletUrl", walletUrl);

      if (wallets.length === 0) {
        return;
      }

      wallets.forEach((wallet) => {
        disconnectWallet(wallet.address);
      });
      // After disconnecting, update the stored URL and reset the flag.
      setShouldDisconnect(false);
      window.location.reload();
    }
  }, [shouldDisconnect, wallets, disconnectWallet, walletUrl]);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const chains = useChains();
  const targetChain = useMemo(
    () => chains.find((c) => c.id === demoNftContractChainId),
    [chains]
  );
  const chainIdRef = useRef(chainId);
  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  // Ensure the active wallet is on the correct network when it changes.
  const chainSwitchAttemptedForAddressRef = useRef<string | null>(null);
  useEffect(() => {
    if (!address || chainId === demoNftContractChainId) {
      chainSwitchAttemptedForAddressRef.current = null;
      return;
    }

    if (!switchChainAsync) {
      return;
    }

    // Avoid spamming switch requests for the same address if the user rejects.
    if (chainSwitchAttemptedForAddressRef.current === address) {
      return;
    }

    chainSwitchAttemptedForAddressRef.current = address;
    switchChainAsync({ chainId: demoNftContractChainId }).catch((error) => {
      console.error("Failed to switch chain after wallet change:", error);
      // Allow a retry (e.g. if the user previously rejected)
      chainSwitchAttemptedForAddressRef.current = null;
    });
  }, [address, chainId, switchChainAsync]);

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
    return value < 10 ? `0${value.toString()}` : value.toString();
  }

  const gemsMinted = parseGems(
    nftBalances && Array.isArray(nftBalances)
      ? nftBalances[1] + nftBalances[2]
      : 0n
  );

  const { writeContractAsync } = useWriteContract();

  const hasPickaxe =
    nftBalances instanceof Array &&
    typeof nftBalances[0] === "bigint" &&
    nftBalances[0] > 0n;

  const [tempGemsMoon, setTempGemsMoon] = useState(0);
  const [tempGemsSun, setTempGemsSun] = useState(0);
  const isMintingRef = useRef(false);
  const waitForChainSync = useCallback(
    async (targetId: number) => {
      const maxAttempts = 10;
      const delayMs = 300;
      let lastWalletChain: number | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const wagmiChain = chainIdRef.current;
        if (wagmiChain === targetId) {
          return { ok: true, walletChain: lastWalletChain ?? wagmiChain };
        }

        if (walletClient?.getChainId) {
          try {
            lastWalletChain = await walletClient.getChainId();
            if (lastWalletChain === targetId) {
              return { ok: true, walletChain: lastWalletChain };
            }
          } catch (err) {
            console.error("Failed to read wallet chainId", err);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return {
        ok: false,
        walletChain: lastWalletChain ?? chainIdRef.current,
      };
    },
    [walletClient]
  );

  const runMintNFTs = async (itemIds: bigint[], itemAmts: bigint[]) => {
    if (!address) {
      console.warn("No active address; cannot mint.");
      return;
    }

    if (!targetChain) {
      console.error(
        "Target chain is not configured in wagmi:",
        demoNftContractChainId
      );
      setMintStatus("failed");
      return;
    }

    if (isMintingRef.current) {
      console.warn("Mint already in progress, skipping duplicate request.", {
        isMinting: isMintingRef.current,
      });
      return;
    }

    isMintingRef.current = true;
    setMintStatus("pending");
    const args = [itemIds, itemAmts] as const;
    console.log("mint: starting", {
      args: {
        ids: args[0].map((i) => i.toString()),
        amts: args[1].map((a) => a.toString()),
      },
      currentChain: chainIdRef.current,
      targetChain: targetChain.id,
    });

    try {
      if (!switchChainAsync) {
        throw new Error(
          "switchChainAsync is not available; please switch networks in your wallet."
        );
      }

      const switched = await switchChainAsync({ chainId: targetChain.id });
      if (switched && switched.id !== targetChain.id) {
        throw new Error(
          `Switch chain completed but ended on the wrong chain: ${switched.id}`
        );
      }

      const waitResult = await waitForChainSync(targetChain.id);
      console.log("mint: chain check", {
        wagmiChain: chainIdRef.current,
        walletChain: waitResult.walletChain,
        targetChain: targetChain.id,
        ok: waitResult.ok,
      });
      if (!waitResult.ok) {
        throw new Error(
          `Wallet still on chain ${waitResult.walletChain} after switch, expected ${targetChain.id}`
        );
      }

      const txHash = await writeContractAsync({
        address: demoNftContractAddress,
        abi: NFT_ABI,
        functionName: "batchMint",
        args,
        chainId: targetChain.id,
        chain: targetChain,
        account: address,
      });
      console.log("mint: tx sent", { txHash });

      setTimeout(async () => {
        await refetchNftBalances();
        setMintStatus("success");
        console.log("mint: success");
      }, 500);
    } catch (error) {
      console.error("Minting failed:", { error });
      const err = error as { cause?: { shortMessage?: string } };
      if (err.cause?.shortMessage === "Transaction creation failed.") {
        disconnectWallet(address as string);
        setMintStatus("notStarted");
      } else {
        setMintStatus("failed");
      }
    } finally {
      isMintingRef.current = false;
      console.log("mint: cleaned up");
    }
  };

  const [mintStatus, setMintStatus] = useState<MintStatus>("notStarted");

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
        <Spinner size="lg" />
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
                disconnectWallets={async () => {
                  await Promise.all(
                    wallets.map((wallet) => disconnectWallet(wallet.address))
                  );
                }}
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
  setOpenConnectModal: (isOpen: boolean) => void;
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
