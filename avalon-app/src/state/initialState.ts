import { IApplicationState, GameAction } from "./types";
import { AsyncLoadedValue } from "../common/redoodle";
import { History } from "history";

export const createInitialState = (history: History): IApplicationState => ({
    gameState: {
        gameAction: GameAction.VIEW_PLAYERS,
        game: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    homeState: {
        playerName: AsyncLoadedValue.asyncNotStartedLoading(),
        gameId: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    routeState: {
        location: history.location,
    },
})
