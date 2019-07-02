import { Dispatch } from "redux";
import {
    SetTitle,
    SetGameAction,
    HomeAction,
    GameAction,
    IApplicationState,
    SetPlayerName,
    SetGameId,
    SetHomeAction,
    SetGame,
} from "../state";

export class StateService {
    constructor(private dispatch: Dispatch<IApplicationState>) {}

    public clearGame() {
        this.dispatch(SetGame.Clear.create(undefined));
    }

    public setUserName(userName: string) {
        this.dispatch(SetPlayerName.Success.create(userName));
    }

    public setGameId(gameUserId: string) {
        this.dispatch(SetGameId.Success.create(gameUserId));
    }

    public setHomeAction(homeAction: HomeAction) {
        this.dispatch(SetHomeAction.create(homeAction));
    }

    public setGameAction(gameAction: GameAction) {
        this.dispatch(SetGameAction.create(gameAction));
    }

    public setDocumentTitle(title: string) {
        this.dispatch(SetTitle.create(title));
    }
}
