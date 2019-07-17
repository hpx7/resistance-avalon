import { Store } from "redux";
import { IGameService } from "../api";
import { IApplicationState } from "../state";
import { SetGame, CreateToast } from "../state/actions";
import { Vote, Role } from "../state/types";
import { Supplier } from "../common/supplier";

export class GameService {
    constructor(private store: Store<IApplicationState>, private gameService: IGameService) {
    }

    public createGame(playerName: string) {
        return this.gameService.createGame(playerName);
    }

    public joinGame(gameId: string, playerName: string) {
        return this.gameService.joinGame(gameId, playerName)
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

    public register(supplier: Supplier<string | undefined>) {
        this.gameService.registerListener(game => {
            this.store.dispatch(SetGame.Success(game));
        });
        this.gameService.reJoinGame(supplier, gameStateResponse => {
            if (!gameStateResponse.success) {
                return SetGame.Failure("Could not rejoin game");
            }
        })
    }

    public unregister(supplier: Supplier<string | undefined>) {
        this.gameService.leaveGame(supplier);
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
