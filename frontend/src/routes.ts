import {
    index,
    layout,
    route,
    type RouteConfig,
} from '@react-router/dev/routes'

export default [
    layout('./components/layout/MainLayout.tsx', [
        route('main', './pages/main/Main.tsx'),
        route('about', './pages/main/About.tsx'),
    ]),
    layout('./components/layout/Layout.tsx', [
        index('./pages/home/Home.tsx'),
        route('groups', './pages/groups/Groups.tsx'),
        route('groups/new', './pages/groups/NewGroup.tsx'),
        route('groups/:groupId', './pages/groups/GroupDetails.tsx'),
        route('qr-scan', './pages/QRScan/QRscan.tsx'),
        route('settlements', './pages/settlements/Settlements.tsx'),
        route('profile', './pages/profile/Profile.tsx'),
        route('*', './pages/not-found/NotFound.tsx'),
    ]),
    layout('./components/layout/LoginLayout.tsx', [
        route('login', './pages/login/Login.tsx'),
        route('login/yandex', './pages/login/Yandex.tsx'),
    ]),
] satisfies RouteConfig
