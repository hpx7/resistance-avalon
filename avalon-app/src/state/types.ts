import { IAsyncLoaded } from "../common/redoodle";
import { IGameService } from "../api";

export interface IApplicationState {
    gameState: IGameState;
    homeState: IHomeState;
}

export enum Role {
    MERLIN = "merlin",
    MORGANA = "morgana",
    PERCIVAL = "percival",
    MORDRED = "mordred",
    OBERON = "oberon",
    ASSASSIN = "assassin",
    LOYAL_SERVANT = "loyal servant",
    MINION = "minion",
}

export enum GameAction {
    VIEW_ROLES = "view_roles",
    VIEW_PLAYERS = "view_players",
    VIEW_QUESTS = "view_quests",
}

export interface IGameState {
    game: IAsyncLoaded<IGame, string>;
    gameAction: GameAction;
}

export enum HomeAction {
    JOIN_GAME = "join",
    CREATE_GAME = "create",
}

export interface IHomeState {
    homeAction: HomeAction;
    playerName: IAsyncLoaded<string, string>;
    gameId: IAsyncLoaded<string, string>;
}

export enum QuestAttemptStatus {
    PENDING_PROPOSAL = "pending_proposal",
    PENDING_PROPOSAL_VOTES  = "pending_proposal_votes",
    PROPOSAL_REJECTED = "proposal_rejected",
    PENDING_QUEST_RESULTS = "pending_quest_results",
    PASSED = "passed",
    FAILED = "failed"
}

export interface IQuestAttempt {
    status: QuestAttemptStatus;
    attemptNumber: number;
    leader: string;
    members: string[];
    questNumber: number;
    results: boolean[];
    votes: Map<string, boolean>;
}

export interface IKnowledge {
    players: string[];
    roles: Map<string, boolean>;
}

export interface IGame {
    id: string;
    creator: string;
    myName: string;
    myRole?: Role | null;
    knowledge: IKnowledge;
    players: string[];
    questConfigurations?: number[] | null;
    questAttempts: IQuestAttempt[];
    roles: Map<string, boolean>;
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
