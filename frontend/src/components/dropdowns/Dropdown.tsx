import {
    type CSSProperties,
    type KeyboardEvent,
    type ReactNode,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import clsx from 'clsx'
import styles from './dropdown.module.css'
import SelectIcon from '../../assets/select.svg?react'
import ArrowIcon from '../../assets/arrow.svg?react'

export type DropdownOption = {
    value: string
    label: ReactNode
    disabled?: boolean
}

export type DropdownProps = {
    options: DropdownOption[]
    /** Enables choosing more than one item. */
    multiple?: boolean
    /** Controlled selected value (or values for multiple mode). */
    value?: string | string[]
    /** Initial selected value for an uncontrolled dropdown. */
    defaultValue?: string | string[]
    onChange?: (value: string | string[]) => void
    placeholder?: string
    disabled?: boolean
    /** Maximum height of the menu; overflowing options receive a scrollbar. */
    maxMenuHeight?: number | string
    className?: string
    style?: CSSProperties
}

const toValues = (
    value: string | string[] | undefined,
    multiple: boolean,
): string[] => {
    if (value === undefined) return []
    return multiple
        ? Array.isArray(value)
            ? value
            : [value]
        : [Array.isArray(value) ? value[0] : value]
}

const Dropdown = ({
    options,
    multiple = false,
    value,
    defaultValue,
    onChange,
    placeholder = 'Выберите значение',
    disabled = false,
    maxMenuHeight = 240,
    className,
    style,
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
        toValues(defaultValue, multiple),
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const listId = useId()
    const isControlled = value !== undefined
    const selectedValues = isControlled
        ? toValues(value, multiple)
        : uncontrolledValue
    const selectedOptions = options.filter((option) =>
        selectedValues.includes(option.value),
    )

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node))
                setIsOpen(false)
        }

        document.addEventListener('mousedown', closeOnOutsideClick)
        return () =>
            document.removeEventListener('mousedown', closeOnOutsideClick)
    }, [])

    const selectOption = (option: DropdownOption) => {
        if (option.disabled) return

        const nextValues = multiple
            ? selectedValues.includes(option.value)
                ? selectedValues.filter((value) => value !== option.value)
                : [...selectedValues, option.value]
            : [option.value]

        if (!isControlled) setUncontrolledValue(nextValues)
        onChange?.(multiple ? nextValues : (nextValues[0] ?? ''))
        if (!multiple) setIsOpen(false)
    }

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Escape') setIsOpen(false)
        if (
            event.key === 'Enter' ||
            event.key === ' ' ||
            event.key === 'ArrowDown'
        ) {
            event.preventDefault()
            setIsOpen(true)
        }
    }

    const triggerText = selectedOptions.length
        ? selectedOptions
              .map((option) => option.label)
              .reduce<
                  ReactNode[]
              >((items, label, index) => (index ? [...items, ', ', label] : [label]), [])
        : placeholder

    return (
        <div
            ref={rootRef}
            className={clsx(styles.dropdown, isOpen && styles.open, className)}
            style={style}
        >
            <button
                type="button"
                className={styles.trigger}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => setIsOpen((open) => !open)}
                onKeyDown={handleTriggerKeyDown}
            >
                <span
                    className={clsx(
                        styles.value,
                        !selectedOptions.length && styles.placeholder,
                    )}
                >
                    {triggerText}
                </span>
                <ArrowIcon
                    className={clsx(
                        styles.chevron,
                        isOpen && styles.chevronOpen,
                    )}
                />
            </button>

            {isOpen && !disabled && (
                <div
                    id={listId}
                    className={styles.menu}
                    role="listbox"
                    aria-multiselectable={multiple || undefined}
                    style={{ maxHeight: maxMenuHeight }}
                >
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={clsx(
                                    styles.option,
                                    isSelected && styles.optionSelected,
                                )}
                                role="option"
                                aria-selected={isSelected}
                                disabled={option.disabled}
                                onClick={() => selectOption(option)}
                            >
                                <span className={styles.optionLabel}>
                                    {option.label}
                                </span>
                                {isSelected && (
                                    <SelectIcon
                                        className={styles.selectIcon}
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default Dropdown
