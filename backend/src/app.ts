process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err)
})
process.on('exit', (code) => {
    console.warn('[process exit]', code)
})

console.log('[boot] index.ts starting…')

import express from 'express'
import { createServer } from 'node:http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { routes } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'
import { setupSwagger } from './lib/swagger.js'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PUBLIC_DIR = resolve(__dirname, '../public')

const corsOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5174',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
]

export function createApp() {
    const app = express()
    const httpServer = createServer(app)

    app.use(
        cors({
            origin(origin, callback) {
                if (!origin) return callback(null, true) // Postman, curl
                if (corsOrigins.includes(origin)) {
                    return callback(null, true)
                }
                return callback(new Error('Not allowed by CORS'))
            },
            credentials: true,
        }),
    )
    app.set('trust proxy', 1)

    app.use(express.urlencoded({ extended: false }))
    app.use(express.json({ limit: '1mb' }))
    app.use(cookieParser())

    app.use(
        '/api/public',
        express.static(PUBLIC_DIR, {
            index: false,
            etag: true,
            lastModified: true,
            maxAge: '30d',
            immutable: true,
            setHeaders: (res, path) => {
                res.setHeader(
                    'Cache-Control',
                    'public, max-age=2592000, immutable',
                )
            },
        }),
    )
    ;(BigInt.prototype as BigInt & { toJSON: () => string }).toJSON =
        function () {
            return this.toString()
        }

    // SWAGGER
    setupSwagger(app)

    // REST API
    app.use('/api/v1', routes)

    // ERROR
    app.use(errorHandler)

    return { app, httpServer }
}
