import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class HomePath extends IPath {
    public static readonly TEMPLATE = `/home`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new HomePath();
    }

    public getTemplate() {
        return HomePath.TEMPLATE;
    }

    public getPathName() {
        return HomePath.TEMPLATE;
    }

    public getTitle() {
        return `Avalon`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}