import { Role } from "../state";

export function getRoleCounts(roles: Role[]): Map<Role, number> {
    return roles.reduce((roleCountMap, cur) => {
        const prevCount: number = roleCountMap.get(cur) || 0;
        roleCountMap.set(cur, prevCount + 1);
        return roleCountMap;
    }, new Map<Role, number>());
}