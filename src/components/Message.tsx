export function Message(
  props: { children: React.ReactNode } & React.ComponentProps<"span">,
) {
  const { children, ...rest } = props;
  return (
    <span
      className="text-white text-17 font-semibold uppercase rounded-full bg-gradient-to-b from-black to-black/50  px-5.25 py-2.25 flex z-0"
      {...rest}
    >
      {children}
    </span>
  );
}
