import winston from 'winston'
import { config } from '../config/config.js'

// Формат для development
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        return `[${timestamp}] ${level}: ${stack || message}`
    }),
)

// Формат для production (JSON для парсинга системами логов)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // показывает stack trace
    winston.format.json(),
)

export const logger = winston.createLogger({
    level: config.NODE_ENV ? 'info' : 'debug', // уровни: error, warn, info, http, verbose, debug, silly
    format: config.NODE_ENV ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(), // консоль всегда
        // при желании пишем в файлы:
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
    exitOnError: false,
})

// Хэндлинг необработанных ошибок
logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
)

logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' }),
)
