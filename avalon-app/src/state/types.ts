export interface IApplicationState {
    gameState: IGameState;
    homeState: IHomeState;
}

export interface IGameState {
    game: IGame | undefined;
}

export enum HomeAction {
    JOIN_GAME = "join",
    CREATE_GAME = "create",
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
