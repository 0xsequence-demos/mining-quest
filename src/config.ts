import { KitConfig, createConfig } from "@0xsequence/kit";
import { ChainId } from "@0xsequence/network";
import SoneiumLogo from "./components/icons/SoneiumLogo";

export const DEMO_NFT_CONTRACT_ADDRESS =
  "0x5bcbc265a86fda3502e12cf17947445f7fd4402a";

const projectAccessKey = "AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI";
const walletConnectProjectId = "c65a6cb1aa83c4e24500130f23a437d8";

const urlParams = new URLSearchParams(window.location.search);
const walletAppUrl =
  urlParams.get("walletAppUrl") ?? "https://wallet.soneium-demo.xyz";

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
      chainId: ChainId.SONEIUM_MINATO,
    },
  ],
};

export const config = createConfig("waas", {
  ...kitConfig,
  appName: "Kit Demo",
  chainIds: [ChainId.SONEIUM_MINATO],
  defaultChainId: ChainId.SONEIUM_MINATO,
  waasConfigKey:
    "eyJwcm9qZWN0SWQiOjE2ODE1LCJlbWFpbFJlZ2lvbiI6ImNhLWNlbnRyYWwtMSIsImVtYWlsQ2xpZW50SWQiOiI2N2V2NXVvc3ZxMzVmcGI2OXI3NnJoYnVoIiwicnBjU2VydmVyIjoiaHR0cHM6Ly93YWFzLnNlcXVlbmNlLmFwcCJ9",
  email: false,
  signIn: {
    descriptiveSocials: true,
  },
  ecosystem: {
    walletUrl: walletAppUrl,
    name: "Soneium",
    projectAccessKey,
    logoLight: SoneiumLogo,
    logoDark: SoneiumLogo,
    // iconWidth: "100px",
    defaultNetwork: ChainId.SONEIUM_MINATO,
  },
  walletConnect: {
    projectId: walletConnectProjectId,
  },
});
