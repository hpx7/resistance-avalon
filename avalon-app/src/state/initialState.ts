import { IApplicationState, HomeAction } from "./types";

export const INITIAL_APPLICATION_STATE: IApplicationState = {
    gameState: {
        game: undefined,
    },
    homeState: {
        homeAction: HomeAction.JOIN_GAME,
        userName: {
            value: "",
            hasPreviouslyBeenSet: false,
        },
        gameId: {
            value: "",
            hasPreviouslyBeenSet: false,
        }
    }
}
