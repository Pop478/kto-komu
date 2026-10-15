import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useFinanceStore } from '../../stores/financeStore'

const NewGroup = () => {
    const addGroup = useFinanceStore((state) => state.addGroup)
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!name.trim()) return; addGroup({ name: name.trim(), description: description.trim() || '3 участника', icon: '✨', color: '#fff1cf' }); navigate('/groups') }
    return <><div className="page-heading"><div><h1>Новая группа</h1><p>Начните вести общий бюджет за пару шагов.</p></div></div><div className="form-layout"><form className="form-card" onSubmit={submit}><h2>О группе</h2><div className="field"><label htmlFor="group-name">Название</label><input autoFocus id="group-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, Дача" required /></div><div className="field"><label htmlFor="group-description">Описание</label><input id="group-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Например, друзья и семья" /></div><div className="form-actions"><button className="button button--primary" type="submit">Создать группу</button><Link className="text-link" to="/groups">Отмена</Link></div></form><aside className="hint"><strong>Что дальше?</strong><br />Добавьте первую покупку и выберите тех, с кем хотите её разделить.</aside></div></>
}
export default NewGroup
