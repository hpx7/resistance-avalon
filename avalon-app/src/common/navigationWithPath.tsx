import React from "react";
import { Redirect, NavLink, Link } from "react-router-dom";
import { IPath } from "../common/path";
import { LocationDescriptor } from "history";

export type INavigationWithPath<C extends {to: LocationDescriptor}, P, Q> = Omit<C, "to"> & { to: IPath<P, Q> };

function navigationWithPath<C extends {to: LocationDescriptor<any>}>(Component: React.ComponentType<C>) {
    return class NavigationWithPath<P,Q> extends React.PureComponent<INavigationWithPath<C, P, Q>> {
        public render() {
            const { to, ...otherProps } = this.props;
            return <Component {...otherProps as any} to={to.getLocationDescriptor()} />;
        }
    };
}

export const PathRedirect = navigationWithPath(Redirect);
export const PathNavLink = navigationWithPath(NavLink);
export const PathLink = navigationWithPath(Link);
