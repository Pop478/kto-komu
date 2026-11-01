import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

export class TransactionRepository {
    static run<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
        return prisma.$transaction(callback)
    }
}
