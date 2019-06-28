import { IAsyncLoaded } from "../common/redoodle";
import { IGameService } from "../api";

export interface IApplicationState {
    gameState: IGameState;
    homeState: IHomeState;
}

export interface IGameState {
    game: IAsyncLoaded<IGame, string>;
}

export enum HomeAction {
    JOIN_GAME = "join",
    CREATE_GAME = "create",
}

export interface ISettableValue {
    value: string;
    hasPreviouslyBeenSet: boolean;
}

export interface ISettableValue {
    value: string;
    hasPreviouslyBeenSet: boolean;
}

export interface IHomeState {
    homeAction: HomeAction;
    userName: ISettableValue;
    gameId: ISettableValue;
}

export interface IQuestAttempt {
    attemptNumber: number;
    leader: string;
    members: string[];
    questNumber: number;
    results: boolean[];
    votes: Map<string, boolean>;
}

export interface IGame {
    id: string;
    myName: string;
    myRole: string;
    knowledge: string[];
    players: string[];
    questConfigurations: number[];
    questAttempts: IQuestAttempt[];
    roleList: string[];
}

export interface ICreatedGame {
    gameId: string;
    userId: string;
}

export interface IEndpoints {
    gameServiceApi: string | undefined;
}

export interface IApplicationApi {
    gameService: IGameService;
}

