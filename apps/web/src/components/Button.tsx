import clsx from "clsx";
import React, { type ReactElement } from "react";
import ShouldRender from "./ShouldRender";
import Spinner from "./Spinner";

type HTMLButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

type HTMLAnchorProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

const BUTTON_CLASSES =
  "inline-flex items-center font-base disabled:cursor-not-allowed";

type ButtonVariant =
  | "primary"
  | "gradient"
  | "secondary"
  | "transparent"
  | "danger"
  | "text";

type SpinnerVariants = "white" | "dark";

type ButtonSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";

type ButtonIconPosition = "start" | "end";

type ButtonStyle = {
  loading?: boolean;
  disabled?: boolean;
  absolute?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  spinnerVariant?: SpinnerVariants;
};

type ButtonProps = {
  icon?: ReactElement;
  iconPosition?: ButtonIconPosition;
  textClass?: string;
} & ButtonStyle;

const BUTTON_SIZES = {
  xs: "text-xs px-2.5 py-1.5",
  sm: "text-sm px-3 py-2 leading-4",
  base: "text-base px-4 py-2",
  lg: "text-lg px-4 py-2",
  xl: "text-xl px-6 py-3",
  "2xl": "text-2xl px-8 py-3 md:py-4 md:text-2xl md:px-8",
};

const ICON_SIZE_CLASSES = {
  xs: "h-4 w-4",
  sm: "h-4 w-4",
  base: "h-5 w-5",
  lg: "h-5 w-5",
  xl: "h-5 w-5",
  "2xl": "h-6 w-6",
};

const BUTTON_VARIANTS = {
  primary: "bg-blue-500 text-white hover:opacity-80",
  gradient:
    "bg-gradient-to-tl from-green-400 via-blue-400 dark:to-blue-800 to-blue-500 text-white bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500",
  secondary:
    "bg-blue-500 dark:bg-teal-900 text-white hover:opacity-80 shadow-sm",
  transparent: "border-transparent hover:opacity-80",
  danger:
    "text-white border-red-700 bg-red-500 hover:bg-red-600 hover:border-red-800",
  text: "border-transparent text-neutral-800 hover:text-neutral-500 dark:text-white dark:hover:text-gray-400",
};

const getButtonClasses = (
  style: ButtonStyle = {},
  icon?: boolean,
  ...rest: string[]
) => {
  const {
    loading,
    size = "base",
    variant = "secondary",
    absolute = false,
  } = style;
  return clsx(
    BUTTON_CLASSES,
    loading && "pointer-events-none opacity-60",
    absolute ? "absolute" : "relative",
    BUTTON_SIZES[size],
    BUTTON_VARIANTS[variant],
    icon && "flex w-full justify-center gap-2",
    ...rest
  );
};

const ButtonContent: React.FC<{
  loading?: boolean;
  size?: ButtonSize;
  icon?: ReactElement;
  iconPosition?: ButtonIconPosition;
  children?: React.ReactNode;
  textClass?: string;
  variant?: ButtonVariant;
  spinnerVariant?: SpinnerVariants;
}> = ({
  loading,
  icon,
  iconPosition = "start",
  size = "base",
  children,
  textClass = "",
  variant,
  spinnerVariant,
}) => {
  // If button has no background and no custom spinner color, the spinner should contrast with the theme.
  const isTransparentButtonWithoutSpinnerVariant =
    !spinnerVariant && variant !== "transparent" && variant !== "text";

  return (
    <React.Fragment>
      <ShouldRender if={loading}>
        <span className="absolute left-1/2 top-1/2 h-5 -translate-x-1/2 -translate-y-1/2">
          <Spinner
            alwaysWhite={
              isTransparentButtonWithoutSpinnerVariant ||
              spinnerVariant === "white"
            }
            alwaysDark={spinnerVariant === "dark"}
          />
        </span>
      </ShouldRender>

      <ShouldRender if={icon && iconPosition === "start"}>
        <span className={clsx({ invisible: loading }, ICON_SIZE_CLASSES[size])}>
          {icon}
        </span>
      </ShouldRender>
      <span className={clsx({ invisible: loading }, textClass)}>
        {children}
      </span>
      <ShouldRender if={icon && iconPosition === "end"}>
        <span className={clsx({ invisible: loading }, ICON_SIZE_CLASSES[size])}>
          {icon}
        </span>
      </ShouldRender>
    </React.Fragment>
  );
};

/**
 * Button component that renders an `<a>` element
 *
 * Wrap with next.js `<Link passHref legacyBehavior>` for client side routing.
 *
 * https://nextjs.org/docs/api-reference/next/link#if-the-child-is-a-custom-component-that-wraps-an-a-tag
 */
export const ButtonLink = React.forwardRef<
  HTMLAnchorElement,
  ButtonProps & HTMLAnchorProps
>((props, ref) => {
  const {
    children,
    className = "",
    disabled,
    size,
    variant,
    icon,
    iconPosition,
    loading,
    textClass,
    ...rest
  } = props;
  return (
    <a
      className={getButtonClasses(
        { size, variant, loading },
        !!icon,
        className
      )}
      ref={ref}
      aria-disabled={disabled}
      {...rest}
    >
      <ButtonContent {...props} textClass={textClass} variant={variant} />
    </a>
  );
});
ButtonLink.displayName = "ButtonLink";

/**
 * Button component that renders a `<button>` element
 *
 * @see {@link ButtonLink} for rendering an `<a>` element
 */
const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & HTMLButtonProps
>((props, ref) => {
  const {
    children,
    className = "",
    absolute,
    disabled,
    size,
    variant,
    icon,
    iconPosition,
    textClass,
    loading,
    ...rest
  } = props;
  return (
    <button
      className={getButtonClasses(
        { size, variant, absolute, loading },
        !!icon,
        className
      )}
      ref={ref}
      type="button"
      aria-disabled={disabled}
      disabled={disabled}
      {...rest}
    >
      <ButtonContent {...props} textClass={textClass} variant={variant} />
    </button>
  );
});

Button.displayName = "Button";

export default Button;
