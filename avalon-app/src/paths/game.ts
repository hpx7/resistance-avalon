import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export interface IGamePathParams {
    gameId: string;
    userId: string;
}

export class GamePath extends IPath {
    public static readonly TEMPLATE = `/game/:gameId/:userId`;

    public static fromRoute(routeProps: RouteComponentProps<IGamePathParams>) {
        const { gameId, userId } = routeProps.match.params;
        return new GamePath(gameId, userId);
    }

    constructor(private gameId: string, private userId: string) {
        super();
    }

    public getTemplate() {
        return GamePath.TEMPLATE;
    }

    public getPathName() {
        return `/game/${this.gameId}/${this.userId}`;
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
            userId: this.userId,
        };
    }
}