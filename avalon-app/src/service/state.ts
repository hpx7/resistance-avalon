import { Dispatch } from "redux";
import { SET_USER_NAME, SET_GAME_ID } from "../state/actions";
import { IApplicationState } from "../state";

export class StateService {
    constructor(private dispatch: Dispatch<IApplicationState>) {}

    public setUserName(userName: string) {
        this.dispatch(SET_USER_NAME.create(userName));
    }

    public setGameId(gameUserId: string) {
        this.dispatch(SET_GAME_ID.create(gameUserId));
    }
}
