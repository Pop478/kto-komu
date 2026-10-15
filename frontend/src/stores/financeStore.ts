import { create } from 'zustand'

export type Member = { id: string; name: string; color: string }
export type Group = { id: string; name: string; description: string; icon: string; color: string; members: Member[] }
export type Expense = { id: string; groupId: string; title: string; amount: number; payerId: string; participantIds: string[]; date: string }

const members: Member[] = [
    { id: 'me', name: 'Вы', color: '#e4dcff' },
    { id: 'anya', name: 'Аня', color: '#ffe2d0' },
    { id: 'max', name: 'Макс', color: '#d8f3e6' },
    { id: 'lena', name: 'Лена', color: '#dcecff' },
]

const initialGroups: Group[] = [
    { id: 'trip', name: 'Поездка в Казань', description: '4 участника', icon: '✈️', color: '#eee9ff', members },
    { id: 'flat', name: 'Квартира', description: '3 участника', icon: '🏠', color: '#e2f5ee', members: members.slice(0, 3) },
]

const initialExpenses: Expense[] = [
    { id: '1', groupId: 'trip', title: 'Билеты на поезд', amount: 12400, payerId: 'me', participantIds: ['me', 'anya', 'max', 'lena'], date: 'Сегодня' },
    { id: '2', groupId: 'trip', title: 'Бронь отеля', amount: 8900, payerId: 'anya', participantIds: ['me', 'anya', 'max', 'lena'], date: 'Вчера' },
    { id: '3', groupId: 'flat', title: 'Продукты', amount: 2460, payerId: 'max', participantIds: ['me', 'anya', 'max'], date: '12 октября' },
]

type FinanceState = { groups: Group[]; expenses: Expense[]; addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void; addGroup: (group: Omit<Group, 'id' | 'members'>) => void }

export const useFinanceStore = create<FinanceState>((set) => ({
    groups: initialGroups,
    expenses: initialExpenses,
    addExpense: (expense) => set((state) => ({ expenses: [{ ...expense, id: crypto.randomUUID(), date: 'Только что' }, ...state.expenses] })),
    addGroup: (group) => set((state) => ({ groups: [...state.groups, { ...group, id: crypto.randomUUID(), members: members.slice(0, 3) }] })),
}))

export const initials = (name: string) => name.slice(0, 1).toUpperCase()
export const formatMoney = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' ₽'
export const getBalances = (group: Group, expenses: Expense[]) => {
    const balances = Object.fromEntries(group.members.map((member) => [member.id, 0])) as Record<string, number>
    expenses.filter((expense) => expense.groupId === group.id).forEach((expense) => {
        const share = expense.amount / expense.participantIds.length
        balances[expense.payerId] = (balances[expense.payerId] ?? 0) + expense.amount
        expense.participantIds.forEach((id) => { balances[id] = (balances[id] ?? 0) - share })
    })
    return balances
}
