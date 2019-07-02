import { GameService, IGameService } from "../api/game";
import { DefaultHttpApiBridge } from "conjure-client";
import { IEndpoints, IApplicationApi } from "../state";
import { MockGameService } from "../mock/mockGameService";

const APPLICATION_VERSION = "0.0.0";

export function createApi(endpoints: IEndpoints): IApplicationApi {
    const userAgent = { productName: "autopilot", productVersion: APPLICATION_VERSION };
    const gameServiceApi = getApiOrThrow(endpoints, "gameServiceApi");
    const gameService: IGameService = gameServiceApi === "mock"
        ? new MockGameService()
        : new GameService(new DefaultHttpApiBridge({ baseUrl: gameServiceApi, userAgent }),
    );

    return { gameService };
}

function getApiOrThrow(endpoints: IEndpoints, apiKey: keyof IEndpoints) {
    const api = endpoints[apiKey];
    if (api == null) {
        throw new Error(`API not found for apiKey: ${apiKey}`);
    }
    return api;
}
