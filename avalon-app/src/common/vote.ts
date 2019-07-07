import { Vote } from "../state/types";
import { assertNever } from "./assertNever";

export function voteToString(vote: Vote, isQuest: boolean = false) {
    switch (vote) {
        case Vote.FAIL:
            return isQuest ? "Fail" : "Reject";
        case Vote.PASS:
            return isQuest ? "Pass" : "Approve";
        default:
            return assertNever(vote);
    }
}