import * as queryString from "query-string";

export function templatizeQueryParams(queryParams: Record<string, any> | undefined): string {
    if (queryParams == null) {
        return "";
    }
    const params = Object.keys(queryParams)
        .filter(key => queryParams[key] != null)
        .reduce((nonNullParams: Record<string, any>, key: string) => {
            nonNullParams[key] = `{${key}}`;
            return nonNullParams;
        }, {});
    return decodeURIComponent(queryString.stringify(params).trim());
}
