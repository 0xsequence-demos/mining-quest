import { KitConfig, createConfig } from "@0xsequence/kit";
import { ChainId } from "@0xsequence/network";
import SoneiumLogo from "./components/icons/SoneiumLogo";

export const DEMO_NFT_CONTRACT_ADDRESS =
  "0x631980c251af5b4e71429ccc95f77155d75b89d4";

const projectAccessKey = "AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI";
const walletConnectProjectId = "c65a6cb1aa83c4e24500130f23a437d8";

export const kitConfig: KitConfig = {
  projectAccessKey,
  defaultTheme: "dark",
  signIn: {
    projectName: "Kit Demo",
  },
  displayedAssets: [
    // Demo nft
    {
      contractAddress: DEMO_NFT_CONTRACT_ADDRESS,
      chainId: ChainId.ARBITRUM_SEPOLIA,
    },
  ],
};

export const config = createConfig("waas", {
  ...kitConfig,
  appName: "Kit Demo",
  chainIds: [ChainId.ARBITRUM_SEPOLIA],
  defaultChainId: ChainId.ARBITRUM_SEPOLIA,
  waasConfigKey:
    "eyJwcm9qZWN0SWQiOjE2ODE1LCJlbWFpbFJlZ2lvbiI6ImNhLWNlbnRyYWwtMSIsImVtYWlsQ2xpZW50SWQiOiI2N2V2NXVvc3ZxMzVmcGI2OXI3NnJoYnVoIiwicnBjU2VydmVyIjoiaHR0cHM6Ly93YWFzLnNlcXVlbmNlLmFwcCJ9",
  email: false,
  ecosystem: {
    walletUrl: "https://wallet.soneium-demo.xyz",
    name: "Soneium",
    projectAccessKey,
    logoLight: SoneiumLogo,
    logoDark: SoneiumLogo,
    iconWidth: "100px",
    defaultNetwork: ChainId.ARBITRUM_SEPOLIA,
  },
  walletConnect: {
    projectId: walletConnectProjectId,
  },
});
