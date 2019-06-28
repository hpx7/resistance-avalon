import { Dispatch } from "redux";
import { IGameService } from "../api";
import { IApplicationState } from "../state";
import { SetGame } from "../state/actions";

export class GameService {
    constructor(private dispatch: Dispatch<IApplicationState>, private gameService: IGameService) {}

    public createGame(userName: string) {
        return this.gameService.createGame(userName);
    }

    public joinGame(gameId: string, userName: string) {
        return this.gameService.joinGame(gameId, userName);
    }

    public startGame(gameId: string, userId: string) {
        this.gameService.startGame(gameId, userId).catch(error => {
            console.log(error);
        })
    }

    public getGameState(gameId: string, userId: string) {
        this.dispatch(SetGame.InProgress(undefined))
        this.gameService.getGameState(gameId, userId).then(game => {
            this.dispatch(SetGame.Success(game));
        })
    }
}
