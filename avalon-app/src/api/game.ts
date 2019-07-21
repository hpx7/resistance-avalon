import { IGame, Role, Vote } from "../state";
import { Supplier } from "../common/supplier";
import { NullableValue } from "../common/nullableValue";

interface IBaseResponse {
    error?: string | null;
}

export interface ICreateGameResponse extends IBaseResponse {}

export interface IJoinGameResponse extends IBaseResponse {}

export interface IStartGameResponse extends IBaseResponse {}

export interface IProposeQuestResponse extends IBaseResponse {}

export interface IVoteOnQuestProposalResponse extends IBaseResponse {}

export interface IVoteOnQuestResponse extends IBaseResponse {}

export interface IRejoinResponse extends IBaseResponse {}

export interface IAssassinateResponse extends IBaseResponse {}

export interface IGameService {
    createGame(playerName: string): Promise<ICreateGameResponse>;
    joinGame(gameId: string, playerName: string): Promise<IJoinGameResponse>;
    startGame(
        gameId: string,
        playerId: string,
        playerName: string,
        roleList: Role[],
        playerOrder: string[]): Promise<IStartGameResponse>;
    registerListener(callback: (game: IGame) => void): void;
    reJoinGame(supplier: Supplier<string | undefined>, callback: (game: IRejoinResponse) => void): void;
    leaveGame(supplier: Supplier<string | undefined>): void;
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
    assassinate(
        questId: string,
        playerId: string,
        playerName: string,
        target: string): Promise<IAssassinateResponse>;
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

    public reJoinGame(supplier: Supplier<string | undefined>, callback: (game: IRejoinResponse) => void): void {
        this.socket.on("connect", () => {
            return NullableValue.of(supplier.get())
                .map((playerId) => {
                    this.socket.emit("rejoinGame", playerId, callback);
                    return null;
                });
        });
    }

    public leaveGame(supplier: Supplier<string | undefined>): void {
        NullableValue.of(supplier.get())
            .map((playerId) => {
                this.socket.emit("leaveGame", playerId);
                return null;
            });
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
                "voteForProposal",
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
                "voteInQuest",
                questId,
                playerId,
                playerName,
                vote,
                this.emitCallback(resolve, reject));
        });
    }

    public assassinate(
        questId: string,
        playerId: string,
        playerName: string,
        target: string): Promise<IAssassinateResponse> {
        return new Promise<IAssassinateResponse>((resolve, reject) => {
            this.socket.emit(
                "assassinate",
                questId,
                playerId,
                playerName,
                target,
                this.emitCallback(resolve, reject));
        });
    }

    private emitCallback = <T extends IBaseResponse>(
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void) => (response: T) => {
            if (response.error == null) {
                resolve(response);
            } else {
                reject(response.error);
            }
    };
}
