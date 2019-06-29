import { TypedAction } from "redoodle";
import { IGame, HomeAction, GameAction } from "./types";
import { TypedAsyncAction } from "../common/redoodle";

export const SetGame = TypedAsyncAction.define("SET_GAME")<undefined, IGame, string>();
export const SetUserName = TypedAction.define("SET_USER_NAME")<string>();
export const SetGameId = TypedAction.define("SET_GAME_ID")<string>();
export const SetHomeAction = TypedAction.define("SET_HOME_ACTION")<HomeAction>();
export const SetGameAction = TypedAction.define("SET_GAME_ACTION")<GameAction>();
export const CreateToast = TypedAsyncAction.define("CREATE_TOAST")<string, string, string>();
