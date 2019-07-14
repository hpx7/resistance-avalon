import { NullableValue } from "./nullableValue";

export class CountableValue<T> {
    public static of<T>(value: T[]): CountableValue<T> {
        return value.length === 0 ? CountableValue.EMPTY_VALUE : new CountableValue<T>(value);
    }

    private static EMPTY_VALUE = new CountableValue<any>([]);

    private value: T[];

    private constructor(value: T[]) {
        this.value = value;
    }

    public map<V>(mapper: (value: T, idx: number) => V): CountableValue<V> {
        return CountableValue.of(this.value.map(mapper));
    }

    public isEmpty(): boolean {
        return this.value.length === 0;
    }

    public maybeGetElementAtIndex(index: number): NullableValue<T> {
        return this.count() <= index || index < 0
            ? NullableValue.of<T>(undefined)
            : NullableValue.of(this.value[index]);
    }

    public maybeGetLastElement(): NullableValue<T> {
        return this.isEmpty() ? NullableValue.of<T>(undefined) : NullableValue.of(this.value[this.count() - 1]);
    }

    public count(): number {
        return this.value.length;
    }

    public getValue() {
        return this.value;
    }

    public getValueOrDefault<T>(defaultValue: T) {
        return this.isEmpty() ? defaultValue : this.value;
    }
}
