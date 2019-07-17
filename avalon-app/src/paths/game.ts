import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export interface IGamePathParams {
    gameId: string;
}

export class GamePath extends IPath {
    public static readonly TEMPLATE = `/game/:gameId`;

    public static fromRoute(routeProps: RouteComponentProps<IGamePathParams>) {
        const { gameId } = routeProps.match.params;
        return new GamePath(gameId);
    }

    constructor(private gameId: string) {
        super();
    }

    public getTemplate() {
        return GamePath.TEMPLATE;
    }

    public getPathName() {
        return `/game/${this.gameId}`;
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
        };
    }
}