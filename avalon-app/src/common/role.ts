import { Role } from "../state";
import { sum } from "lodash-es";
import { TernaryValue } from "./ternary";

const roleRecord: Record<Role, boolean> = {
    [Role.MERLIN]: true,
    [Role.MORGANA]: false,
    [Role.PERCIVAL]: true,
    [Role.MORDRED]: false,
    [Role.OBERON]: false,
    [Role.ASSASSIN]: false,
    [Role.LOYAL_SERVANT]: true,
    [Role.MINION]: false,
}

export const ROLES: Role[] = Object.keys(roleRecord) as Role[];

export function getRoleCounts(roles: Role[]): Map<Role, number> {
    return roles.reduce((roleCountMap, cur) => {
        const prevCount: number = roleCountMap.get(cur) || 0;
        roleCountMap.set(cur, prevCount + 1);
        return roleCountMap;
    }, new Map<Role, number>());
}

export function getNumGoodRoles(roles: Record<Role, number>): number {
    return sum(ROLES.map(role => roleRecord[role] ? roles[role] : 0));
}

export function getNumRoles(roles: Record<Role, number>): number {
    return sum(ROLES.map(role => roles[role]));
}

export function calcNumGoodPlayers(numPlayers: number) {
    const half = Math.ceil(numPlayers / 2);
    return half + TernaryValue.of(numPlayers % 2 === 0)
        .ifTrue(1)
        .ifFalse(0)
        .get();
}
