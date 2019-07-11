import { Dispatch } from "redux";
import { IGameService } from "../api";
import { IApplicationState } from "../state";
import { SetGame, CreateToast } from "../state/actions";
import { Vote, Role } from "../state/types";

export class GameService {
    constructor(private dispatch: Dispatch<IApplicationState>, private gameService: IGameService) {
        this.gameService.registerToGameChanges(game => {
            this.dispatch(SetGame.Success(game));
        })
    }

    public createGame(userName: string) {
        return this.gameService.createGame(userName);
    }

    public joinGame(gameId: string, userName: string) {
        return this.gameService.joinGame(gameId, userName)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public startGame(gameId: string, playerId: string, playerName: string, roleList: Role[], playerOrder: string[]) {
        return this.gameService.startGame(gameId, playerId, playerName, roleList, playerOrder)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public leaveGame(gameId: string) {
        this.gameService.leaveGame(gameId);
    }

    public proposeQuest(
        questId: string,
        playerId: string,
        playerName: string,
        proposals: string[]) {
        return this.gameService.proposeQuest(questId, playerId, playerName, proposals)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public voteOnProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote) {
        this.gameService.voteOnQuestProposal(questId, playerId, playerName, vote)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }

    public voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote) {
        this.gameService.voteOnQuest(questId, playerId, playerName, vote)
            .catch(error => {
                this.dispatch(CreateToast.Failure.create(error));
            });
    }
}
