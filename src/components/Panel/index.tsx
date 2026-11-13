import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

/**
 * The app's card surface: rounded, outlined and filled with the surface color.
 * Layout (padding, gap, overflow) stays with the caller through `className`,
 * which can also override any of it.
 */
const Panel = ({
    as: Tag = "div",
    className,
    ...props
}: ComponentPropsWithoutRef<"div"> & {
    /** `section` for a labelled region (pass `aria-labelledby`) */
    as?: "div" | "section";
}) => (
    <Tag
        {...props}
        className={twMerge(
            "rounded-2xl border border-line bg-surface",
            className
        )}
    />
);

export default Panel;
