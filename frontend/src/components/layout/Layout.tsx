import { NavLink, Outlet } from 'react-router'

const navigation = [
    { to: '/', label: 'Главная', end: true },
    { to: '/groups', label: 'Группы' },
    { to: '/settlements', label: 'Расчёты' },
]

const Layout = () => (
    <div className="app-shell">
        <header className="app-header">
            <NavLink className="brand" to="/" aria-label="КтоКому — главная"><span className="brand-mark">К</span><span>КтоКому</span></NavLink>
            <nav className="desktop-nav" aria-label="Основная навигация">
                {navigation.map(({ to, label, end }) => <NavLink key={to} className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} end={end} to={to}>{label}</NavLink>)}
            </nav>
            <NavLink className="button button--primary header-action" to="/expenses/new"><span aria-hidden="true">+</span> Добавить расход</NavLink>
        </header>
        <main className="page-content"><Outlet /></main>
        <nav className="mobile-nav" aria-label="Основная навигация">
            {navigation.map(({ to, label, end }) => <NavLink key={to} className={({ isActive }) => `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`} end={end} to={to}>{label}</NavLink>)}
        </nav>
    </div>
)

export default Layout
