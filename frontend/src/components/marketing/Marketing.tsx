import type { ReactNode } from 'react'
import styles from './marketing.module.css'

export const Section = ({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) => (
    <section className={styles.section}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2>{title}</h2>
        {children}
    </section>
)

export const Feature = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
    <article className={styles.feature}>
        <span className={styles.featureIcon} aria-hidden="true">{icon}</span>
        <h3>{title}</h3>
        <p>{children}</p>
    </article>
)

export const Step = ({ number, title, children }: { number: string; title: string; children: ReactNode }) => (
    <article className={styles.step}>
        <span>{number}</span>
        <div><h3>{title}</h3><p>{children}</p></div>
    </article>
)
