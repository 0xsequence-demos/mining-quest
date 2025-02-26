import React from "react";

const LogoImg = (src: string) => {
  const Logo: React.FC = () => (
    <img
      src={src}
      alt="Logo"
      style={{
        maxWidth: "24px",
        height: "24px",
        objectFit: "contain",
      }}
    />
  );
  return Logo;
};

export default LogoImg;
