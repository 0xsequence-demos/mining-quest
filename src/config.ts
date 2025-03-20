import { ConnectConfig, createConfig } from "@0xsequence/connect";

import LogoImg from "./components/Logo.tsx";

const GAME_NAME = "Mining Quest";

export const demoNftContractAddress = import.meta.env
  .VITE_DEMO_NFT_CONTRACT_ADDRESS;
export const demoNftContractChainId = parseInt(
  import.meta.env.VITE_DEMO_NFT_CONTRACT_CHAIN_ID
);

const walletAppName = import.meta.env.VITE_WALLET_APP_NAME;
const walletLogo = import.meta.env.VITE_WALLET_APP_LOGO;
const waasConfigKey = import.meta.env.VITE_WAAS_CONFIG_KEY;
const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY;
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const walletAppUrl = import.meta.env.VITE_WALLET_APP_URL;

export const connectConfig: ConnectConfig = {
  projectAccessKey,
  defaultTheme: "dark",
  signIn: {
    projectName: GAME_NAME,
  },
  displayedAssets: [
    // Demo nft
    {
      contractAddress: demoNftContractAddress,
      chainId: demoNftContractChainId,
    },
  ],
};

export const config = createConfig("waas", {
  ...connectConfig,
  appName: GAME_NAME,
  chainIds: [demoNftContractChainId],
  defaultChainId: demoNftContractChainId,
  waasConfigKey,
  email: false,
  signIn: {
    descriptiveSocials: true,
  },
  ecosystem: {
    walletUrl: walletAppUrl,
    name: walletAppName,
    projectAccessKey,
    logoLight: LogoImg(walletLogo),
    logoDark: LogoImg(walletLogo),
    defaultNetwork: demoNftContractChainId,
  },
  walletConnect: {
    projectId: walletConnectProjectId,
  },
});
