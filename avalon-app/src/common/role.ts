import { Role } from "../state";
import { sum } from "lodash-es";
import { TernaryValue } from "./ternary";

const roleMap: Record<Role, boolean> = {
    [Role.ASSASSIN]: false,
    [Role.LOYAL_SERVANT]: true,
    [Role.MERLIN]: true,
    [Role.MINION]: false,
    [Role.MORDRED]: false,
    [Role.MORGANA]: false,
    [Role.OBERON]: false,
    [Role.PERCIVAL]: true,
}


const relatedRoles: Record<Role, Set<Role>> = {
    [Role.LOYAL_SERVANT]: new Set<Role>([]),
    [Role.MERLIN]: new Set<Role>([]),
    [Role.MORGANA]: new Set<Role>([Role.MERLIN, Role.PERCIVAL]),
    [Role.PERCIVAL]: new Set<Role>([Role.MERLIN, Role.MORGANA]),
    [Role.MORDRED]: new Set<Role>([Role.MERLIN]),
    [Role.OBERON]: new Set<Role>([]),
    [Role.ASSASSIN]: new Set<Role>([Role.MERLIN]),
    [Role.MINION]: new Set<Role>([]),
}

export const MAX_ONE_ROLES = new Set<Role>([
    Role.MERLIN,
    Role.MORGANA,
    Role.PERCIVAL,
    Role.MORDRED,
    Role.ASSASSIN,
    Role.OBERON
]);

export function isEvilRole(role: Role) {
    return !roleMap[role];
}

export function isGoodRole(role: Role) {
    return roleMap[role];
}

export function getUnmetDependenciesMessageForRole(roleCounts: Record<Role, number>, role: Role): string | undefined {
    const roles: Role[] = (Object.keys(roleCounts) as Role[]).filter(role => roleCounts[role] > 0);
    const roleSet = new Set(roles);
    if (roleCounts[role] > 0) {
        if (role === Role.MERLIN && roles.filter(validRole => !roleMap[validRole]).length === 0) {
            return "You should add an evil role";
        }
        const unmetDependencies = Array.from(relatedRoles[role]).filter(dependency => !roleSet.has(dependency))
        if (unmetDependencies.length > 0) {
            const dependencyString = unmetDependencies.join(" and ");
            return `You should also add ${dependencyString}`;
        }
    }
    return undefined;
}

export function getRoleCounts(roles: Role[]): Map<Role, number> {
    return roles.reduce((roleCountMap, cur) => {
        const prevCount: number = roleCountMap.get(cur) || 0;
        roleCountMap.set(cur, prevCount + 1);
        return roleCountMap;
    }, new Map<Role, number>());
}

export function getNumGoodRoles(roleCounts: Record<Role, number>, roleRecord: { [key: string]: boolean; } = roleMap): number {
    if (Object.keys(roleRecord).length === 0) {
        roleRecord = roleMap;
    }
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
