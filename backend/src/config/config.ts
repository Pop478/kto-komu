import 'dotenv/config'

const get = (key: string, fallback?: string) => {
    const raw = process.env[key]

    const v = raw === undefined || raw.trim() === '' ? fallback : raw

    if (v === undefined) {
        throw new Error(`ENV ${key} is required`)
    }

    return v
}

const getOptional = (key: string): string | undefined => {
    const raw = process.env[key]

    if (!raw) return undefined

    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : undefined
}

export const config = {
    PORT: Number(get('PORT', '5000')),
    NODE_ENV: get('NODE_ENV') ?? 'dev',
    URL: get('URL'),
    JWT_SECRET: get('JWT_SECRET'),
    JWT_EXPIRES: get('JWT_EXPIRES') ?? '1d',
    ADMIN_JWT_SECRET: get('ADMIN_JWT_SECRET'),
    ADMIN_JWT_EXPIRES: get('JWT_EXPIRES') ?? '60m',

    // ADMIN
    ADMIN_LOGIN: get('ADMIN_LOGIN'),
    ADMIN_PASSWORD: get('ADMIN_PASSWORD'),
    // REDIS
    REDIS_URL: getOptional('REDIS_URL'),

    // EMAIL
    SMTP_HOST: getOptional('SMTP_HOST'),
    SMTP_PORT: getOptional('SMTP_PORT'),
    SMTP_USER: getOptional('SMTP_USER'),
    SMTP_PASSWORD: getOptional('SMTP_PASSWORD'),

    // CLOUDFLARE
    TURNSTILE_SECRET_KEY: get('TURNSTILE_SECRET_KEY'),
}
