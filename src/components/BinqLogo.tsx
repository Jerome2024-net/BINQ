import { ShoppingBasket } from "lucide-react";

type BinqLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
};

const sizeClasses = {
  sm: {
    mark: "h-8 w-8 rounded-xl",
    icon: "h-4 w-4",
    text: "text-xl",
  },
  md: {
    mark: "h-9 w-9 rounded-xl",
    icon: "h-5 w-5",
    text: "text-2xl",
  },
  lg: {
    mark: "h-10 w-10 rounded-2xl",
    icon: "h-5 w-5",
    text: "text-2xl",
  },
  xl: {
    mark: "h-12 w-12 rounded-2xl",
    icon: "h-6 w-6",
    text: "text-3xl",
  },
};

export default function BinqLogo({ className = "", size = "md", inverted = false }: BinqLogoProps) {
  const classes = sizeClasses[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()} aria-label="Binq">
      <span className={`flex shrink-0 items-center justify-center bg-[#14852f] text-white shadow-sm shadow-emerald-600/25 ${classes.mark}`}>
        <ShoppingBasket className={classes.icon} aria-hidden="true" />
      </span>
      <span className={`font-black leading-none tracking-[-0.05em] ${inverted ? "text-[#14852f]" : "text-[#14852f]"} ${classes.text}`}>
        Binq
      </span>
    </span>
  );
}
