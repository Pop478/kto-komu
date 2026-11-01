import { useState, type ReactNode } from 'react'
import Button from '../../components/buttons/Button'
import Loader from '../../components/loader/Loader'
import { useUserStore } from '../../stores/user.store'
import styles from './profile.module.css'
import { useNavigate } from 'react-router'
import { ContactPicker } from '../../components/contactPicker/ContactPicker'

type ProfileFieldProps = { label: string; children: ReactNode }

const ProfileField = ({ label, children }: ProfileFieldProps) => (
    <div className={styles.field}>
        <dt>{label}</dt>
        <dd>{children}</dd>
    </div>
)

const ProfileAvatar = ({
    name,
    photoUrl,
}: {
    name: string
    photoUrl?: string | null
}) => {
    const [imageError, setImageError] = useState(false)
    const initial = name.trim().charAt(0).toUpperCase() || '?'

    if (photoUrl && !imageError) {
        return (
            <img
                className={styles.avatar}
                src={photoUrl}
                alt={`Фото ${name}`}
                onError={() => setImageError(true)}
            />
        )
    }

    return (
        <div className={styles.avatarFallback} aria-label={`Аватар ${name}`}>
            {initial}
        </div>
    )
}

const formatDate = (value?: string | null) => {
    if (!value) return 'Не указано'

    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date)
}

const Profile = () => {
    const navigate = useNavigate()
    const { user, authReady, loading, startYandexLogin, logout } =
        useUserStore()

    const logoutHandler = async () => {
        await logout()
        navigate('/login')
    }

    if (!authReady || loading) {
        return (
            <div className={styles.loading}>
                <Loader size="xl" />
            </div>
        )
    }

    if (!user) {
        return (
            <section className={styles.empty}>
                <h1>Войдите в профиль</h1>
                <p>
                    Авторизуйтесь, чтобы видеть данные аккаунта и управлять
                    настройками.
                </p>
                <Button onClick={startYandexLogin}>Войти через Яндекс</Button>
            </section>
        )
    }

    const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username ||
        'Пользователь'

    return (
        <div className={styles.page}>
            <header className={styles.profileHeader}>
                <ProfileAvatar name={fullName} photoUrl={user.photoUrl} />
                <div>
                    <p className={styles.eyebrow}>
                        {user.status === 'REGISTERED'
                            ? 'Зарегистрированный пользователь'
                            : 'Гость'}
                    </p>
                    <h1>{fullName}</h1>
                    {user.username && (
                        <p className={styles.username}>@{user.username}</p>
                    )}
                </div>
                <Button
                    className={styles.logout}
                    color="error"
                    onClick={() => logoutHandler()}
                >
                    Выйти
                </Button>
            </header>
            {/* <ContactPicker /> */}

            <section className={styles.card}>
                <h2>Личные данные</h2>
                <dl className={styles.fields}>
                    <ProfileField label="Имя">
                        {user.firstName || 'Не указано'}
                    </ProfileField>
                    <ProfileField label="Фамилия">
                        {user.lastName || 'Не указано'}
                    </ProfileField>
                    <ProfileField label="Имя пользователя">
                        {user.username ? `@${user.username}` : 'Не указано'}
                    </ProfileField>
                    <ProfileField label="Пол">
                        {user.gender === 'MALE'
                            ? 'Мужской'
                            : user.gender === 'FEMALE'
                              ? 'Женский'
                              : 'Не указан'}
                    </ProfileField>
                    <ProfileField label="Дата рождения">
                        {formatDate(user.birthDate)}
                    </ProfileField>
                    <ProfileField label="Язык">
                        {user.languageCode || 'Не указан'}
                    </ProfileField>
                </dl>
            </section>

            <section className={styles.card}>
                <h2>Контакты и аккаунт</h2>
                <dl className={styles.fields}>
                    <ProfileField label="Email">
                        {user.email || 'Не указан'}
                    </ProfileField>
                    <ProfileField label="Email подтверждён">
                        {user.emailVerifiedAt
                            ? formatDate(user.emailVerifiedAt)
                            : 'Нет'}
                    </ProfileField>
                    <ProfileField label="Тема">
                        {user.theme === 'SYSTEM'
                            ? 'Как в системе'
                            : user.theme === 'DARK'
                              ? 'Тёмная'
                              : 'Светлая'}
                    </ProfileField>
                    <ProfileField label="Условия приняты">
                        {user.termsAccepted ? 'Да' : 'Нет'}
                    </ProfileField>
                    <ProfileField label="Дата регистрации">
                        {formatDate(user.createdAt)}
                    </ProfileField>
                    <ProfileField label="ID">{user.id}</ProfileField>
                </dl>
            </section>

            <section className={styles.card}>
                <h2>Способы входа</h2>
                {user.providers.length ? (
                    <ul className={styles.providers}>
                        {user.providers.map((provider) => (
                            <li
                                key={`${provider.provider}-${provider.providerUserId}`}
                            >
                                {provider.provider}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.muted}>
                        Привязанных способов входа нет.
                    </p>
                )}
            </section>
        </div>
    )
}

export default Profile
