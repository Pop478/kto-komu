import { createClient, type RedisClientType } from 'redis'
import { config } from '../config/config.js'

let redis: RedisClientType | null = null

export async function initRedis() {
    if (!config.REDIS_URL) {
        console.log('Redis disabled (REDIS_URL not set)')
        return
    }

    try {
        redis = createClient({
            url: config.REDIS_URL,
        })

        redis.on('error', (err) => {
            console.error('Redis error:', err)
        })

        await redis.connect()

        console.log('Connected to Redis')
    } catch (err) {
        console.error('Redis connection failed. Running without Redis')
        redis = null
    }
}

export function getRedis(): RedisClientType | null {
    return redis
}
