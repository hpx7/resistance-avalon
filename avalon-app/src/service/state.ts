import { Dispatch } from "redux";
import { SetUserName, SetGameId, SetHomeAction, SetGame } from "../state/actions";
import { IApplicationState } from "../state";
import { HomeAction } from "../state/types";

export class StateService {
    constructor(private dispatch: Dispatch<IApplicationState>) {}

    public clearGame() {
        this.dispatch(SetGame.Clear.create(undefined));
    }

    public setUserName(userName: string) {
        this.dispatch(SetUserName.create(userName));
    }

    public setGameId(gameUserId: string) {
        this.dispatch(SetGameId.create(gameUserId));
    }

    public setHomeAction(homeAction: HomeAction) {
        this.dispatch(SetHomeAction.create(homeAction))
    }
}
