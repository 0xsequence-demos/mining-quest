import { FC, useState, useEffect } from "react";
import {
  Button,
  Box,
  Text,
  Card,
  Spinner,
  Image,
  truncateAddress,
  useMediaQuery,
} from "@0xsequence/design-system";
import { useKitWallets, useOpenConnectModal } from "@0xsequence/kit";
import { useOpenWalletModal } from "@0xsequence/kit-wallet";
import { arbitrumSepolia } from "viem/chains";
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
  useReadContract,
} from "wagmi";

import { NFT_ABI } from "../abi";
import { DEMO_NFT_CONTRACT_ADDRESS } from "../config";
import View3D from "./3d/View3D";
import MiningGame from "./3d/MiningGame";
import ItemViewer3D from "./3d/ItemViewer3D";
import PickAxe, { MintStatus } from "./3d/PickAxe";

export const Homepage: FC = () => {
  const isMobile = useMediaQuery("isMobile");

  const { setOpenConnectModal } = useOpenConnectModal();
  const { setOpenWalletModal } = useOpenWalletModal();
  const { wallets, disconnectWallet } = useKitWallets();

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const {
    data: nftBalance,
    isLoading: isLoadingNFT,
    refetch: refetchNftBalance,
  } = useReadContract({
    address: DEMO_NFT_CONTRACT_ADDRESS,
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

    try {
      setMintStatus("pending");

      await switchChainAsync({
        chainId: arbitrumSepolia.id,
      });

      writeContract({
        address: DEMO_NFT_CONTRACT_ADDRESS,
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
  }, [isPendingMintTxn, mintTxnData, mintStatus]);

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
  if (isCheckingWallet || (wallets.length > 0 && isLoadingNFT)) {
    return (
      <Box
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
      </Box>
    );
  }

  return (
    <Box
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "12px" : "24px",
        touchAction: "manipulation",
      }}
    >
      <Box
        style={{
          maxWidth: isMobile ? "100vw" : "800px",
          minWidth: isMobile ? "100vw" : "800px",
        }}
      >
        {wallets.length > 0 ? (
          <Card style={{ padding: isMobile ? "12px" : "24px" }}>
            <Box
              flexDirection={isMobile ? "column" : "row"}
              gap={isMobile ? "2" : "0"}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                marginBottom: "24px",
              }}
            >
              <Box
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Text variant="medium">Wallet:</Text>
                <Text>{truncateAddress(address as string, 4, 4)}</Text>
              </Box>
              {address && (
                <Box style={{ display: "flex", gap: "8px" }}>
                  <Button
                    label="Inventory"
                    onClick={() => setOpenWalletModal(true)}
                    variant="secondary"
                    size="small"
                  />
                  <Button
                    label="Disconnect"
                    onClick={() => disconnectWallet(address)}
                    variant="secondary"
                    size="small"
                  />
                </Box>
              )}
            </Box>

            <Box
              style={{
                position: "relative",
                height: "400px",
                marginBottom: "24px",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <View3D env={demoMode === "play" ? "mine" : "item"}>
                {demoMode === "play" ? (
                  <MiningGame />
                ) : (
                  <ItemViewer3D>
                    <PickAxe mintStatus={mintStatus} />
                  </ItemViewer3D>
                )}
              </View3D>
            </Box>

            <Box style={{ display: "flex", justifyContent: "center" }}>
              {hasPickaxe ? (
                <Text
                  variant="medium"
                  weight="bold"
                  color="positive"
                  style={{ userSelect: "none" }}
                >
                  Ready to mine!
                </Text>
              ) : (
                <Box
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  gap="3"
                >
                  {mintStatus === "pending" ? (
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Spinner size="small" />
                      <Text>Minting...</Text>
                    </Box>
                  ) : (
                    <>
                      {mintStatus === "failed" ? (
                        <>
                          <Text color="negative" marginBottom="2">
                            Minting failed. Please try again.
                          </Text>
                          <Button
                            label="Retry Mint"
                            onClick={runMintNFT}
                            size="large"
                            variant="primary"
                          />
                        </>
                      ) : (
                        <>
                          <Text>Mint a Pick Axe NFT to start mining.</Text>
                          <Button
                            label="Mint Pick Axe NFT"
                            onClick={runMintNFT}
                            size="large"
                            variant="primary"
                          />
                        </>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        ) : (
          <Card
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Text variant="large" style={{ marginBottom: "24px" }}>
              Welcome to Mining Quest
            </Text>
            <Image
              borderRadius="md"
              width="full"
              src="./cover.webp"
              alt="Mining Quest"
            />
            <Button
              marginTop="6"
              label="Connect Wallet"
              onClick={() => setOpenConnectModal(true)}
              size="xlarge"
              variant="primary"
            />
          </Card>
        )}
      </Box>
    </Box>
  );
};
