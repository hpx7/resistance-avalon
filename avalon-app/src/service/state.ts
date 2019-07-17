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

    public setPlayerName(playerName: string) {
        this.dispatch(SetPlayerName.Success.create(playerName));
    }

    public setGameId(gameId: string | undefined) {
        this.dispatch(gameId == null
            ? SetGameId.Clear.create(undefined)
            : SetGameId.Success.create(gameId));
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

    public showSuccessToast(toast: string) {
        this.dispatch(CreateToast.Success.create(toast));
    }

    public showInProgressToast(toast: string) {
        this.dispatch(CreateToast.InProgress.create(toast));
    }
}
