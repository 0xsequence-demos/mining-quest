import { FC } from "react";

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SoneiumLogo: FC<LogoProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 37 36"
    role="img"
    {...props}
  >
    <title>Soneium</title>
    <path
      fill="currentColor"
      d="M20.323 27.735a9.989 9.989 0 0 1-9.388-2.642 9.686 9.686 0 0 1-1.57-12.062 16.797 16.797 0 0 1 2.72-3.354c3.322-3.31 9.422-9.333 9.422-9.333A18 18 0 0 0 .536 13.648 18.014 18.014 0 0 0 12.797 35.25l7.526-7.515Z"
    />
    <path
      fill="currentColor"
      d="M15.69 8.272a9.98 9.98 0 0 1 9.387 2.642c3.292 3.293 3.935 8.18 1.558 12.044a16.999 16.999 0 0 1-2.72 3.36c-3.323 3.305-9.423 9.332-9.423 9.332a18 18 0 0 0 21.002-13.3A18.013 18.013 0 0 0 23.198.74L15.69 8.272Z"
    />
  </svg>
);

export default SoneiumLogo;
