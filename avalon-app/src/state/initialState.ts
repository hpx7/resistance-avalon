import { IApplicationState, HomeAction } from "./types";
import { asyncNotStartedLoading } from "../common/redoodle";

export const INITIAL_APPLICATION_STATE: IApplicationState = {
    gameState: {
        game: asyncNotStartedLoading(),
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
