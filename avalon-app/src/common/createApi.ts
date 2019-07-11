import { GameService, IGameService } from "../api/game";
import { IEndpoints, IApplicationApi } from "../state";
import io from 'socket.io-client';
import { createUserAgent } from "./userAgent";

const APPLICATION_NAME = "avalon-app";
const APPLICATION_VERSION = "0.0.0";

export function createApi(endpoints: IEndpoints): IApplicationApi {
    const agent = createUserAgent(APPLICATION_NAME, APPLICATION_VERSION);
    const gameServiceApi = getApiOrThrow(endpoints, "gameServiceApi");
    const gameService: IGameService = new GameService(io(gameServiceApi, { agent }));
    return { gameService };
}

function getApiOrThrow(endpoints: IEndpoints, apiKey: keyof IEndpoints) {
    const api = endpoints[apiKey];
    if (api == null) {
        throw new Error(`API not found for apiKey: ${apiKey}`);
    }
    return api;
}
