import { Link } from 'react-router'
import {
    formatMoney,
    getBalances,
    initials,
    useFinanceStore,
} from '../../stores/financeStore'
import { SEO } from '../../components/SEO'

const Dashboard = () => {
    const { groups, expenses } = useFinanceStore()
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const myBalance = groups.reduce(
        (sum, group) => sum + (getBalances(group, expenses).me ?? 0),
        0,
    )
    return (
        <>
            <SEO
                title="Совместные расходы без сложных расчётов"
                description="КтоКому — делите счета, учитывайте общие расходы и узнавайте, кто кому должен."
            />
            <div className="page-heading">
                <div>
                    <h1>Добрый день!</h1>
                    <p>Все совместные расходы — в одном месте.</p>
                </div>
                <Link className="button button--primary" to="/expenses/new">
                    + Добавить расход
                </Link>
            </div>
            <section className="summary-grid" aria-label="Сводка">
                <div className="summary-card">
                    <div className="summary-card__label">Общие расходы</div>
                    <div className="summary-card__value">
                        {formatMoney(total)}
                    </div>
                    <div className="summary-card__note">по всем группам</div>
                </div>
                <div className="summary-card">
                    <div className="summary-card__label">Вам должны</div>
                    <div className="summary-card__value positive">
                        {formatMoney(Math.max(myBalance, 0))}
                    </div>
                    <div className="summary-card__note">
                        можно напомнить друзьям
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card__label">Вы должны</div>
                    <div className="summary-card__value negative">
                        {formatMoney(Math.max(-myBalance, 0))}
                    </div>
                    <div className="summary-card__note">в двух группах</div>
                </div>
            </section>
            <section>
                <h2 className="section-title">
                    Ваши группы <Link to="/groups">Все группы →</Link>
                </h2>
                <div className="group-grid">
                    {groups.map((group) => {
                        const groupTotal = expenses
                            .filter((expense) => expense.groupId === group.id)
                            .reduce((sum, expense) => sum + expense.amount, 0)
                        return (
                            <Link
                                key={group.id}
                                className="group-card"
                                to={`/groups/${group.id}`}
                            >
                                <div className="group-card__top">
                                    <span
                                        className="group-icon"
                                        style={{ background: group.color }}
                                    >
                                        {group.icon}
                                    </span>
                                    <div>
                                        <h3>{group.name}</h3>
                                        <p>{group.description}</p>
                                    </div>
                                </div>
                                <div className="group-card__bottom">
                                    <span className="group-card__amount">
                                        {formatMoney(groupTotal)}
                                    </span>
                                    <span className="group-card__members">
                                        {group.members.length} участника
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </section>
            <section style={{ marginTop: 38 }}>
                <h2 className="section-title">Последние расходы</h2>
                <div className="panel">
                    {expenses.slice(0, 4).map((expense) => {
                        const group = groups.find(
                            (item) => item.id === expense.groupId,
                        )
                        const payer = group?.members.find(
                            (member) => member.id === expense.payerId,
                        )
                        return (
                            <div className="list-row" key={expense.id}>
                                <span
                                    className="avatar"
                                    style={{ background: payer?.color }}
                                >
                                    {initials(payer?.name ?? '?')}
                                </span>
                                <div className="list-row__main">
                                    <p className="list-row__title">
                                        {expense.title}
                                    </p>
                                    <p className="list-row__subtitle">
                                        {group?.name} · {expense.date}
                                    </p>
                                </div>
                                <span className="list-row__value">
                                    {formatMoney(expense.amount)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>
        </>
    )
}
export default Dashboard
