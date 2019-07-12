import { Dispatch } from "redux";
import { Action } from "redoodle";
import {
    SetTitle,
    SetGameAction,
    GameAction,
    SetPlayerName,
    SetGameId,
    SetGame,
    ClearHomeState,
    CreateToast,
} from "../state";

export class StateService {
    constructor(private dispatch: Dispatch<Action>) {}

    public clearGame() {
        this.dispatch(SetGame.Clear.create(undefined));
    }

    public setUserName(userName: string) {
        this.dispatch(SetPlayerName.Success.create(userName));
    }

    public setGameId(gameUserId: string | undefined) {
        this.dispatch(gameUserId == null
            ? SetGameId.Clear.create(undefined)
            : SetGameId.Success.create(gameUserId));
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

    public showFailToast(toast: string) {
        this.dispatch(CreateToast.Failure.create(toast));
    }
}
