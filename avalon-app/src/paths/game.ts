import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export interface IGamePathParams {
    gameId: string;
    playerId: string;
    playerName: string;
}

export class GamePath extends IPath {
    public static readonly TEMPLATE = `/game/:gameId/:playerId/:playerName`;

    public static fromRoute(routeProps: RouteComponentProps<IGamePathParams>) {
        const { gameId, playerId, playerName } = routeProps.match.params;
        return new GamePath(gameId, playerId, playerName);
    }

    constructor(private gameId: string, private playerId: string, private playerName: string) {
        super();
    }

    public getTemplate() {
        return GamePath.TEMPLATE;
    }

    public getPathName() {
        return `/game/${this.gameId}/${this.playerId}/${this.playerName}`;
    }

    public getTitle() {
        return "Playing Avalon";
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {
            gameId: this.gameId,
            playerId: this.playerId,
            playerName: this.playerName,
        };
    }
}