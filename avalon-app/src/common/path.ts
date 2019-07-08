import { Pathname, Search, LocationDescriptorObject } from "history";
import { isEmpty } from "lodash-es";
import * as queryString from "query-string";
import { templatizeQueryParams } from "../common/templatizeQueryParams";

export interface IPathInfo {
    path: string;
    queryParams: string;
    templatedPath: string;
    templatedQueryParams: string;
}

export abstract class IPath<P = {}, Q = {}> {
    public abstract getTemplate(): string;

    public abstract getPathName(): Pathname;

    public abstract getTitle(): string;

    public abstract getQueryParams(): Q;

    public abstract getPathParams(): P;

    public getSearch(): Search | undefined {
        const queryParams = this.getQueryParams();
        return isEmpty(queryParams) ? undefined : queryString.stringify(queryParams as any);
    }

    public getPathInfo(): IPathInfo {
        const templatedQueryParams = templatizeQueryParams(this.getQueryParams());
        const maybeSearch = this.getSearch();
        const queryParams = maybeSearch != null ? maybeSearch : "";
        return {
            path: this.getPathName(),
            queryParams,
            templatedPath: this.getTemplate(),
            templatedQueryParams,
        };
    }

    public getLocationDescriptor(): LocationDescriptorObject<IPathInfo> {
        return {
            pathname: this.getPathName(),
            search: this.getSearch(),
            state: this.getPathInfo(),
        };
    }
}
