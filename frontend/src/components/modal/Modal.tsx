import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'

import styles from './modal.module.css'

import CloseIcon from '../../assets/arrow.svg?react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export type ModalProps = {
    open: boolean
    close?: () => void
    title?: ReactNode
    children: ReactNode
    footer?: ReactNode
    size?: ModalSize
    className?: string
    style?: CSSProperties
    showCloseButton?: boolean
    closeOnOverlayClick?: boolean
    closeOnEscape?: boolean
}

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
    xl: styles.xl,
}

const Modal = ({
    open,
    close,
    title,
    children,
    footer,
    size = 'md',
    className,
    style,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}: ModalProps) => {
    const titleId = useId()

    useEffect(() => {
        if (!open || !close || !closeOnEscape) return

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close()
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [open, close, closeOnEscape])

    useEffect(() => {
        if (!open) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            closeOnOverlayClick
                        )
                            close?.()
                    }}
                >
                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        className={clsx(
                            styles.modal,
                            SIZE_CLASSES[size],
                            className,
                        )}
                        style={style}
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {(title || (showCloseButton && close)) && (
                            <header className={styles.header}>
                                {title && (
                                    <h2 id={titleId} className={styles.title}>
                                        {title}
                                    </h2>
                                )}
                                {showCloseButton && close && (
                                    <button
                                        type="button"
                                        className={styles.closeButton}
                                        onClick={close}
                                        aria-label="Закрыть окно"
                                    >
                                        <CloseIcon aria-hidden="true" />
                                    </button>
                                )}
                            </header>
                        )}

                        <div className={styles.content}>{children}</div>
                        {footer && (
                            <footer className={styles.footer}>{footer}</footer>
                        )}
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Modal
