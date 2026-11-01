interface ContactPickerContact {
    name?: string[]
    tel?: string[]
    email?: string[]
}

interface ContactPickerManager {
    getProperties(): Promise<string[]>
    select(
        properties: string[],
        options?: { multiple?: boolean },
    ): Promise<ContactPickerContact[]>
}

interface Navigator {
    readonly contacts?: ContactPickerManager
}
