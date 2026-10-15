import path from 'path'
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

export function setupSwagger(router: Router) {
    const frontendSpec = YAML.load(
        path.resolve(process.cwd(), 'src/api/frontend/openapi.bundled.yaml'),
    )

    const adminSpec = YAML.load(
        path.resolve(process.cwd(), 'src/api/admin/openapi.bundled.yaml'),
    )

    router.use(
        '/docs/frontend',
        swaggerUi.serveFiles(frontendSpec),
        swaggerUi.setup(frontendSpec),
    )

    router.use(
        '/docs/admin',
        swaggerUi.serveFiles(adminSpec),
        swaggerUi.setup(adminSpec),
    )
}
