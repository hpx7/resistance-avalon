import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class CreatePath extends IPath {
    public static readonly TEMPLATE = `/create`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new CreatePath();
    }

    public getTemplate() {
        return CreatePath.TEMPLATE;
    }

    public getPathName() {
        return CreatePath.TEMPLATE;
    }

    public getTitle() {
        return `Create a game`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}