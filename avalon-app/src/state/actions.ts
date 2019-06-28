import { TypedAction } from "redoodle";
import { IGame } from "./types";

export const SET_GAME = TypedAction.define("SET_GAME")<IGame>();
export const CLEAR_GAME = TypedAction.define("CLEAR_GAME")<undefined>();
export const SET_USER_NAME = TypedAction.define("SET_USER_NAME")<string>();
export const SET_GAME_ID = TypedAction.define("SET_GAME_ID")<string>();
