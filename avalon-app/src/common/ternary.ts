export class TernaryValue<T, F> {
    public static of(value: boolean): TernaryValue<undefined, undefined> {
        return value ? TernaryValue.TRUE_VALUE : TernaryValue.FALSE_VALUE;
    }

    private static TRUE_VALUE = new TernaryValue(true, undefined, undefined);
    private static FALSE_VALUE = new TernaryValue(false, undefined, undefined);

    private value: boolean;
    private trueValue: T;
    private falseValue: F;

    private constructor(value: boolean, trueValue: T, falseValue: F) {
        this.value = value;
        this.trueValue = trueValue;
        this.falseValue = falseValue;
    }

    public ifTrue<V>(trueValue: V): TernaryValue<V, F> {
        return new TernaryValue(this.value, trueValue, this.falseValue);
    }

    public ifFalse<V>(falseValue: V): TernaryValue<T, V> {
        return new TernaryValue(this.value, this.trueValue, falseValue);
    }

    public get(): T | F {
        return this.value ? this.trueValue : this.falseValue;
    }
}