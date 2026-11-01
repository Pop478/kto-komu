import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../../components/buttons/Button'
import ConfirmModal from '../../components/modal/ConfirmModal'
import Loader from '../../components/loader/Loader'
import { useGroupStore } from '../../stores/group.store'
import styles from './groups.module.css'

const memberName = (member: { displayName: string; account: { firstName: string | null; lastName: string | null; username: string | null } | null }) => member.displayName || [member.account?.firstName, member.account?.lastName].filter(Boolean).join(' ') || member.account?.username || 'Участник'

const GroupDetails = () => {
    const { groupId } = useParams()
    const navigate = useNavigate()
    const { currentGroup: group, loading, submitting, error, fetchGroup, updateGroup, deleteGroup, addMember, updateMemberRole, removeMember, clearCurrentGroup } = useGroupStore()
    const [deleteOpen, setDeleteOpen] = useState(false)

    useEffect(() => {
        if (groupId) void fetchGroup(groupId)
        return clearCurrentGroup
    }, [groupId, fetchGroup, clearCurrentGroup])

    if (loading) return <main className={styles.page}><Loader text="Загружаем группу" /></main>
    if (!group || !groupId) return <main className={styles.page}><p className={styles.error}>{error || 'Группа не найдена.'}</p><Link to="/groups" className={styles.back}>← Все группы</Link></main>

    const rename = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const name = new FormData(event.currentTarget).get('name')?.toString().trim(); if (name) await updateGroup(group.id, { name }) }
    const add = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const accountId = form.get('accountId')?.toString().trim(); if (!accountId) return; const success = await addMember(group.id, { accountId, displayName: form.get('displayName')?.toString().trim() || undefined }); if (success) event.currentTarget.reset() }
    const confirmDelete = async () => { if (await deleteGroup(group.id)) navigate('/groups', { replace: true }) }

    return <main className={styles.page}><Link to="/groups" className={styles.back}>← Все группы</Link><header className={styles.detailHeader}><span className={styles.groupInitial}>{group.name.slice(0, 1).toUpperCase()}</span><div><p className={styles.eyebrow}>Группа</p><h1>{group.name}</h1><p>{group.members.length} участников</p></div><Button color="error" className={styles.deleteButton} onClick={() => setDeleteOpen(true)}>Удалить</Button></header>{error && <p className={styles.error}>{error}</p>}<div className={styles.detailGrid}><section className={styles.panel}><h2>Название группы</h2><form className={styles.inlineForm} onSubmit={rename}><input name="name" defaultValue={group.name} required maxLength={100} /><Button type="submit" size="sm" loading={submitting}>Сохранить</Button></form></section><section className={styles.panel}><h2>Участники</h2><div className={styles.members}>{group.members.map((member) => <article className={styles.member} key={member.id}><span className={styles.memberAvatar}>{memberName(member).slice(0, 1).toUpperCase()}</span><div><strong>{memberName(member)}</strong><span>{member.role === 'OWNER' ? 'Владелец' : member.role === 'ADMIN' ? 'Администратор' : 'Участник'}</span></div><div className={styles.memberActions}>{member.role !== 'OWNER' && <select value={member.role} disabled={submitting} onChange={(event) => void updateMemberRole(group.id, member.id, { role: event.target.value as 'ADMIN' | 'MEMBER' })}><option value="MEMBER">Участник</option><option value="ADMIN">Администратор</option></select>}{member.role !== 'OWNER' && <button type="button" className={styles.remove} disabled={submitting} onClick={() => void removeMember(group.id, member.id)}>Удалить</button>}</div></article>)}</div></section><section className={styles.panel}><h2>Добавить участника</h2><p className={styles.description}>Введите ID аккаунта. Необязательно укажите имя, которое будет видно в группе.</p><form className={styles.addForm} onSubmit={add}><input name="accountId" required placeholder="ID аккаунта" /><input name="displayName" placeholder="Имя в группе (необязательно)" /><Button type="submit" loading={submitting}>Добавить</Button></form></section></div><ConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} title="Удалить группу?" confirmText="Удалить" confirmColor="error">Все участники потеряют доступ к группе. Это действие нельзя отменить.</ConfirmModal></main>
}

export default GroupDetails
