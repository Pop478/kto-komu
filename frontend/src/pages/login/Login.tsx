import { Link } from 'react-router'
import Button from '../../components/buttons/Button'
import LogoIcon from '../../assets/brand/Logo.svg?react'
import YandexIcon from '../../assets/provider/yandex.svg?react'
import VkIcon from '../../assets/provider/vk.svg?react'
import { useUserStore } from '../../stores/user.store'
import styles from './login.module.css'

const Login = () => {
    const startYandexLogin = useUserStore((store) => store.startYandexLogin)

    return (
        <main className={styles.page}>
            <section className={styles.card} aria-labelledby="login-title">
                <Link
                    to="/main"
                    className={styles.brand}
                    aria-label="КтоКому — главная"
                >
                    <LogoIcon aria-hidden="true" className={styles.brandLogo} />
                </Link>

                <header className={styles.heading}>
                    <h1 id="login-title">Войдите или создайте аккаунт</h1>
                </header>

                <fieldset className={styles.emailForm} disabled>
                    <input
                        className={styles.emailInput}
                        id="login-email"
                        type="email"
                        placeholder="Электронная почта"
                        autoComplete="email"
                        aria-label="Электронная почта"
                    />
                    <input
                        className={styles.emailInput}
                        id="login-password"
                        type="password"
                        placeholder="Пароль"
                        autoComplete="current-password"
                        aria-label="Пароль"
                    />
                    <button className={styles.emailButton} type="button">
                        Войти по email
                    </button>
                </fieldset>

                <div className={styles.divider}>
                    <span>или</span>
                </div>

                <div className={styles.providers}>
                    <button
                        className={styles.providerButton}
                        type="button"
                        onClick={startYandexLogin}
                    >
                        <YandexIcon className={styles.providerIcon} />
                        <span className={styles.providerText}>
                            Войти с Яндекс ID
                        </span>
                    </button>

                    <button
                        className={styles.providerButton}
                        type="button"
                        disabled
                    >
                        <VkIcon className={styles.providerIcon} />
                        <span className={styles.providerText}>
                            Войти с VK ID
                        </span>
                        <span className={styles.providerSoon}>Скоро</span>
                    </button>
                </div>

                <p className={styles.terms}>
                    Продолжая вы соглашаетесь с правилами сервиса.
                </p>
            </section>
        </main>
    )
}

export default Login
