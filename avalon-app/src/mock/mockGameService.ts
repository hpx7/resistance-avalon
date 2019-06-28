import { IGameService } from "../api/game";
import { ICreatedGame, IGame } from "../state";

const TIMEOUT_IN_MS = 2000;

export class MockGameService implements IGameService {
    constructor() {
        console.warn("Currently using a mock game service.");
    }

    public createGame(_userName: string): Promise<ICreatedGame> {
        return delay<ICreatedGame>({ gameId: generateId(), userId: generateId() });
    }

    public startGame(_gameId: string, _userId: string): Promise<boolean> {
        return delay<boolean>(true);
    }

    public getGameState(gameId: string, _userId: string): Promise<IGame> {
        return delay<IGame>({
            id: gameId,
            myName: "joe",
            myRole: "Loyal servant of Arthur",
            knowledge: [],
            players: [],
            questConfigurations: [],
            questAttempts: [],
            roleList: [],
        });
    }

    public joinGame(gameId: string, userName: string): Promise<string> {
        return delay<string>(generateId());
    }
}

function delay<T>(response: T) {
    return new Promise<T>((resolve) => {
        window.setTimeout(() => {
            resolve(response);
        }, TIMEOUT_IN_MS);
    });
}

const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

function makeid(length: number) {
    return Array.apply<any, any, any>(null, { length }).map(Number.call, Number)
        .map(() => CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)))
        .join("");
}

const generateId = () => makeid(6);