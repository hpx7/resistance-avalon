export interface IApplicationState {
    gameState: IGameState;
    homeState: IHomeState;
}

export interface IGameState {
    game: IGame | undefined;
}

export interface IHomeState {
    userName: string | undefined;
    gameId: string | undefined;
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
