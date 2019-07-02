import { IGame } from "../state";
import { IHttpApiBridge, MediaType, IHttpEndpointOptions } from "conjure-client";
import { Role } from "../state/types";

interface IBaseResponse {
    success: boolean;
}

export interface ICreateGameResponse extends IBaseResponse {
    gameId: string;
    playerId: string;
}

export interface IJoinGameResponse extends IBaseResponse {
    playerId: string;
}

export interface IStartGameResponse extends IBaseResponse {}

export interface IProposeQuestResponse extends IBaseResponse {}

export interface IVoteOnQuestProposalResponse extends IBaseResponse {}

export interface IVoteOnQuestResponse extends IBaseResponse {}

export interface IStartGameRequest {
    roleList: Role[];
    playerOrder: string[];
}

export interface IProposeQuestRequest {
    proposal: string[];
}

export interface IGameService {
    createGame(playerName: string): Promise<ICreateGameResponse>;
    joinGame(gameId: string, playerName: string): Promise<IJoinGameResponse>;
    startGame(
        gameId: string,
        playerId: string,
        playerName: string,
        startGameRequest: IStartGameRequest): Promise<IStartGameResponse>;
    getGameState(gameId: string, userId: string): Promise<IGame>;
    proposeQuest(
        gameId: string,
        playerId: string,
        playerName: string,
        proposeQuestRequest: IProposeQuestRequest): Promise<IProposeQuestResponse>;
    voteOnQuestProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: number): Promise<IVoteOnQuestProposalResponse>;
    voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: number): Promise<IVoteOnQuestResponse>;
}

export class GameService implements IGameService {
    private static BASE_HTTP_ENDPOINT_OPTIONS: IHttpEndpointOptions = {
        endpointPath: "base-path",
        headers: {},
        method: "POST",
        pathArguments: [],
        queryArguments: {},
        requestMediaType: MediaType.APPLICATION_JSON,
        responseMediaType: MediaType.APPLICATION_JSON,
    }

    constructor(private bridge: IHttpApiBridge) {}

    public createGame(playerName: string): Promise<ICreateGameResponse> {
        return this.bridge.callEndpoint<ICreateGameResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            endpointName: "createGame",
            endpointPath: "/api/create/{playerName}",
            pathArguments: [ playerName ],
        });
    }

    public joinGame(gameId: string, playerName: string): Promise<IJoinGameResponse> {
        return this.bridge.callEndpoint<IJoinGameResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            endpointName: "joinGame",
            endpointPath: "/api/join/{gameId}/{playerName}",
            pathArguments: [ gameId, playerName],
        });
    }

    public startGame(
        gameId: string,
        playerId: string,
        playerName: string,
        startGameRequest: IStartGameRequest): Promise<IStartGameResponse> {
        return this.bridge.callEndpoint<IStartGameResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: startGameRequest,
            endpointName: "startGame",
            endpointPath: "/api/start/{gameId}/{playerId}/{playerName}",
            pathArguments: [ gameId, playerId, playerName ],
        });
    }

    public getGameState(gameId: string, playerId: string): Promise<IGame> {
        return this.bridge.callEndpoint<IGame>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            method: "GET",
            endpointName: "getGameState",
            endpointPath: "/api/state/{gameId}/{playerId}",
            pathArguments: [ gameId, playerId ],
        });
    }

    public proposeQuest(
        questId: string,
        playerId: string,
        playerName: string,
        proposeQuestRequest: IProposeQuestRequest): Promise<IProposeQuestResponse> {
        return this.bridge.callEndpoint<IProposeQuestResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: proposeQuestRequest,
            endpointName: "proposeQuest",
            endpointPath: "/api/propose/{questId}/{playerId}/{playerName}",
            pathArguments: [ questId, playerId, playerName ],
        });
    }

    public voteOnQuestProposal(
        questId: string,
        playerId: string,
        playerName: string,
        vote: number): Promise<IVoteOnQuestProposalResponse> {
        return this.bridge.callEndpoint<IVoteOnQuestProposalResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            endpointName: "proposeQuest",
            endpointPath: "/api/propose/{questId}/{playerId}/{playerName}/{vote}",
            pathArguments: [ questId, playerId, playerName, vote ],
        });
    }

    public voteOnQuest(
        questId: string,
        playerId: string,
        playerName: string,
        vote: number): Promise<IVoteOnQuestResponse> {
        return this.bridge.callEndpoint<IVoteOnQuestResponse>({
            ...GameService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            endpointName: "proposeQuest",
            endpointPath: "/api/propose/{questId}/{playerId}/{playerName}/{vote}",
            pathArguments: [ questId, playerId, playerName, vote ],
        });
    }
}