import { Link } from 'react-router'
import { formatMoney, useFinanceStore } from '../../stores/financeStore'

const Groups = () => {
    const { groups, expenses } = useFinanceStore()
    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Мои группы</h1>
                    <p>Создавайте компании для поездок, дома и общих дел.</p>
                </div>
                <Link className="button button--primary" to="/groups/new">
                    + Новая группа
                </Link>
            </div>
            <div className="group-grid">
                {groups.map((group) => {
                    const total = expenses
                        .filter((expense) => expense.groupId === group.id)
                        .reduce((sum, expense) => sum + expense.amount, 0)
                    return (
                        <Link
                            className="group-card"
                            key={group.id}
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
                                    {formatMoney(total)}
                                </span>
                                <span className="group-card__members">
                                    Открыть →
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
export default Groups
