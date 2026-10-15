import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'
import { verifyPassword } from '../../lib/password.js'
import { config } from '../../config/config.js'
import { AdminRole } from '../../generated/prisma/enums.js'
import { AdminsRepository } from '../../repositories/admin.repository.js'

type AdminAuthPayload = {
    accessToken: string
    admin: {
        id: string
        email: string
        role: AdminRole
    }
}

export class AdminAuthService {
    static async login(
        email: string,
        password: string,
    ): Promise<AdminAuthPayload> {
        const admin = await AdminsRepository.getByEmail(email)

        if (!admin) {
            throw new Error('Invalid credentials')
        }

        const valid = verifyPassword(password, admin.passwordHash)

        if (!valid) {
            throw new Error('Invalid credentials')
        }

        await prisma.admins.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        })

        await AdminsRepository.updateLastLogin(admin.id)

        const accessToken = jwt.sign(
            {
                id: admin.id,
                role: admin.role,
                email: admin.email,
            },
            config.ADMIN_JWT_SECRET,
            {
                expiresIn: config.ADMIN_JWT_EXPIRES,
            },
        )

        return {
            accessToken,
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        }
    }
}
