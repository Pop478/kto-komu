import { createPortal } from 'react-dom'
import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { useShallow } from 'zustand/shallow'
import clsx from 'clsx'

import { useNotificationStore } from './notifications.store'
import { useUserStore } from '../../stores/user.store'
import CloseButton from '../closeButton/closeButton'

import SuccessIcon from '../../assets/icons/tick-circle.svg?react'
import WarningIcon from '../../assets/icons/info-triangle.svg?react'
import ErrorIcon from '../../assets/icons/close-circle.svg?react'

type NotificationType = 'success' | 'warning' | 'error'

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

type NotificationItemProps = {
    id: string
    type: NotificationType
    message: string
    onRemove: (id: string) => void
}

const NOTIFICATION_ICONS: Record<NotificationType, SvgIcon> = {
    success: SuccessIcon,
    warning: WarningIcon,
    error: ErrorIcon,
}

const NOTIFICATION_CLASSES: Record<NotificationType, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    error: 'bg-danger-soft text-danger',
}

const NotificationItem = ({
    id,
    type,
    message,
    onRemove,
}: NotificationItemProps) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const enterTimer = window.setTimeout(() => {
            setVisible(true)
        }, 10)

        const exitTimer = window.setTimeout(() => {
            setVisible(false)
        }, 4000)

        return () => {
            window.clearTimeout(enterTimer)
            window.clearTimeout(exitTimer)
        }
    }, [])

    const handleTransitionEnd = () => {
        if (!visible) {
            onRemove(id)
        }
    }
    const NotificationIcon = NOTIFICATION_ICONS[type]

    return (
        <div
            onTransitionEnd={handleTransitionEnd}
            className={clsx(
                'pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl px-3 py-2 shadow-card backdrop-blur',
                'transition-all duration-300 ease-out',
                NOTIFICATION_CLASSES[type],
                visible
                    ? 'translate-y-0 scale-100 opacity-100'
                    : '-translate-y-3 scale-95 opacity-0',
            )}
        >
            <div className="flex items-center gap-2">
                <NotificationIcon className="h-6 w-6 shrink-0 text-current" />
                <p className="min-w-0 flex-1 text-base font-bold text-primary">
                    {message}
                </p>
            </div>

            <CloseButton
                onClose={() => setVisible(false)}
                size="md"
                className="text-secondary active:scale-95"
            />
        </div>
    )
}

const NotificationProvider = () => {
    const { items, remove } = useNotificationStore(
        useShallow((s) => ({
            items: s.items,
            remove: s.remove,
        })),
    )

    const { topSpacer } = useUserStore(
        useShallow((s) => ({
            topSpacer: s.topSpacer,
        })),
    )

    return createPortal(
        <div
            style={{
                top: `calc(${topSpacer} + 12px)`,
            }}
            className="pointer-events-none fixed left-0 right-0 z-[9999] flex flex-col items-end gap-2 px-3"
        >
            {items.map((item) => (
                <NotificationItem
                    key={item.id}
                    id={item.id}
                    type={item.type}
                    message={item.message}
                    onRemove={remove}
                />
            ))}
        </div>,
        document.body,
    )
}

export default NotificationProvider
