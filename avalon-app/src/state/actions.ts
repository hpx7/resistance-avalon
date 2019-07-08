import { TypedAction } from "redoodle";
import { IGame, GameAction } from "./types";
import { TypedAsyncAction } from "../common/redoodle";

export const SetGame = TypedAsyncAction.define("SET_GAME")<undefined, IGame, string>();
export const SetPlayerName = TypedAsyncAction.define("SET_PLAYER_NAME")<undefined, string, string>();
export const SetGameId = TypedAsyncAction.define("SET_GAME_ID")<undefined, string, string>();
export const ClearHomeState = TypedAction.define("CLEAR_HOME_STATE")<undefined>();
export const SetGameAction = TypedAction.define("SET_GAME_ACTION")<GameAction>();
export const CreateToast = TypedAsyncAction.define("CREATE_TOAST")<string, string, string>();
export const SetTitle = TypedAction.define("SET_TITLE")<string>();
