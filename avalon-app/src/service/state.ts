import { Dispatch } from "redux";
import {
    SetTitle,
    SetGameAction,
    GameAction,
    IApplicationState,
    SetPlayerName,
    SetGameId,
    SetGame,
    ClearHomeState,
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

    public clearHomeState() {
        this.dispatch(ClearHomeState.create(undefined));
    }

    public setGameAction(gameAction: GameAction) {
        this.dispatch(SetGameAction.create(gameAction));
    }

    public setDocumentTitle(title: string) {
        this.dispatch(SetTitle.create(title));
    }
}
