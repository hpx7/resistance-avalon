import { Dispatch } from "redux";
import { IGameService } from "../api";
import { IApplicationState } from "../state";
import { SetGame, CreateToast } from "../state/actions";
import { IStartGameRequest } from "../api/game";

export class GameService {
    constructor(private dispatch: Dispatch<IApplicationState>, private gameService: IGameService) {}

    public createGame(userName: string) {
        return this.gameService.createGame(userName);
    }

    public joinGame(gameId: string, userName: string) {
        return this.gameService.joinGame(gameId, userName)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public startGame(gameId: string, playerId: string, playerName: string, startGameRequest: IStartGameRequest) {
        return this.gameService.startGame(gameId, playerId, playerName, startGameRequest)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public getGameState(gameId: string, userId: string): Promise<boolean> {
        this.dispatch(SetGame.InProgress(undefined))
        return this.gameService.getGameState(gameId, userId).then(game => {
            this.dispatch(SetGame.Success(game));
            return true;
        }).catch(error => {
            this.dispatch(CreateToast.Failure.create(error));
            return false;
        })
    }
}