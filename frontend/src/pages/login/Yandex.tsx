import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import Loader from '../../components/loader/Loader'
import { useUserStore } from '../../stores/user.store'
import styles from './yandex.module.css'

const Yandex = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const completeYandexLogin = useUserStore((store) => store.completeYandexLogin)
    const [requestError, setRequestError] = useState<string | null>(null)
    const callbackStarted = useRef(false)

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    useEffect(() => {
        if (!code || !state) return

        // OAuth code can be used only once. The ref also prevents a second
        // request when React Strict Mode re-runs effects in development.
        if (callbackStarted.current) return
        callbackStarted.current = true

        const finishLogin = async () => {
            const response = await completeYandexLogin(code, state)

            if (!response) {
                setRequestError('Не удалось завершить вход через Яндекс. Попробуйте ещё раз.')
                return
            }

            navigate('/', { replace: true })
        }

        void finishLogin()
    }, [code, state, completeYandexLogin, navigate])

    const error = !code || !state
        ? 'В адресе callback отсутствуют параметры авторизации.'
        : requestError

    if (error) {
        return (
            <main className={styles.page}>
                <section className={styles.card}>
                    <h1>Ошибка входа</h1>
                    <p>{error}</p>
                    <Link className={styles.link} to="/login">Вернуться ко входу</Link>
                </section>
            </main>
        )
    }

    return (
        <main className={styles.page} aria-live="polite">
            <section className={styles.card}>
                <Loader size="xl" />
                <h1>Выполняется вход</h1>
                <p>Проверяем данные Яндекс ID и завершаем авторизацию.</p>
            </section>
        </main>
    )
}

export default Yandex
