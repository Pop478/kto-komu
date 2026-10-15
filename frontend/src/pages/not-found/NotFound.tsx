import { Link } from 'react-router'

const NotFound = () => <section className="not-found"><h1>404</h1><p>Такой страницы здесь нет.</p><Link className="button button--primary" to="/">На главную</Link></section>
export default NotFound
