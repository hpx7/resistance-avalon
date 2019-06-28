import { combineReducers, reduceCompoundActions, TypedReducer, Reducer } from "redoodle";
import { IApplicationState } from "../state/index";
import { SET_GAME, CLEAR_GAME, SET_USER_NAME, SET_GAME_ID, SET_HOME_ACTION } from "./actions";
import { IGameState, IHomeState } from "./types";

const gameStateReducer = TypedReducer.builder<IGameState>()
    .withHandler(SET_GAME.TYPE, (state, game) => {
        const {game: prevGame} = state;
        return prevGame == null || game.id !== prevGame.id ? { game } : state;
    })
    .withHandler(CLEAR_GAME.TYPE, () => ({ game: undefined}))
    .build();

const homeStateReducer = TypedReducer.builder<IHomeState>()
    .withHandler(SET_USER_NAME.TYPE, (state, userName) => {
        const { hasPreviouslyBeenSet, value } = state.userName;
        return {
            ...state,
            userName: {
                value: userName,
                hasPreviouslyBeenSet: hasPreviouslyBeenSet || value !== userName
            }
        };
    })
    .withHandler(SET_GAME_ID.TYPE, (state, gameId) => {
        const { hasPreviouslyBeenSet, value } = state.gameId;
        return {
            ...state,
            gameId: {
                value: gameId,
                hasPreviouslyBeenSet: hasPreviouslyBeenSet || value !== gameId
            }
        };
    })
    .withHandler(SET_HOME_ACTION.TYPE, (state, homeAction) => {
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
