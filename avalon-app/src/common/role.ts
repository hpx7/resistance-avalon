import { Role } from "../state";

// TODO delete once BE returns role map even when game is not started
function getRoleMap(): { [key: string]: boolean } {
    const roleMap: Record<Role, boolean> = {
        [Role.MERLIN]: true,
        [Role.MORGANA]: false,
        [Role.PERCIVAL]: true,
        [Role.MORDRED]: false,
        [Role.OBERON]: false,
        [Role.ASSASSIN]: false,
        [Role.LOYAL_SERVANT]: true,
        [Role.MINION]: false,
    }
    return roleMap;
}

export function getRoleCounts(roles: Role[]): Map<Role, number> {
    return roles.reduce((roleCountMap, cur) => {
        const prevCount: number = roleCountMap.get(cur) || 0;
        roleCountMap.set(cur, prevCount + 1);
        return roleCountMap;
    }, new Map<Role, number>());
}

export function getNumGoodRoles(roles: Role[], roleMap: { [key: string]: boolean } = getRoleMap()): number {
    return roles.filter(role => roleMap[role]).length;
}
