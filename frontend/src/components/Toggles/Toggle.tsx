import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './toggle.module.css'

export type ToggleColor = 'gray' | 'brand' | 'error' | 'warning' | 'success'
export type ToggleSize = 'sm' | 'md' | 'lg' | 'xl'

const COLOR_CLASSES: Record<ToggleColor, string> = {
    gray: styles.gray,
    brand: styles.brand,
    error: styles.error,
    warning: styles.warning,
    success: styles.success,
}

const SIZE_CLASSES: Record<ToggleSize, string> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
    xl: styles.xl,
}

export type ToggleProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'color' | 'className' | 'style'
> & {
    color?: ToggleColor
    size?: ToggleSize
    /** Shows a subtle color-tinted outline around the switch. */
    stroke?: boolean
    label?: ReactNode
    className?: string
    style?: CSSProperties
}

const Toggle = ({
    color = 'brand',
    size = 'md',
    stroke = true,
    label,
    className,
    style,
    disabled = false,
    ...inputProps
}: ToggleProps) => (
    <label
        className={clsx(
            styles.toggle,
            SIZE_CLASSES[size],
            COLOR_CLASSES[color],
            stroke && styles.withStroke,
            disabled && styles.disabled,
            className,
        )}
        style={style}
    >
        <input {...inputProps} type="checkbox" disabled={disabled} className={styles.input} />
        <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
    </label>
)

export default Toggle
