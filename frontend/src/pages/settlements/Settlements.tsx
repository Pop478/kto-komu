import { formatMoney, getBalances, useFinanceStore } from '../../stores/financeStore'

const Settlements = () => {
    const { groups, expenses } = useFinanceStore()
    const entries = groups.flatMap((group) => Object.entries(getBalances(group, expenses)).map(([memberId, balance]) => ({ group, member: group.members.find((item) => item.id === memberId), balance }))).filter((item) => item.member?.id !== 'me' && Math.abs(item.balance) > 1)
    return <><div className="page-heading"><div><h1>Взаиморасчёты</h1><p>Здесь собраны актуальные балансы по всем группам.</p></div></div>{entries.length ? entries.map(({ group, member, balance }) => <div className="settlement-card" key={`${group.id}-${member?.id}`}><span className="group-icon" style={{ background: group.color }}>{group.icon}</span><div><strong>{member?.name}</strong><p className="list-row__subtitle" style={{ marginTop: 4 }}>{group.name}</p></div><span className="settlement-card__arrow">{balance > 0 ? 'должен вам' : 'вам нужно вернуть'}</span><strong className={`settlement-card__amount ${balance > 0 ? 'positive' : 'negative'}`}>{formatMoney(Math.abs(balance))}</strong></div>) : <div className="panel empty">Все расчёты закрыты 🎉</div>}</>
}
export default Settlements
