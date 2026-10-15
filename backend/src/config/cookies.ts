import type { CookieOptions } from 'express'

export const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}
