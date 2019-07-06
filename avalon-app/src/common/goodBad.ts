import { TernaryValue } from "./ternary";

export function calcNumGoodPlayers(numPlayers: number) {
    const half = Math.ceil(numPlayers / 2);
    return half + TernaryValue.of(numPlayers % 2 === 0)
        .ifTrue(1)
        .ifFalse(0)
        .get();
}
