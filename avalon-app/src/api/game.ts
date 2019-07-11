import { IGame, Role, Vote, IGameMetadata } from "../state";
import { Supplier } from "../common/supplier";
import { NullableValue } from "../common/nullableValue";

interface IBaseResponse {
    success: boolean;
}

interface IFailureResponse extends IBaseResponse {
    success: false;
}

interface ICreateGameSuccessResponse extends IBaseResponse {
    success: true;
    gameId: string;
    playerId: string;
}

export type ICreateGameResponse = ICreateGameSuccessResponse | IFailureResponse;

export interface IJoinGameResponse extends IBaseResponse {
    playerId: string;
}

export interface IStartGameResponse extends IBaseResponse {}

export interface IProposeQuestResponse extends IBaseResponse {}

export interface IVoteOnQuestProposalResponse extends IBaseResponse {}

export interface IVoteOnQuestResponse extends IBaseResponse {}


interface IGameStateSuccessResponse extends IBaseResponse {
    success: true;
    game: IGame;
}

export type IGameStateResponse = IGameStateSuccessResponse | IFailureResponse;

export interface IGameService {
    createGame(playerName: string): Promise<ICreateGameResponse>;
    joinGame(gameId: string, playerName: string): Promise<IJoinGameResponse>;
    unsubscribFromGameChanges(gameId: string, playerId: string): void;
    startGame(
        gameId: string,
        playerId: string,
        playerName: string,
        roleList: Role[],
        playerOrder: string[]): Promise<IStartGameResponse>;
    registerListener(callback: (game: IGame) => void): void;
    subscribeToGameChanges(
        supplier: Supplier<IGameMetadata | undefined>,
        callback: (game: IGameStateResponse) => void): void;
    proposeQuest(
        questId: string,
        playerId: string,
        playerName: string,
        proposal: string[]): Promise<IProposeQuestResponse>;
    voteOnQuestProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote): Promise<IVoteOnQuestProposalResponse>;
    voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote): Promise<IVoteOnQuestResponse>;
}

export class GameService implements IGameService {
    constructor(private socket: SocketIOClient.Socket) {}

    public createGame(playerName: string): Promise<ICreateGameResponse> {
        return new Promise<ICreateGameResponse>((resolve, reject) => {
            this.socket.emit("createGame", playerName, this.emitCallback(resolve, reject));
        });
    }

    public joinGame(gameId: string, playerName: string): Promise<IJoinGameResponse> {
        return new Promise<IJoinGameResponse>((resolve, reject) => {
            this.socket.emit("joinGame", gameId, playerName, this.emitCallback(resolve, reject));
        });
    }

    public unsubscribFromGameChanges(gameId: string, playerId: string): Promise<IJoinGameResponse> {
        return new Promise<IJoinGameResponse>((resolve, reject) => {
            this.socket.emit("unsubscribe", gameId, playerId, this.emitCallback(resolve, reject));
        });
    }

    public startGame(
        gameId: string,
        playerId: string,
        playerName: string,
        roleList: Role[],
        playerOrder: string[]): Promise<IStartGameResponse> {
        return new Promise<IStartGameResponse>((resolve, reject) => {
            this.socket.emit(
                "startGame",
                gameId,
                playerId,
                playerName,
                roleList,
                playerOrder,
                this.emitCallback(resolve, reject));
        });
    }

    public registerListener(callback: (game: IGame) => void): void {
        this.socket.on("game", callback);
    }

    public subscribeToGameChanges(
        supplier: Supplier<IGameMetadata | undefined>,
        callback: (game: IGameStateResponse) => void): void {
        this.socket.on("connect", () => {
            NullableValue.of(supplier.get())
                .map(({ gameId, playerId }) => {
                    this.socket.emit("subscribe", gameId, playerId, callback);
                    return null;
                });
        })
    }

    public proposeQuest(
        questId: string,
        playerId: string,
        playerName: string,
        proposal: string[]): Promise<IProposeQuestResponse> {
        return new Promise<IProposeQuestResponse>((resolve, reject) => {
            this.socket.emit(
                "proposeQuest",
                questId,
                playerId,
                playerName,
                proposal,
                this.emitCallback(resolve, reject));
        });
    }

    public voteOnQuestProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote): Promise<IVoteOnQuestProposalResponse> {
        return new Promise<IVoteOnQuestProposalResponse>((resolve, reject) => {
            this.socket.emit(
                "proposeQuest",
                questId,
                playerId,
                playerName,
                vote,
                this.emitCallback(resolve, reject));
        });
    }

    public voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: Vote): Promise<IVoteOnQuestResponse> {
        return new Promise<IVoteOnQuestProposalResponse>((resolve, reject) => {
            this.socket.emit(
                "voteOnQuest",
                questId,
                playerId,
                playerName,
                vote,
                this.emitCallback(resolve, reject));
        });
    }

    private emitCallback = <T extends IBaseResponse>(
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void) => (response: T) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response);
            }
    };
}
