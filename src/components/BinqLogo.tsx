import Image from "next/image";

const BINQ_LOGO_URL = "https://res.cloudinary.com/dn8ed1doa/image/upload/82D516A1-AEEB-4D11-B7F0-C0DB72341613_gz12tn";

type BinqLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
};

const sizeClasses = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
};

export default function BinqLogo({ className = "", size = "md", inverted = false }: BinqLogoProps) {
  return (
    <Image
      src={BINQ_LOGO_URL}
      alt="Binq"
      width={160}
      height={64}
      className={`${sizeClasses[size]} w-auto object-contain ${inverted ? "brightness-0 invert" : ""} ${className}`.trim()}
    />
  );
}
