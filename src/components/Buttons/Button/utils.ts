import { twMerge } from "tailwind-merge";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "link"
    | "field";
export type ButtonSize = "sm" | "md" | "lg";

const base =
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
    primary: "bg-ink text-paper",
    secondary:
        "border-[1.5px] border-line-strong bg-surface text-ink hover:bg-chip",
    ghost: "text-muted hover:bg-chip hover:text-ink",
    // text only: no box, so it is tighter than the other variants
    link: "px-2 text-accent hover:text-accent-strong",
    // looks like the search box and the sort select it sits beside
    field: "rounded-xl border-2 border-line bg-paper font-bold text-ink hover:border-line-strong hover:bg-surface",
};

const sizes: Record<ButtonSize, string> = {
    sm: "h-8 rounded-lg px-3 text-[13px]",
    md: "h-10 rounded-[10px] px-3 text-sm",
    lg: "h-11 rounded-[10px] px-5 text-sm",
};

// a square button holding only an icon
const iconSizes: Record<ButtonSize, string> = {
    sm: "size-8 rounded-lg text-[13px]",
    md: "size-10 rounded-[10px] text-sm",
    lg: "size-11 rounded-[10px] text-sm",
};

/**
 * The classes of a `Button`, for elements that cannot be one (a router `Link`).
 * Later arguments win, so `className` can override any of it.
 */
export const buttonClass = ({
    variant = "secondary",
    size = "md",
    icon = false,
    className,
}: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: boolean;
    className?: string;
} = {}) =>
    twMerge(
        base,
        icon ? iconSizes[size] : sizes[size],
        variants[variant],
        className
    );
