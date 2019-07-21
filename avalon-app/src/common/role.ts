import { Role } from "../state";
import { sum } from "lodash-es";
import { TernaryValue } from "./ternary";

export function getRoleCounts(roles: Role[]): Map<Role, number> {
    return roles.reduce((roleCountMap, cur) => {
        const prevCount: number = roleCountMap.get(cur) || 0;
        roleCountMap.set(cur, prevCount + 1);
        return roleCountMap;
    }, new Map<Role, number>());
}

export function getNumGoodRoles(roleCounts: Record<Role, number>, roleRecord: { [key: string]: boolean; }): number {
    const roles: Role[] = Object.keys(roleCounts) as Role[];
    return sum(roles.map(role => roleRecord[role] ? roleCounts[role] : 0));
}

export function getNumRoles(roleCounts: Record<Role, number>): number {
    const roles: Role[] = Object.keys(roleCounts) as Role[];
    return sum(roles.map(role => roleCounts[role]));
}

export function calcNumGoodPlayers(numPlayers: number) {
    const half = Math.ceil(numPlayers / 2);
    return half + TernaryValue.of(numPlayers % 2 === 0)
        .ifTrue(1)
        .ifFalse(0)
        .get();
}
