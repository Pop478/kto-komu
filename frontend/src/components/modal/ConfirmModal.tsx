import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import clsx from 'clsx'
import Button, { type ButtonColor } from '../buttons/Button'
import Modal, { type ModalSize } from './Modal'
import styles from './confirmModal.module.css'

export type ConfirmModalProps = {
    open: boolean
    children: ReactNode
    onConfirm: () => void | Promise<void>
    onClose?: () => void
    /** @deprecated Use onClose. */
    close?: () => void
    title?: ReactNode
    confirmText?: ReactNode
    cancelText?: ReactNode
    confirmColor?: ButtonColor
    size?: ModalSize
    disabled?: boolean
    closeOnConfirm?: boolean
    className?: string
    style?: CSSProperties
    actionsClassName?: string
    confirmButtonClassName?: string
    cancelButtonClassName?: string
}

const ConfirmModal = ({
    open,
    children,
    onConfirm,
    onClose,
    close,
    title = 'Подтвердите действие',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    confirmColor = 'brand',
    size = 'sm',
    disabled = false,
    closeOnConfirm = true,
    className,
    style,
    actionsClassName,
    confirmButtonClassName,
    cancelButtonClassName,
}: ConfirmModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const handleClose = onClose ?? close

    const handleConfirm = async () => {
        if (disabled || isSubmitting) return

        setIsSubmitting(true)
        try {
            await onConfirm()
            if (closeOnConfirm) handleClose?.()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            close={handleClose}
            title={title}
            size={size}
            className={className}
            style={style}
            closeOnOverlayClick={!isSubmitting}
            closeOnEscape={!isSubmitting}
            footer={
                <div className={clsx(styles.confirmActions, actionsClassName)}>
                    <Button
                        color="gray"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className={cancelButtonClassName}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        color={confirmColor}
                        onClick={handleConfirm}
                        disabled={disabled}
                        loading={isSubmitting}
                        className={confirmButtonClassName}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            {children}
        </Modal>
    )
}

export default ConfirmModal
