import { IApplicationState, GameAction } from "./types";
import { AsyncLoadedValue } from "../common/redoodle";

export const INITIAL_APPLICATION_STATE: IApplicationState = {
    gameState: {
        gameAction: GameAction.VIEW_PLAYERS,
        game: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    homeState: {
        playerName: AsyncLoadedValue.asyncNotStartedLoading(),
        gameId: AsyncLoadedValue.asyncNotStartedLoading(),
    }
}
