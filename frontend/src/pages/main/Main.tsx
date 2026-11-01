import { Link } from 'react-router'
import { Feature, Section, Step } from '../../components/marketing/Marketing'
import styles from './main.module.css'

const Main = () => (
    <main>
        <section className={styles.hero}>
            <div className={styles.heroText}>
                <p className={styles.kicker}>Расходы, в которых всё понятно</p>
                <h1>Деньги — вместе.<br /><em>Расчёты — спокойно.</em></h1>
                <p className={styles.lead}>КтоКому помогает друзьям, парам и семьям фиксировать общие траты и видеть, кто кому должен — без таблиц и неловких напоминаний.</p>
                <div className={styles.actions}>
                    <Link to="/login" className={styles.primaryAction}>Начать бесплатно <span aria-hidden="true">→</span></Link>
                    <Link to="/about" className={styles.secondaryAction}>Как это работает</Link>
                </div>
            </div>
            <div className={styles.receipt} aria-label="Пример расчёта расходов">
                <div className={styles.receiptTop}><span>Поездка за город</span><span className={styles.live}>● актуально</span></div>
                <div className={styles.expense}><span className={styles.avatar}>А</span><span>Аня оплатила продукты</span><strong>2 460 ₽</strong></div>
                <div className={styles.expense}><span className={`${styles.avatar} ${styles.purple}`}>М</span><span>Миша оплатил такси</span><strong>780 ₽</strong></div>
                <div className={styles.divider} />
                <div className={styles.result}><span>Кому вернуть</span><strong>Мише · 420 ₽</strong></div>
                <div className={styles.bubbles}><i /><i /><i /></div>
            </div>
        </section>

        <Section eyebrow="Всё на своём месте" title="Разбирайтесь с общими тратами за пару минут">
            <div className={styles.featureGrid}>
                <Feature icon="＋" title="Добавляйте расходы">Укажите сумму, кто заплатил и с кем нужно разделить покупку.</Feature>
                <Feature icon="◌" title="Смотрите баланс">Сервис собирает общую картину и показывает понятный итог по каждому участнику.</Feature>
                <Feature icon="↔" title="Закрывайте долги">Получайте простой план переводов, чтобы рассчитаться с минимумом действий.</Feature>
            </div>
        </Section>

        <section className={styles.darkBlock}>
            <Section eyebrow="Один сценарий — много поводов" title="От коммуналки до путешествий">
                <div className={styles.scenarios}>
                    <article><span>⌂</span><h3>Дом</h3><p>Продукты, подписки и счета за квартиру.</p></article>
                    <article><span>✦</span><h3>Поездка</h3><p>Билеты, жильё и все спонтанные остановки по пути.</p></article>
                    <article><span>♟</span><h3>Компания</h3><p>Вечеринки, подарки и совместные планы.</p></article>
                </div>
            </Section>
        </section>

        <Section eyebrow="Три простых шага" title="Не нужно быть бухгалтером">
            <div className={styles.steps}>
                <Step number="01" title="Создайте группу">Соберите людей, с которыми делите расходы.</Step>
                <Step number="02" title="Добавляйте покупки">Фиксируйте траты сразу или когда будет удобно.</Step>
                <Step number="03" title="Рассчитайтесь">Откройте баланс и переведите нужную сумму.</Step>
            </div>
        </Section>

        <section className={styles.cta}>
            <p>Меньше подсчётов. Больше совместных планов.</p>
            <h2>Начните вести общие расходы по-человечески.</h2>
            <Link to="/login" className={styles.primaryAction}>Создать первую группу <span aria-hidden="true">→</span></Link>
        </section>
    </main>
)

export default Main
