import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useFinanceStore } from '../../stores/financeStore'

const NewExpense = () => {
    const { groups, addExpense } = useFinanceStore()
    const navigate = useNavigate()
    const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
    const group = groups.find((item) => item.id === groupId)
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [payerId, setPayerId] = useState('me')
    const [participantIds, setParticipantIds] = useState(
        group?.members.map((member) => member.id) ?? [],
    )
    const selectGroup = (nextGroupId: string) => {
        const nextGroup = groups.find((item) => item.id === nextGroupId)
        setGroupId(nextGroupId)
        setParticipantIds(nextGroup?.members.map((member) => member.id) ?? [])
        setPayerId(nextGroup?.members[0]?.id ?? 'me')
    }
    const toggleParticipant = (id: string) =>
        setParticipantIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        )
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const numericAmount = Number(amount.replace(',', '.'))
        if (
            !group ||
            !title.trim() ||
            numericAmount <= 0 ||
            !participantIds.length
        )
            return
        addExpense({
            groupId,
            title: title.trim(),
            amount: numericAmount,
            payerId,
            participantIds,
        })
        navigate(`/groups/${groupId}`)
    }
    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Новый расход</h1>
                    <p>Укажем, кто оплатил и как разделить сумму.</p>
                </div>
            </div>
            <div className="form-layout">
                <form className="form-card" onSubmit={submit}>
                    <div className="field">
                        <label htmlFor="expense-group">Группа</label>
                        <select
                            id="expense-group"
                            value={groupId}
                            onChange={(event) =>
                                selectGroup(event.target.value)
                            }
                        >
                            {groups.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="expense-title">Что купили</label>
                        <input
                            autoFocus
                            id="expense-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Например, ужин в кафе"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="expense-amount">Сумма, ₽</label>
                        <input
                            id="expense-amount"
                            inputMode="decimal"
                            min="1"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="expense-payer">Кто оплатил</label>
                        <select
                            id="expense-payer"
                            value={payerId}
                            onChange={(event) => setPayerId(event.target.value)}
                        >
                            {group?.members.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <fieldset className="fieldset">
                        <legend className="fieldset__legend">
                            Разделить между
                        </legend>
                        <div className="check-list">
                            {group?.members.map((member) => (
                                <label className="check-option" key={member.id}>
                                    <input
                                        checked={participantIds.includes(
                                            member.id,
                                        )}
                                        onChange={() =>
                                            toggleParticipant(member.id)
                                        }
                                        type="checkbox"
                                    />
                                    {member.name}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div className="form-actions">
                        <button
                            className="button button--primary"
                            type="submit"
                        >
                            Добавить расход
                        </button>
                        <Link className="text-link" to="/">
                            Отмена
                        </Link>
                    </div>
                </form>
                <aside className="hint">
                    <strong>Сумма разделится поровну</strong>
                    <br />
                    После сохранения баланс каждого участника пересчитается
                    автоматически.
                </aside>
            </div>
        </>
    )
}
export default NewExpense
