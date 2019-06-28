
import * as React from "react";

import * as PropTypes from "prop-types";
import { RouterChildContext } from "react-router";
import { GameService, StateService } from "../service";

export interface IServiceContext {
    stateService: StateService;
    gameService: GameService;
}

export interface IContextType {
    services: IServiceContext;
}

export const ContextType: PropTypes.ValidationMap<any> = {
    router: PropTypes.object,
    services: PropTypes.object.isRequired,
};

function getContext(context: any): IContextType {
    return context as IContextType;
}

export function getRouter(context: any) {
    return (context as RouterChildContext<any>).router;
}

export function getServices(context: any): IServiceContext {
    return getContext(context).services;
}

export class ContextProvider extends React.PureComponent<IServiceContext> {
    public static childContextTypes = ContextType;

    public getChildContext(): IContextType {
        return {
            services: this.props,
        };
    }

    public render() {
        return React.Children.only(this.props.children);
    }
}
