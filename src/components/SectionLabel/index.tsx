import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

/**
 * The small uppercase label above a group of content ("Abilities", "Fire
 * attacking"). Render it as the heading that names a section with `as`.
 */
const SectionLabel = ({
    as: Tag = "div",
    className,
    ...props
}: ComponentPropsWithoutRef<"div"> & {
    as?: "div" | "h2" | "h3" | "span";
}) => (
    <Tag
        {...props}
        className={twMerge(
            "text-[13px] font-bold tracking-wider text-muted uppercase",
            className
        )}
    />
);

export default SectionLabel;
