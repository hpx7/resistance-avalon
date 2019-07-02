import { IApplicationState, HomeAction, GameAction } from "./types";
import { AsyncLoadedValue } from "../common/redoodle";

export const INITIAL_APPLICATION_STATE: IApplicationState = {
    gameState: {
        gameAction: GameAction.VIEW_PLAYERS,
        game: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    homeState: {
        homeAction: HomeAction.JOIN_GAME,
        playerName: AsyncLoadedValue.asyncNotStartedLoading(),
        gameId: AsyncLoadedValue.asyncNotStartedLoading(),
    }
}
