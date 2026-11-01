import { Link } from 'react-router'
import {
    formatMoney,
    getBalances,
    initials,
    useFinanceStore,
} from '../../stores/financeStore'
import { SEO } from '../../components/SEO'
import Button from '../../components/buttons/Button'
import HomeIcon from '../../assets/home.svg?react'
import Toggle from '../../components/Toggles/Toggle'
import Dropdown from '../../components/dropdowns/Dropdown'
import { useState } from 'react'
import Modal from '../../components/modal/Modal'
import Portal from '../../components/portal/Portal'
import ConfirmModal from '../../components/modal/ConfirmModal'

const Dashboard = () => {
    const [modal, setModal] = useState(false)
    const { groups, expenses } = useFinanceStore()
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const myBalance = groups.reduce(
        (sum, group) => sum + (getBalances(group, expenses).me ?? 0),
        0,
    )
    return (
        <>
            <SEO
                title="Совместные расходы без сложных расчётов"
                description="КтоКому — делите счета, учитывайте общие расходы и узнавайте, кто кому должен."
            />
            <Button onClick={() => setModal(true)}>Продолжить</Button>

            <Dropdown
                options={[
                    { value: 'new', label: 'Новые' },
                    { value: 'popular', label: 'Популярные' },
                    { value: 'old', label: 'Популярные' },
                    { value: 'error', label: 'Популярные' },
                ]}
                multiple
                defaultValue={['new']}
                onChange={(values) => console.log(values)}
                maxMenuHeight={240}
            />

            {/* <Portal>
                <Modal
                    open={modal}
                    close={() => setModal(false)}
                    title={'modal'}
                    showCloseButton={true}
                >
                    <Dropdown
                        options={[
                            { value: 'new', label: 'Новые' },
                            { value: 'popular', label: 'Популярные' },
                            { value: 'old', label: 'Популярные' },
                            { value: 'error', label: 'Популярные' },
                        ]}
                        multiple
                        defaultValue={['new']}
                        onChange={(values) => console.log(values)}
                        maxMenuHeight={240}
                    />
                    <p>Modal</p>
                </Modal>
            </Portal> */}
            <Portal>
                <ConfirmModal
                    open={modal}
                    close={() => setModal(false)}
                    onConfirm={() => setModal(false)}
                >
                    <p>Modal</p>
                </ConfirmModal>
            </Portal>
        </>
    )
}
export default Dashboard
