import { createApp } from './app.js'
import { bootstrap } from './bootstrap/index.js'
import { config } from './config/config.js'
import { logger } from './lib/logger.js'
import { initRedis } from './lib/redis.js'

console.log('[boot] reached before listen', {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
})

await initRedis()

await bootstrap() // seed

const { httpServer } = createApp()

const port = Number(config.PORT ?? 5000)
httpServer.listen(port, '0.0.0.0', () =>
    console.log(`[server] http://0.0.0.0:${port} (${process.env.NODE_ENV})`),
)
