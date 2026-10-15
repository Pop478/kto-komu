import { Link, useParams } from 'react-router'
import { formatMoney, getBalances, initials, useFinanceStore } from '../../stores/financeStore'

const GroupDetails = () => {
    const { groupId } = useParams()
    const { groups, expenses } = useFinanceStore()
    const group = groups.find((item) => item.id === groupId)
    if (!group) return <div className="empty">Группа не найдена. <Link to="/groups">Вернуться к группам</Link></div>
    const groupExpenses = expenses.filter((expense) => expense.groupId === group.id)
    const balances = getBalances(group, expenses)
    const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return <><Link className="back-link" to="/groups">← Все группы</Link><div className="details-header"><span className="group-icon" style={{ background: group.color }}>{group.icon}</span><div><h1 style={{ margin: 0, fontSize: 30 }}>{group.name}</h1><p style={{ color: '#7d8492', margin: '5px 0 0' }}>{group.description}</p></div><div className="members" style={{ marginLeft: 'auto' }}>{group.members.map((member) => <span key={member.id} className="avatar" style={{ background: member.color }} title={member.name}>{initials(member.name)}</span>)}</div></div><div className="details-columns"><section><h2 className="section-title">Расходы <Link to="/expenses/new">+ Добавить</Link></h2><div className="panel">{groupExpenses.length ? groupExpenses.map((expense) => { const payer = group.members.find((member) => member.id === expense.payerId); return <div className="list-row" key={expense.id}><span className="avatar" style={{ background: payer?.color }}>{initials(payer?.name ?? '?')}</span><div className="list-row__main"><p className="list-row__title">{expense.title}</p><p className="list-row__subtitle">Оплатил{payer?.name === 'Вы' ? 'и' : 'а'} {payer?.name} · {expense.date}</p></div><span className="list-row__value">{formatMoney(expense.amount)}</span></div> }) : <div className="empty">Расходов пока нет</div>}</div></section><aside className="panel side-panel"><h3>Баланс участников</h3>{group.members.map((member) => { const balance = balances[member.id] ?? 0; return <div className="balance-item" key={member.id}><span>{member.name}</span><strong className={balance >= 0 ? 'positive' : 'negative'}>{balance >= 0 ? '+' : '−'}{formatMoney(Math.abs(balance))}</strong></div> })}<div className="balance-item"><span>Всего расходов</span><strong>{formatMoney(total)}</strong></div></aside></div></>
}
export default GroupDetails
