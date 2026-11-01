import { Link } from 'react-router'
import { Section, Step } from '../../components/marketing/Marketing'
import styles from './about.module.css'

const About = () => (
    <main>
        <section className={styles.hero}>
            <p>О сервисе</p>
            <h1>Общие деньги не должны быть поводом для споров.</h1>
            <span>КтоКому создан, чтобы сохранить ясность в расходах и лёгкость в отношениях.</span>
        </section>

        <Section eyebrow="Наш подход" title="Честно, понятно, без лишнего">
            <div className={styles.principles}>
                <article><b>01</b><h3>Понятный баланс</h3><p>Каждый участник видит только нужный итог: кто заплатил, за что и какая сумма осталась.</p></article>
                <article><b>02</b><h3>Равное участие</h3><p>Вы сами задаёте состав участников и доли для каждой покупки.</p></article>
                <article><b>03</b><h3>Контроль у вас</h3><p>Данные аккаунта и групп доступны только после входа в сервис.</p></article>
            </div>
        </Section>

        <section className={styles.rules}>
            <Section eyebrow="Правила хорошего расчёта" title="Чтобы всем было комфортно">
                <div className={styles.ruleList}>
                    <Step number="1" title="Добавляйте траты вовремя">Так у участников остаётся одинаковая картина расходов.</Step>
                    <Step number="2" title="Пишите понятные названия">«Продукты на выходные» полезнее, чем просто «магазин».</Step>
                    <Step number="3" title="Сверяйте баланс перед переводом">Сумма может измениться, если появится новая общая покупка.</Step>
                </div>
            </Section>
        </section>

        <Section eyebrow="Вопросы" title="Коротко о важном">
            <div className={styles.faq}>
                <details open><summary>Нужно ли всем устанавливать приложение?</summary><p>Нет. Пригласите участника в группу — дальше он сможет подключиться к общему расчёту в сервисе.</p></details>
                <details><summary>Сервис переводит деньги сам?</summary><p>Нет. КтоКому помогает посчитать итог и договориться, а сам перевод вы делаете привычным способом.</p></details>
                <details><summary>Можно ли вести несколько групп?</summary><p>Да. Разделяйте домашние расходы, поездки и встречи с друзьями, чтобы ничего не смешивалось.</p></details>
            </div>
        </Section>

        <section className={styles.cta}><h2>Готовы навести порядок в общих тратах?</h2><Link to="/login">Перейти к сервису →</Link></section>
    </main>
)

export default About
