import { useEffect } from 'react'
import { Link } from 'react-router'
import Button from '../../components/buttons/Button'
import Loader from '../../components/loader/Loader'
import { useGroupStore } from '../../stores/group.store'
import styles from './groups.module.css'

const Groups = () => {
    const { groups, loading, error, fetchGroups } = useGroupStore()

    useEffect(() => { void fetchGroups() }, [fetchGroups])

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div><p className={styles.eyebrow}>Ваши пространства</p><h1>Группы</h1><p>Объединяйте людей, с которыми делите расходы.</p></div>
                <Link to="/groups/new" className={styles.buttonLink}>Создать группу</Link>
            </header>
            {loading && <Loader text="Загружаем группы" />}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && groups.length === 0 && <section className={styles.empty}><h2>Групп пока нет</h2><p>Создайте первую группу для дома, поездки или встречи с друзьями.</p><Link to="/groups/new"><Button>Создать группу</Button></Link></section>}
            <div className={styles.grid}>
                {groups.map((group) => <Link key={group.id} to={`/groups/${group.id}`} className={styles.groupCard}><span className={styles.groupInitial}>{group.name.slice(0, 1).toUpperCase()}</span><div><h2>{group.name}</h2><p>{group.membersCount} {group.membersCount === 1 ? 'участник' : 'участников'}</p></div><span className={styles.arrow} aria-hidden="true">→</span></Link>)}
            </div>
        </main>
    )
}

export default Groups
