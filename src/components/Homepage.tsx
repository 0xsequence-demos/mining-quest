import { FC } from "react";
import { Button } from "@0xsequence/design-system";
import { useOpenConnectModal } from "@0xsequence/kit";

export const Homepage: FC = () => {
  const { setOpenConnectModal } = useOpenConnectModal();

  return (
    <div>
      <Button onClick={() => setOpenConnectModal(true)}>Connect Wallet</Button>
    </div>
  );
};
