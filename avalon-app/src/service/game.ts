import { Store } from "redux";
import { IGameService } from "../api";
import { IApplicationState } from "../state";
import { SetGame, CreateToast } from "../state/actions";
import { Vote, Role, IGameMetadata } from "../state/types";
import { Supplier } from "../common/supplier";

export class GameService {
    constructor(private store: Store<IApplicationState>, private gameService: IGameService) {
    }

    public createGame(userName: string) {
        return this.gameService.createGame(userName);
    }

    public joinGame(gameId: string, userName: string) {
        return this.gameService.joinGame(gameId, userName)
            .catch(error => {
                this.store.dispatch(CreateToast.Failure.create(error));
            });
    }

    public startGame(gameId: string, playerId: string, playerName: string, roleList: Role[], playerOrder: string[]) {
        return this.gameService.startGame(gameId, playerId, playerName, roleList, playerOrder)
            .catch(error => {
                this.store.dispatch(CreateToast.Failure.create(error));
            });
    }

    public subscribeToGame(supplier: Supplier<IGameMetadata>) {
        this.gameService.registerListener(game => {
            this.store.dispatch(SetGame.Success(game));
        });
        this.gameService.subscribeToGameChanges(supplier, game => {
            this.store.dispatch(SetGame.Success(game));
        })
    }

    public unsubscribFromGame(gameId: string) {
        this.gameService.unsubscribFromGameChanges(gameId);
    }

    public proposeQuest(
        questId: string,
        playerId: string,
        playerName: string,
        proposals: string[]) {
        return this.gameService.proposeQuest(questId, playerId, playerName, proposals)
            .catch(error => {
                this.store.dispatch(CreateToast.Failure.create(error));
            });
    }

    public voteOnProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote) {
        this.gameService.voteOnQuestProposal(questId, playerId, playerName, vote)
            .catch(error => {
                this.store.dispatch(CreateToast.Failure.create(error));
            });
    }

    public voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote) {
        this.gameService.voteOnQuest(questId, playerId, playerName, vote)
            .catch(error => {
                this.store.dispatch(CreateToast.Failure.create(error));
            });
    }
}
