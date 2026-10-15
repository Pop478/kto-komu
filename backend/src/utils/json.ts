export function serialize(data: unknown) {
    return JSON.stringify(data)
}

export function deserialize<T>(data: string): T {
    return JSON.parse(data)
}
