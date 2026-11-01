import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet } from 'react-router'

import styles from './layout.module.css'

import LogoIcon from '../../assets/brand/full logo.svg?react'
import HomeIcon from '../../assets/navigation/home.svg?react'
import GroupsIcon from '../../assets/navigation/groups.svg?react'
import QRScanIcon from '../../assets/navigation/qr-scan.svg?react'
import SettlementIcon from '../../assets/navigation/settlement.svg?react'
import { useUserStore } from '../../stores/user.store'

type NavigationItem = {
    to: string
    label: string
    icon?: ComponentType<SVGProps<SVGSVGElement>>
    /** URL фотографии пользователя для пункта профиля. */
    avatarUrl?: string
    end?: boolean
}

const navigation: NavigationItem[] = [
    { to: '/', label: 'Главная', icon: HomeIcon, end: true },
    { to: '/groups', label: 'Группы', icon: GroupsIcon },
    { to: '/qr-scan', label: 'Сканер', icon: QRScanIcon },
    { to: '/settlements', label: 'Расчёты', icon: SettlementIcon },
    { to: '/profile', label: 'Профиль' },
]

const Navigation = ({
    mobile = false,
    profilePhotoUrl,
}: {
    mobile?: boolean
    profilePhotoUrl?: string | null
}) => (
    <nav
        className={mobile ? styles.mobileNavigation : styles.desktopNavigation}
        aria-label="Основная навигация"
    >
        {navigation.map(({ to, label, icon: Icon, avatarUrl, end }) => {
            const photoUrl = to === '/profile' ? profilePhotoUrl ?? avatarUrl : avatarUrl

            return (
            <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                    mobile
                        ? `${styles.mobileLink} ${isActive ? styles.active : ''}`
                        : `${styles.desktopLink} ${isActive ? styles.active : ''}`
                }
            >
                {photoUrl ? (
                    <img className={styles.avatar} src={photoUrl} alt="" />
                ) : Icon ? (
                    <Icon className={styles.icon} aria-hidden="true" />
                ) : to === '/profile' ? (
                    <span className={styles.avatarFallback} aria-hidden="true">
                        {label.slice(0, 1)}
                    </span>
                ) : null}
                <span>{label}</span>
            </NavLink>
            )
        })}
    </nav>
)

const Layout = () => {
    const profilePhotoUrl = useUserStore((state) => state.user?.photoUrl)

    return (
    <div className={styles.shell}>
        <header className={styles.header}>
            <NavLink
                className={styles.brand}
                to="/"
                aria-label="КтоКому — главная"
            >
                <LogoIcon />
            </NavLink>

            <Navigation profilePhotoUrl={profilePhotoUrl} />
            <NavLink className={styles.addExpense} to="/expenses/new">
                <span aria-hidden="true">+</span>
                <span>Добавить расход</span>
            </NavLink>
        </header>

        <main className={styles.content}>
            <Outlet />
        </main>

        <Navigation mobile profilePhotoUrl={profilePhotoUrl} />
    </div>
    )
}

export default Layout
