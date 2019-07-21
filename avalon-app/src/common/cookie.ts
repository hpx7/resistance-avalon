import { IPlayerMetadata } from "../state";
import { NullableValue } from "./nullableValue";
import { set as setCookie, get as getCookie, CookieOptions } from "browser-cookies";
import * as queryString from "query-string";

const playerMetadataKeys: Record<keyof IPlayerMetadata, true> = {
    playerId: true,
    playerName: true,
}

const PLAYER_METADATA_KEYS: Array<keyof IPlayerMetadata> = Object.keys(playerMetadataKeys) as Array<keyof IPlayerMetadata>;

export class CookieService {
    private static COOKIE_OPTIONS: CookieOptions = {
        domain: window.location.hostname,
        expires: 7,
        httponly: true,
        samesite: "Strict",
        secure: true,
    }

    private static useCookies: boolean = true;

    private constructor() {}

    public static devMode() {
        CookieService.useCookies = false;
    }

    public static createSession(gameId: string, playerMetadata: IPlayerMetadata) {
        if (CookieService.useCookies) {
            setCookie(gameId, JSON.stringify(playerMetadata), CookieService.COOKIE_OPTIONS);
        } else {
            window.location.search = window.location.search + queryString.stringify(playerMetadata);
        }
    }

    public static getSession(gameId: string): NullableValue<IPlayerMetadata> {
        if (CookieService.useCookies) {
            return NullableValue.of(getCookie(gameId)).map(JSON.parse);
        } else {
            return NullableValue.of(window.location.search)
                .flatMap((querParams): NullableValue<IPlayerMetadata> => {
                    const parsedQuery = queryString.parse(querParams);
                    const playerMetadata: any = {};
                    for (const playerMetadataKey of PLAYER_METADATA_KEYS) {
                        if (parsedQuery[playerMetadataKey] == null) {
                            return NullableValue.of<IPlayerMetadata>(undefined);
                        } else {
                            playerMetadata[playerMetadataKey] = parsedQuery[playerMetadataKey];
                        }
                    }
                    return NullableValue.of(playerMetadata);
                });
        }
    }
}

