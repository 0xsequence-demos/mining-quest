import useSound from "use-sound";

export function ActionButton(
  props: {
    children: React.ReactNode;
    label: string;
    variant: "mint" | "play";
  } & React.ComponentProps<"button">,
) {
  const { variant = "game", label, children, ...rest } = props;
  const [buttonPress] = useSound("/audio/pop.mp3");

  return (
    <button
      onMouseDown={() => buttonPress()}
      type="button"
      className="
      group size-16 rounded-full bg-gradient-to-b from-[#332D24] to-[#34302C] p-0.75 flex items-center justify-center relative pointer-events-auto cursor-pointer
      data-[variant='play']:mix-blend-hard-light
      data-[variant='mint']:from-[#433F89] data-[variant='mint']:to-[#433F89]
      hover:shadow-[0_0_10px_0_theme(colors.white/30%)]
      hover:-translate-y-0.25
      active:translate-y-0.25
      transition-all
      "
      data-variant={variant}
      {...rest}
    >
      <div
        className="absolute inset-0 size-full group-active:block hidden
        shadow-[0_6px_6px_6px_theme(colors.black/60%)_inset]
        mix-blend-darken
        border-white border
        bg-black/20
        rounded-full
      "
      ></div>

      <div
        className="absolute inset-0.75 size-[calc(100%-6px)] group-hover:opacity-100
        group-active:hidden
        shadow-[0_1px_6px_6px_theme(colors.white/20%)_inset]
        mix-blend-hard-light
        opacity-0
        transition-opacity
        rounded-full
      "
      ></div>

      <span
        className="
          flex items-center justify-center size-full bg-gradient-to-b from-[#B08D5C] to-[#2F1E0E] rounded-full p-0.5
          data-[variant='mint']:from-[#7D79D3] data-[variant='mint']:to-[#49489E]
        "
        data-variant={variant}
      >
        <span
          className="
            flex items-center justify-center size-full bg-gradient-to-b from-[#9B8569] to-[#473117] rounded-full p-0.75
            data-[variant='mint']:from-[#6B67CE] data-[variant='mint']:to-[#49489E]
          "
          data-variant={variant}
        >
          <span
            className="
            flex items-center justify-center size-full bg-gradient-to-b from-[#BC8F61] to-[#7A654E] rounded-full p-0.5
            data-[variant='mint']:from-[#6A66D4] data-[variant='mint']:to-[#5C5CB6]
            "
            data-variant={variant}
          ></span>
        </span>
      </span>
      <span className="size-full inset-0 absolute flex items-center justify-center z-50 group-active:translate-y-[2px] group-active:opacity-70 transition-all">
        {children}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
