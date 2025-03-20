import { ThemeProvider } from "@0xsequence/design-system";

import { SequenceConnect } from "@0xsequence/connect";
import { SequenceWalletProvider } from "@0xsequence/wallet-widget";

import { Homepage } from "./components/Homepage";
import { config } from "./config";

export const App = () => {
  return (
    <ThemeProvider theme="dark">
      <SequenceConnect config={config}>
        <SequenceWalletProvider>
          <Homepage />
        </SequenceWalletProvider>
      </SequenceConnect>
    </ThemeProvider>
  );
};
