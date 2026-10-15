import {
    index,
    layout,
    route,
    type RouteConfig,
} from '@react-router/dev/routes'

export default [
    layout('./components/layout/Layout.tsx', [
        index('./pages/dashboard/Dashboard.tsx'),
        route('groups', './pages/groups/Groups.tsx'),
        route('groups/new', './pages/groups/NewGroup.tsx'),
        route('groups/:groupId', './pages/groups/GroupDetails.tsx'),
        route('expenses/new', './pages/expenses/NewExpense.tsx'),
        route('settlements', './pages/settlements/Settlements.tsx'),
        route('*', './pages/not-found/NotFound.tsx'),
    ]),
] satisfies RouteConfig
