import { IApplicationState } from "./types";

export const INITIAL_APPLICATION_STATE: IApplicationState = {
    gameState: {
        game: undefined,
    },
    homeState: {
        userName: undefined,
        gameId: undefined,
    }
}