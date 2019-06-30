import { Role } from "../state";
import { assertNever } from "./assertNever";

export function isEvilRole(role: Role) {
    switch (role) {
        case Role.MORGANA:
        case Role.MORDRED:
        case Role.OBERON:
        case Role.MINION:
            return true;
        case Role.ASSASSIN:
        case Role.MERLIN:
        case Role.PERCIVAL:
        case Role.LOYAL_SERVANT:
            return false;
        default:
            return assertNever(role);
    }
}