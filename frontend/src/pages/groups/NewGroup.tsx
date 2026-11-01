import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '../../components/buttons/Button'
import { useGroupStore } from '../../stores/group.store'
import styles from './groups.module.css'

const NewGroup = () => {
    const navigate = useNavigate()
    const { createGroup, submitting, error } = useGroupStore()

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const name = new FormData(event.currentTarget).get('name')?.toString().trim()
        if (!name) return
        const group = await createGroup({ name })
        if (group) navigate(`/groups/${group.id}`)
    }

    return <main className={styles.narrowPage}><Link to="/groups" className={styles.back}>← Все группы</Link><section className={styles.formCard}><p className={styles.eyebrow}>Новое пространство</p><h1>Создайте группу</h1><p className={styles.description}>Добавьте людей позже — после создания вы сможете назначать роли участникам.</p><form onSubmit={submit} className={styles.form}><label htmlFor="group-name">Название группы</label><input id="group-name" name="name" autoFocus required maxLength={100} placeholder="Например, Поездка в Казань" /><p className={styles.hint}>Название увидят все участники группы.</p>{error && <p className={styles.error}>{error}</p>}<div className={styles.actions}><Button type="submit" loading={submitting}>Создать</Button><Link to="/groups" className={styles.cancel}>Отмена</Link></div></form></section></main>
}

export default NewGroup
