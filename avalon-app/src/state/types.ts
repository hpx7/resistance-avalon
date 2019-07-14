import { IAsyncLoaded } from "../common/redoodle";
import { IGameService } from "../api";
import { Location } from "history";

export interface IApplicationState {
    gameState: IGameState;
    homeState: IHomeState;
    routeState: IRouterState;
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
    playerName: IAsyncLoaded<string, string>;
    gameId: IAsyncLoaded<string, string>;
}

export interface IRouterState {
    location: Location;
}

export enum QuestAttemptStatus {
    PENDING_PROPOSAL = "proposing_quest",
    PENDING_PROPOSAL_VOTES  = "voting_for_proposal",
    PROPOSAL_REJECTED = "proposal_rejected",
    PENDING_QUEST_RESULTS = "voting_in_quest",
    PASSED = "passed",
    FAILED = "failed"
}

export enum GameStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    GOOD_WON = "good_won",
    EVIL_WON = "evil_won",
}

export enum Vote {
    PASS = 1,
    FAIL = -1,
}

export interface IPlayerVote {
    player: string;
    vote: Vote;
}

export interface IQuestAttempt {
    id: string;
    roundNumber: number;
    attemptNumber: number;
    size: number;
    leader: string;
    members: string[];
    myVote?: Vote;
    myResult?: Vote;
    votes: IPlayerVote[];
    remainingVotes: number;
    results: Vote[];
    remainingResults: number;
    status: QuestAttemptStatus;
}

export interface IKnowledge {
    players: string[];
    roles: { [key: string]: boolean };
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
    roles: { [key: string]: boolean };
    status: GameStatus;
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
