import { FC, useState, useEffect } from "react";
import { Button, Box, Text, Card, Spinner } from "@0xsequence/design-system";
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
  const { setOpenConnectModal } = useOpenConnectModal();
  const { setOpenWalletModal } = useOpenWalletModal();
  const { wallets, setActiveWallet, disconnectWallet } = useKitWallets();

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
    reset: resetWriteContract,
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

  // Handle mint transaction status changes
  useEffect(() => {
    if (isPendingMintTxn) {
      setMintStatus("pending");
    } else if (mintTxnData) {
      setMintStatus("successs");
      // add a bit of delay before setting the demo mode to play
      setTimeout(() => {
        refetchNftBalance();
      }, 1500);
    }
  }, [isPendingMintTxn, mintTxnData]);

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
        padding: "24px",
      }}
    >
      <Box style={{ maxWidth: "800px" }}>
        {wallets.length > 0 ? (
          <Card style={{ padding: "24px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <Box
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Text color="text100">Connected:</Text>
                <Text truncate>{address}</Text>
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
                <Text variant="medium" weight="bold" color="positive">
                  Ready to mine!
                </Text>
              ) : (
                <Box
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  gap="3"
                >
                  <Text>Mint a Pick Axe NFT to start mining.</Text>
                  <Button
                    label="Mint Pick Axe NFT"
                    onClick={runMintNFT}
                    isLoading={isPendingMintTxn}
                    size="large"
                    variant="primary"
                  />
                </Box>
              )}
            </Box>
          </Card>
        ) : (
          <Card
            flexDirection="column"
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Text variant="large" style={{ marginBottom: "24px" }}>
              Welcome to Mining Game
            </Text>
            <Button
              label="Connect Your Wallet to Get Started"
              onClick={() => setOpenConnectModal(true)}
              size="large"
              variant="primary"
            />
          </Card>
        )}
      </Box>
    </Box>
  );
};
