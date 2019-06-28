import { IGame, ICreatedGame } from "../state";
import { IHttpApiBridge } from "conjure-client";

export interface IGameService {
    createGame(userName: string): Promise<ICreatedGame>;
    startGame(gameId: string, userId: string): Promise<boolean>;
    getGameState(gameId: string, userId: string): Promise<IGame>;
    joinGame(gameId: string, userName: string): Promise<string>;
}

export declare class GameService {
    private bridge;
    constructor(bridge: IHttpApiBridge);
    createGame(userName: string): Promise<ICreatedGame>;
    startGame(gameId: string, userId: string): Promise<boolean>;
    getGameState(gameId: string, userId: string): Promise<IGame>;
    joinGame(gameId: string, userName: string): Promise<string>;
}