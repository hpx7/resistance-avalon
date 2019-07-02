import { TypedAction } from "redoodle";
import { IGame, HomeAction, GameAction } from "./types";
import { TypedAsyncAction } from "../common/redoodle";

export const SetGame = TypedAsyncAction.define("SET_GAME")<undefined, IGame, string>();
export const SetPlayerName = TypedAsyncAction.define("SET_PLAYER_NAME")<undefined, string, string>();
export const SetGameId = TypedAsyncAction.define("SET_GAME_ID")<undefined, string, string>();
export const SetHomeAction = TypedAction.define("SET_HOME_ACTION")<HomeAction>();
export const SetGameAction = TypedAction.define("SET_GAME_ACTION")<GameAction>();
export const CreateToast = TypedAsyncAction.define("CREATE_TOAST")<string, string, string>();
export const SetTitle = TypedAction.define("SET_TITLE")<string>();
