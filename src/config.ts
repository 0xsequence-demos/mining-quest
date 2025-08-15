import { ConnectConfig, createConfig } from "@0xsequence/connect";
import { Signers, Utils } from "@0xsequence/wallet-core";

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

const nftPermissions2 = Utils.PermissionBuilder.for(demoNftContractAddress)
  .forFunction({
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  })
  .build();

export const permissions: Signers.Session.ExplicitParams = {
  chainId: BigInt(demoNftContractChainId),
  valueLimit: 0n,
  deadline: BigInt(Date.now() + 1000 * 60 * 500000),
  permissions: [nftPermissions, nftPermissions2],
};

export const config = createConfig({
  ...connectConfig,
  walletUrl: "https://v3.sequence-dev.app",
  dappOrigin: window.location.origin,
  appName: GAME_NAME,
  chainIds: [demoNftContractChainId],
  defaultChainId: demoNftContractChainId,
  email: false,
  apple: false,
  signIn: {
    descriptiveSocials: true,
    disableTooltipForDescriptiveSocials: true,
  },
  walletConnect: {
    projectId: walletConnectProjectId,
  },
  google: true,
  permissions: permissions,
});
