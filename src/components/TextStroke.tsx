export function TextStroke(
  props: {
    strokeColor: string;
    textColor: string;
    textStroke: string;
    children: string;
  } & React.ComponentProps<"span">,
) {
  const {
    children,
    textColor,
    strokeColor,
    textStroke,
    className = "",
    ...rest
  } = props;

  return (
    <>
      <span
        {...rest}
        className={`${className} ${strokeColor} ${textStroke}`}
        // className="text-16 whitespace-nowrap mt-auto mb-0 text-[#252525] col-start-1 row-start-1 "
        aria-hidden="true"
      >
        {children}
      </span>
      <span className={`${className} ${textColor}`} {...rest}>
        {children}
      </span>
    </>
  );
}
