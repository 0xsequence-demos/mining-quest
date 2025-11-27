import {
  ConnectConfig,
  createConfig,
  ExplicitSessionParams,
} from "@0xsequence/connect";
import { Utils } from "@0xsequence/wallet-core";

const GAME_NAME = "Mining Quest";

export const demoNftContractAddress = import.meta.env
  .VITE_DEMO_NFT_CONTRACT_ADDRESS;
export const demoNftContractChainId = parseInt(
  import.meta.env.VITE_DEMO_NFT_CONTRACT_CHAIN_ID
);

const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY;
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const connectConfig: ConnectConfig = {
  projectAccessKey,
  defaultTheme: "dark",
  signIn: {
    projectName: GAME_NAME,
    descriptiveSocials: true,
    disableTooltipForDescriptiveSocials: true,
  },
  displayedAssets: [
    // Demo nft
    {
      contractAddress: demoNftContractAddress,
      chainId: demoNftContractChainId,
    },
  ],
  readOnlyNetworks: [demoNftContractChainId],
};

const nftPermissions = Utils.PermissionBuilder.for(demoNftContractAddress)
  .forFunction({
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    name: "batchMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  })

  .build();

// can be enabled to allow transfers as well, but sequence connector can also open wallet for txns that do not have permissions

// const nftPermissions2 = Utils.PermissionBuilder.for(demoNftContractAddress)
//   .forFunction({
//     inputs: [
//       {
//         internalType: "address",
//         name: "from",
//         type: "address",
//       },
//       {
//         internalType: "address",
//         name: "to",
//         type: "address",
//       },
//       {
//         internalType: "uint256[]",
//         name: "ids",
//         type: "uint256[]",
//       },
//       {
//         internalType: "uint256[]",
//         name: "values",
//         type: "uint256[]",
//       },
//       {
//         internalType: "bytes",
//         name: "data",
//         type: "bytes",
//       },
//     ],
//     name: "safeBatchTransferFrom",
//     outputs: [],
//     stateMutability: "nonpayable",
//     type: "function",
//   })
//   .build();

export const explicitSession: ExplicitSessionParams = {
  chainId: demoNftContractChainId,
  nativeTokenSpending: {
    valueLimit: 0n,
  },
  expiresIn: { days: 30 },
  permissions: [nftPermissions],
};

// check if search param "walletUrl" is set
// if set, use it as walletUrl
// if not, use default walletUrl
//
const searchParams = new URLSearchParams(window.location.search);
// Accept walletUrl in any case or separator style (walletUrl, walleturl, wallet_url, etc.)
const walletUrlSearchKey = Array.from(searchParams.keys()).find(
  (key) => key.replace(/[_-]/g, "").toLowerCase() === "walleturl"
);

const normalizeWalletUrl = (url: string) => url.replace(/\/+$/, "");

const rawWalletUrl =
  (walletUrlSearchKey && searchParams.get(walletUrlSearchKey)) ||
  "https://v3.sequence-dev.app";

export const walletUrl = normalizeWalletUrl(rawWalletUrl);

export const config = createConfig({
  ...connectConfig,
  walletUrl,
  dappOrigin: window.location.origin,
  appName: GAME_NAME,
  chainIds: [demoNftContractChainId],
  defaultChainId: demoNftContractChainId,
  email: true,
  apple: true,
  passkey: true,
  // signIn: {
  //   descriptiveSocials: true,
  //   disableTooltipForDescriptiveSocials: true,
  // },
  walletConnect: {
    projectId: walletConnectProjectId,
  },
  google: true,
  explicitSessionParams: explicitSession,
});
