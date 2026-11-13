import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

/**
 * The top block of a page (title, controls) above the scrolling content: a
 * column with the page's horizontal gutter and a bottom rule. Add the `gap`
 * and any background through `className`.
 */
const PageHeader = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => (
    <div
        {...props}
        className={twMerge(
            "flex flex-col border-b border-line px-4 pt-6 pb-5 lg:px-8",
            className
        )}
    />
);

export default PageHeader;
