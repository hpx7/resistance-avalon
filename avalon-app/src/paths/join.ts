import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";
import * as queryString from "query-string";

export interface IJoinPathQueryParams {
    gameId?: string;
}

export class JoinPath extends IPath<{}, IJoinPathQueryParams> {
    public static readonly TEMPLATE = `/join`;

    public static fromRoute(routeProps: RouteComponentProps) {
        return new JoinPath(JoinPath.parseQueryParams(routeProps));
    }

    private static parseQueryParams(routeProps: RouteComponentProps<{}>): IJoinPathQueryParams {
        const queryParams = queryString.parse(routeProps.location.search);
        return { gameId: queryParams.gameId as string };
    }

    constructor(private queryParams: IJoinPathQueryParams = {}) {
        super();
    }

    public getTemplate() {
        return JoinPath.TEMPLATE;
    }

    public getPathName() {
        return JoinPath.TEMPLATE;
    }

    public getTitle() {
        return `Join a game`;
    }

    public getQueryParams() {
        return this.queryParams;
    }

    public getPathParams() {
        return {};
    }
}