import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const status = (err as any)?.status ?? 500
    const message = (err as any)?.message ?? 'Internal Server Error'

    console.error('\n================ ERROR HANDLER ================')
    console.error('Time:', new Date().toISOString())
    console.error('Status:', status)
    console.error('Method:', req.method)
    console.error('URL:', req.originalUrl)
    console.error('IP:', req.ip)
    console.error('Headers:', req.headers)
    console.error('Body:', req.body)
    console.error('Error message:', message)
    console.error('Stack:', err instanceof Error ? err.stack : err)
    console.error('================================================\n')

    res.status(status).json({
        ok: false,
        error: message,
    })
}
