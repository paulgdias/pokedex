import { Button as AriaButton, ButtonProps } from "react-aria-components";

import { ButtonSize, ButtonVariant, buttonClass } from "./utils";

/**
 * The app's standard button: a react-aria `Button` with one set of looks
 * (`variant`), heights (`size`) and an `icon` square mode, so a screen never
 * hand-writes the same box again. `className` overrides any of it.
 */
const Button = ({
    variant,
    size,
    icon,
    className,
    ...props
}: Omit<ButtonProps, "className"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** a square button holding only an icon; give it an `aria-label` */
    icon?: boolean;
    className?: string;
}) => (
    <AriaButton
        {...props}
        className={buttonClass({ variant, size, icon, className })}
    />
);

export default Button;
