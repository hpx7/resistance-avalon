import { combineReducers, reduceCompoundActions, TypedReducer, Reducer } from "redoodle";
import { IApplicationState } from "../state/index";
import { SetGameId, SetHomeAction, SetUserName, SetGame, SetGameAction } from "./actions";
import { IGameState, IHomeState, IGame, GameAction } from "./types";
import { TypedAsyncLoadedReducer } from "../common/redoodle";

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

const homeStateReducer = TypedReducer.builder<IHomeState>()
    .withHandler(SetUserName.TYPE, (state, userName) => {
        const { hasPreviouslyBeenSet, value } = state.userName;
        return {
            ...state,
            userName: {
                value: userName,
                hasPreviouslyBeenSet: hasPreviouslyBeenSet || value !== userName
            }
        };
    })
    .withHandler(SetGameId.TYPE, (state, gameId) => {
        const { hasPreviouslyBeenSet, value } = state.gameId;
        return {
            ...state,
            gameId: {
                value: gameId,
                hasPreviouslyBeenSet: hasPreviouslyBeenSet || value !== gameId
            }
        };
    })
    .withHandler(SetHomeAction.TYPE, (state, homeAction) => {
        if (state.homeAction === homeAction) {
            return state;
        } else {
            return {
                homeAction,
                userName: {
                    value: "",
                    hasPreviouslyBeenSet: false
                },
                gameId: {
                    value: "",
                    hasPreviouslyBeenSet: false
                }
            };
        }
    })
    .build();

export const appReducer: Reducer<IApplicationState> = reduceCompoundActions(combineReducers<IApplicationState>({
    gameState: gameStateReducer,
    homeState: homeStateReducer,
}));
