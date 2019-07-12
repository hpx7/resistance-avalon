import { combineReducers, reduceCompoundActions, TypedReducer, composeReducers } from "redoodle";
import { SetGameId, ClearHomeState, SetPlayerName, SetGame, SetGameAction } from "./actions";
import { IGameState, IHomeState, IGame, GameAction, IRouterState, IApplicationState } from "./types";
import { TypedAsyncLoadedReducer, AsyncLoadedValue } from "../common/redoodle";
import { Reducer } from "redux";

const gameReducer = TypedAsyncLoadedReducer.builder<IGame, string>()
    .withAsyncLoadHandler(SetGame, game => game, error => error)
    .build();

const gameActionReducer = TypedReducer.builder<GameAction>()
    .withHandler(SetGameAction.TYPE, (state, gameAction) => {
        return state === gameAction ? state : gameAction;
    })
    .build();

const gameStateReducer = combineReducers<IGameState>({
    game: gameReducer,
    gameAction: gameActionReducer
});

const playerNameReducer = TypedAsyncLoadedReducer.builder<string, string>()
    .withAsyncLoadHandler(SetPlayerName, playerName => playerName, error => error)
    .build();

const gameIdReducer = TypedAsyncLoadedReducer.builder<string, string>()
    .withAsyncLoadHandler(SetGameId, gameId => gameId, error => error)
    .build();

const individualHomeStateReducer = combineReducers<IHomeState>({
    playerName: playerNameReducer,
    gameId: gameIdReducer,
});

const combinedHomeStateReducer = TypedReducer.builder<IHomeState>()
    .withHandler(ClearHomeState.TYPE, () => ({
        playerName: AsyncLoadedValue.asyncNotStartedLoading(),
        gameId: AsyncLoadedValue.asyncNotStartedLoading(),
    }))
    .build();

const homeStateReducer = composeReducers<IHomeState>(individualHomeStateReducer, combinedHomeStateReducer)

const routeStateReducer = TypedReducer.builder<IRouterState>()
    .withHandler(ClearHomeState.TYPE, (state) => state)
    .build();

export const appReducer: Reducer<IApplicationState | undefined> = reduceCompoundActions(
    combineReducers<IApplicationState | undefined>({
        gameState: gameStateReducer,
        homeState: homeStateReducer,
        routeState: routeStateReducer,
    })
);
