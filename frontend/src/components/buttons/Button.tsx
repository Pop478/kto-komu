import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './button.module.css'

export type ButtonColor = 'gray' | 'brand' | 'error' | 'warning' | 'success'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'
export type IconPosition = 'left' | 'right'

const COLOR_CLASSES: Record<ButtonColor, string> = {
    gray: styles.gray,
    brand: styles.brand,
    error: styles.error,
    warning: styles.warning,
    success: styles.success,
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
    xl: styles.xl,
}

export type ButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color'
> & {
    children?: ReactNode
    icon?: ReactNode
    iconPosition?: IconPosition
    color?: ButtonColor
    size?: ButtonSize
    /** Renders a square button when no text or children are supplied. */
    iconOnly?: boolean
    fullWidth?: boolean
    loading?: boolean
    textClassName?: string
}

const Button = ({
    children,
    icon,
    iconPosition = 'left',
    color = 'brand',
    size = 'md',
    iconOnly,
    fullWidth = false,
    loading = false,
    textClassName,
    className,
    disabled,
    type = 'button',
    ...props
}: ButtonProps) => {
    const content = children
    const hasText =
        content !== undefined && content !== null && content !== false
    const isIconOnly = iconOnly ?? (Boolean(icon) && !hasText)
    const isDisabled = disabled || loading

    const iconElement = icon && !loading && (
        <span className={styles.icon} aria-hidden="true">
            {icon}
        </span>
    )

    return (
        <button
            {...props}
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={clsx(
                styles.button,
                SIZE_CLASSES[size],
                COLOR_CLASSES[color],
                isIconOnly && styles.iconOnly,
                fullWidth && styles.fullWidth,
                className,
            )}
        >
            {loading && <span className={styles.loader} aria-hidden="true" />}
            {iconPosition === 'left' && iconElement}
            {hasText && (
                <span className={clsx(styles.text, textClassName)}>
                    {content}
                </span>
            )}
            {iconPosition === 'right' && iconElement}
        </button>
    )
}

export default Button
