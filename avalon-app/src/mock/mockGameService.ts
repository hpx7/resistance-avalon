import { IGameService } from "../api/game";
import { ICreatedGame, IGame } from "../state";

const TIMEOUT_IN_MS = 2000;

export class MockGameService implements IGameService {
    private userMap: Map<string, string>;
    private userReverseMap: Map<string, string>;
    private gameOwnerMap: Map<string, string>;

    public constructor() {
        console.warn("Currently using a mock game service.");

        this.userMap = new Map<string, string>();
        this.userReverseMap = new Map<string, string>();
        this.gameOwnerMap = new Map<string, string>();

        const jackId = generateId();
        const kateId = generateId();

        this.userMap.set("Jack", jackId);
        this.userReverseMap.set(jackId, "Jack");

        this.userMap.set("Kate", kateId);
        this.userReverseMap.set(kateId, "Kate");
    }

    public createGame(userName: string): Promise<ICreatedGame> {
        const gameId = generateId();
        const userId = this.addUser(userName);
        this.gameOwnerMap.set(gameId, userId)
        return delay<ICreatedGame>({ gameId, userId });
    }

    public startGame(gameId: string, userId: string): Promise<boolean> {
        if (this.userMap.size < 4) {
            return delay<any>("Too few players", true);
        } else if (this.gameOwnerMap.get(gameId) !== userId) {
            return delay<any>("You do not have permission to start the game", true);
        }
        return delay<boolean>(true);
    }

    public getGameState(gameId: string, userId: string): Promise<IGame> {
        const game = {
            id: gameId,
            creator: "Admin",
            myName: "Adhish",
            myRole: "Loyal servant of Arthur",
            knowledge: [],
            players: Array.from(this.userMap.keys()),
            questConfigurations: [],
            questAttempts: [],
            roleList: [],
        };
        if (!this.userReverseMap.has(userId)) {
            return delay<any>("Game not found", true);
        }
        return delay<IGame>(game);
    }

    public joinGame(gameId: string, userName: string): Promise<string> {
        if (!this.gameOwnerMap.has(gameId)) {
            return delay<any>("Invalid game id", true);
        } else if (this.userMap.has(userName)) {
            return delay<any>("user already registered", true);
        } else if (this.userMap.size > 6) {
            return delay<any>("too many players", true);
        } else {
            this.addUser(userName);
        }
        return delay<string>(generateId());
    }

    private addUser(userName: string) {
        let userId: string;
        do {
            userId = generateId();
        } while (this.userReverseMap.has(userId));
        this.userMap.set(userName, userId);
        this.userReverseMap.set(userId, userName);
        return userId;
    }
}

function delay<T>(response: T, isError: boolean = false) {
    return new Promise<T>((resolve, reject) => window.setTimeout(
        () => {
            if (isError) {
                reject(response);
            }
            resolve(response);
        },
        TIMEOUT_IN_MS));
}

const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateId(length: number = 6) {
    return Array.apply<any, any, any>(null, { length }).map(Number.call, Number)
        .map(() => CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length)))
        .join("");
}
