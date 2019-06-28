export function assertNever(value: never): never {
    throw new Error(`Value should be unreachable: ${value}`);
}