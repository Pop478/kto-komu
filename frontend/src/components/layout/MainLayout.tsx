import { NavLink, Outlet } from 'react-router'
import styles from './main-layout.module.css'

const MainLayout = () => (
    <div className={styles.shell}>
        <header className={styles.header}>
            <NavLink to="/main" className={styles.brand} aria-label="КтоКому — главная">
                <span className={styles.logo}>КК</span>
                <span>КтоКому</span>
            </NavLink>

            <nav className={styles.navigation} aria-label="Навигация сайта">
                <NavLink to="/main" className={({ isActive }) => isActive ? styles.active : ''}>Возможности</NavLink>
                <NavLink to="/about" className={({ isActive }) => isActive ? styles.active : ''}>О сервисе</NavLink>
            </nav>

            <NavLink to="/login" className={styles.login}>Войти</NavLink>
        </header>
        <Outlet />
        <footer className={styles.footer}>
            <span>© КтоКому</span>
            <span>Совместные расходы — без лишних расчётов.</span>
        </footer>
    </div>
)

export default MainLayout
