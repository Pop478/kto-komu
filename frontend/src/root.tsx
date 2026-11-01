import {
    isRouteErrorResponse,
    Links,
    Navigate,
    Outlet,
    Scripts,
    ScrollRestoration,
    useNavigate,
} from 'react-router'
import 'normalize.css'
import './styles/index.css'
import './App.css'
import Loader from './components/loader/Loader'
import { useEffect } from 'react'
import { useUserStore } from './stores/user.store'
import { useShallow } from 'zustand/shallow'
import { OpenAPI } from './api'

// export async function clientLoader({ request }: Route.ClientLoaderArgs) {
//     await i18nInitPromise
//     await bootstrapApplication(request)

//     const language = detectInitialLanguage()
//     const appType = detectApp()

//     return {
//         language,
//         appType,
//     }
// }

// clientLoader.hydrate = true as const

OpenAPI.WITH_CREDENTIALS = true

export function HydrateFallback() {
    return (
        <div className="loaderWrapper">
            <Loader size="xl" />
        </div>
    )
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="theme-color" content="#2563EB" />
                <meta name="application-name" content="КтоКому" />
                <meta name="google" content="notranslate" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="КтоКому" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <link rel="manifest" href="/manifest.webmanifest" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link
                    rel="apple-touch-icon"
                    href="/apple-touch-icon.png"
                    sizes="180x180"
                />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    const initializeAuth = useUserStore((s) => s.initializeAuth)

    useEffect(() => {
        void initializeAuth()
    }, [initializeAuth])

    // if (authStatus === 'unauthenticated') {
    //     return <Navigate to="/login" replace />
    // }

    return <Outlet />
}

export function ErrorBoundary({ error }) {
    let message = 'Oops!'
    let details = 'An unexpected error occurred.'
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error'
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    )
}
