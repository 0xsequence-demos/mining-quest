import { truncateAddress } from "@0xsequence/design-system";
import { ActionButton } from "./ActionButton";
import { useOpenWalletModal } from "@0xsequence/wallet-widget";
import { Overlay } from "./Overlay";
import { TextStroke } from "./TextStroke";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import { MintStatus } from "./3d/PickAxe";

type TopHudProps = {
  gemsMinted: string;
  address?: `0x${string}`;
  demoMode: "play" | "mint";
  mintStatus: MintStatus;
  disconnectWallet: (walletAddress: string) => Promise<void>;
};

export function TopHud(props: TopHudProps) {
  const { gemsMinted, address, demoMode, mintStatus, disconnectWallet } = props;

  const { setOpenWalletModal } = useOpenWalletModal();
  const [recentMint, setRecentMint] = useState(false);
  const [claimGem] = useSound("/audio/gem-shine.mp3");

  useEffect(() => {
    if (mintStatus === "success") {
      setRecentMint(true);
      claimGem();
      setTimeout(() => setRecentMint(false), 500);
    }
  }, [mintStatus]);
  if (!address) return null;

  return (
    <>
      <div className="md:absolute top-0 z-1 md:size-full md:py-8 -mb-8 text-[10px] md:text-[12px] font-medium flex justify-between items-start md:px-14 gap-2 md:gap-2 pointer-events-none w-full px-0 scale-85 md:scale-100">
        <div className="flex w-full justify-between items-center gap-6 text-white">
          {demoMode === "play" ? (
            <>
              <div className="[background-image:url('/hud/inventory-bg@2x.webp')] bg-cover bg-no-repeat size-16 rounded-full">
                <ActionButton
                  label="Inventory"
                  variant={demoMode}
                  onClick={() => setOpenWalletModal(true)}
                  style={{} as React.CSSProperties}
                >
                  <span className="z-1 mt-auto mb-1 flex-shrink-0 group-hover:translate-y-[1px] transition-transform group-hover:scale-95">
                    <Overlay>
                      <TextStroke
                        textStroke="text-stroke-5"
                        textColor="text-[#ffff84]"
                        strokeColor="text-[#252525]"
                        className="text-18 whitespace-nowrap font-semibold"
                      >
                        {truncateAddress(address as string, 2, 3)}
                      </TextStroke>
                    </Overlay>
                  </span>
                  <img
                    src="/hud/inventory@2x.webp"
                    width="33"
                    height="37"
                    alt=""
                    className="absolute z-0 mb-1 group-hover:-translate-y-0.75 group-hover:scale-105 transition-transform"
                  />
                </ActionButton>
              </div>

              <span className="size-16 flex items-center justify-center flex-col ml-0">
                <Overlay>
                  <span
                    className="data-[minting='true']:scale-150 transition-all"
                    data-minting={recentMint}
                  >
                    <Overlay>
                      <img
                        src="/hud/gems@2x.webp"
                        width="155"
                        height="112"
                        className="mb-4 z-10 mix-blend-color-dodge"
                      />
                      <img
                        src="/hud/gems-mask@2x.webp"
                        width="155"
                        height="112"
                        className="mb-4 blur data-[minting='true']:animate-beacon data-[minting='true']:block hidden"
                        data-minting={recentMint}
                      />
                      <img
                        src="/hud/gems-border@2x.webp"
                        width="155"
                        height="112"
                        className="mb-4 z-[5] mix-blend-soft-light"
                      />
                    </Overlay>
                  </span>
                  <span className="z-20">
                    <Overlay>
                      <TextStroke
                        textStroke="text-stroke-6"
                        textColor="text-[#ffff84]"
                        strokeColor="text-[#252525]"
                        className="text-29 whitespace-nowrap mt-5 font-semibold data-[minting='true']:scale-110 data-[minting='true']:translate-y-1 transition-transform"
                        data-minting={recentMint}
                      >
                        {gemsMinted.toString()}
                      </TextStroke>
                    </Overlay>
                  </span>
                </Overlay>
              </span>
            </>
          ) : null}
          <div className="[background-image:url('/hud/logout-bg@2x.webp')] bg-cover bg-no-repeat size-16 rounded-full ml-auto mr-0">
            <ActionButton
              variant={demoMode}
              label="Disconnect"
              onClick={() => disconnectWallet(address)}
            >
              <img src="/hud/logout@2x.webp" width="32" alt="" />
            </ActionButton>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 z-1 w-full pb-2 text-[10px] md:text-[12px] font-medium flex justify-center gap-1 md:gap-2 "></div>
    </>
  );
}
