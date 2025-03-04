import useSound from "use-sound";

export function ActivityButton(
  props: { children: React.ReactNode } & React.ComponentProps<"button">,
) {
  const { children, ...rest } = props;

  const [buttonPress] = useSound("/audio/pop.mp3");
  return (
    <button
      type="button"
      {...rest}
      onMouseDown={() => buttonPress()}
      className="cursor-pointer relative group active:translate-y-0.25 rounded-full
      hover:shadow-[0_0_10px_0_theme(colors.white/50%)]
      hover:-translate-y-0.25
transition-all"
    >
      <div
        className="absolute inset-0.75 size-[calc(100%-6px)] group-hover:opacity-100
  group-active:hidden
  shadow-[0_1px_6px_6px_theme(colors.amber.500/80%)_inset]
  mix-blend-hard-light
  opacity-0
  transition-opacity
  rounded-full
"
      ></div>
      <div
        className="absolute inset-0 size-full group-active:block hidden
        shadow-[0_6px_6px_6px_theme(colors.black/60%)_inset]
        z-10
        bg-black/20
        rounded-full
      "
      ></div>
      <span className="text-17 font-semibold text-[#252525] uppercase rounded-full bg-gradient-to-b from-[#FEA41A] to-[#FEBE38] p-0.25 flex  z-0">
        <span className="rounded-full bg-gradient-to-b from-[#FED328] via-50% via-[#FD451C] to-[95%] to-[#7A280D] block p-1">
          <span className="rounded-full bg-gradient-to-b from-[#FED831] to-[#FD994F] flex py-1 px-4 shadow-[0_1px_0_0_theme(colors.white/20%)_inset] ">
            {children}
          </span>
        </span>
      </span>
    </button>
  );
}
