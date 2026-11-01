import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

type TxClient = Prisma.TransactionClient

export class OAuthIdentityRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findByProviderUserId(
        provider: string,
        providerUserId: string,
        tx?: TxClient,
    ) {
        return this.db(tx).oAuthIdentity.findUnique({
            where: {
                provider_providerUserId: {
                    provider,
                    providerUserId,
                },
            },
            include: {
                account: {
                    include: {
                        oauthIdentities: {
                            select: {
                                provider: true,
                                providerUserId: true,
                            },
                        },
                    },
                },
            },
        })
    }

    static async create(
        data: Prisma.OAuthIdentityCreateInput,
        tx?: TxClient,
    ) {
        return this.db(tx).oAuthIdentity.create({ data })
    }
}
