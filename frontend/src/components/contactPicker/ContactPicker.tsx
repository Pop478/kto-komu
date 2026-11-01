import { useState } from 'react'

interface Contact {
    name: string
    phone: string | null
    email: string | null
}

export function ContactPicker() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [error, setError] = useState<string | null>(null)

    const supported =
        typeof navigator !== 'undefined' &&
        typeof navigator.contacts?.select === 'function'

    const selectContacts = async () => {
        if (!navigator.contacts) return

        setError(null)

        try {
            const properties = await navigator.contacts.getProperties()

            const requested = ['name', 'tel', 'email'].filter((property) =>
                properties.includes(property),
            )

            if (!requested.length) {
                setError('Нет доступных полей контактов')
                return
            }

            const selected = await navigator.contacts.select(requested, {
                multiple: true,
            })

            setContacts(
                selected.map((contact) => ({
                    name: contact.name?.[0] ?? 'Без имени',
                    phone: contact.tel?.[0] ?? null,
                    email: contact.email?.[0] ?? null,
                })),
            )
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return
            }

            setError('Не удалось открыть список контактов')
        }
    }

    return (
        <section>
            {supported && (
                <button type="button" onClick={selectContacts}>
                    Выбрать из контактов
                </button>
            )}

            {error && <p role="alert">{error}</p>}

            {contacts.map((contact, index) => (
                <div key={`${contact.phone ?? contact.email}-${index}`}>
                    <strong>{contact.name}</strong>
                    <p>{contact.phone ?? contact.email}</p>
                </div>
            ))}

            {!supported && (
                <p>
                    Выбор контактов недоступен. Пригласите участника по ссылке.
                </p>
            )}
        </section>
    )
}
