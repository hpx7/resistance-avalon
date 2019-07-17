import { IPlayerMetadata } from "../state";
import { NullableValue } from "./nullableValue";
import { set as setCookie, get as getCookie, CookieOptions } from "browser-cookies";

export class CookieService {
    private static COOKIE_OPTIONS: CookieOptions = {
        domain: window.location.hostname,
        expires: 7,
        samesite: "Strict"
    }

    private constructor() {}

    public static createSession(gameId: string, playerMetadata: IPlayerMetadata) {
        setCookie(gameId, JSON.stringify(playerMetadata), CookieService.COOKIE_OPTIONS);
    }

    public static getSession(gameId: string): NullableValue<IPlayerMetadata> {
        return NullableValue.of(getCookie(gameId)).map(JSON.parse);
    }
}

