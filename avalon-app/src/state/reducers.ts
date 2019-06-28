import { combineReducers, reduceCompoundActions, TypedReducer, Reducer } from "redoodle";
import { IApplicationState } from "../state/index";
import { SET_GAME, CLEAR_GAME, SET_USER_NAME, SET_GAME_ID } from "./actions";
import { IGameState, IHomeState } from "./types";

const gameStateReducer = TypedReducer.builder<IGameState>()
    .withHandler(SET_GAME.TYPE, (state, game) => {
        const {game: prevGame} = state;
        return prevGame == null || game.id !== prevGame.id ? { game } : state;
    })
    .withHandler(CLEAR_GAME.TYPE, () => ({ game: undefined}))
    .build();

const homeStateReducer = TypedReducer.builder<IHomeState>()
    .withHandler(SET_USER_NAME.TYPE, (state, userName) => ({ ...state, userName }))
    .withHandler(SET_GAME_ID.TYPE, (state, gameId) => ({ ...state, gameId }))
    .build();

export const appReducer: Reducer<IApplicationState> = reduceCompoundActions(combineReducers<IApplicationState>({
    gameState: gameStateReducer,
    homeState: homeStateReducer,
}));
