import styles from './loader.module.css'

type LoaderProps = {
    text?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Loader({ text, size = 'md' }: LoaderProps) {
    return (
        <div className={styles.wrapper}>
            <span className={`${styles.loader} ${styles[size]}`} />

            {text && <p className={styles.text}>{text}</p>}
        </div>
    )
}
