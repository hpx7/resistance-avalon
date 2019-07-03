export function removeElementAtIndex<T>(arr: T[], idx: number) {
    return [...arr.slice(0, idx), ...arr.slice(idx + 1, arr.length)];
}