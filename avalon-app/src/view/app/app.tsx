import React from "react";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { PathRedirect } from "../../common/navigationWithPath";
import { Home } from "../home/home";
import { GamePath } from "../../paths";
import { Game } from "../game/game";
import { NotFound } from "../notFound/notFound";
import { IGamePathPathParams, CreatePath, JoinPath} from "../../paths";
import styles from "./app.module.scss";
import { Classes } from "@blueprintjs/core";
import { HomeAction } from "../../state";
import { CookieService } from "../../common/cookie";

class ConnectedApp extends React.PureComponent<RouteComponentProps<any>> {
    public render() {
        return (
            <div className={Classes.DARK}>
                <div className={styles.body}>
                    <Switch>
                        <Route exact={true} path="/" render={this.renderRootRedirect} />
                        <Route path={CreatePath.TEMPLATE} render={this.renderCreate} />
                        <Route path={JoinPath.TEMPLATE} render={this.renderJoin} />
                        <Route path={GamePath.TEMPLATE} render={this.renderGame} />
                        <Route render={this.renderDefault} />
                    </Switch>
                </div>
            </div>
        );
    }

    private renderRootRedirect = () => <PathRedirect to={new JoinPath()} />;

    private renderCreate = (routeProps: RouteComponentProps) => {
        return this.renderHome(routeProps, HomeAction.CREATE_GAME);
    };

    private renderJoin = (routeProps: RouteComponentProps) => {
        const { gameId } = JoinPath.fromRoute(routeProps).getQueryParams();
        return this.renderHome(routeProps, HomeAction.JOIN_GAME, gameId);
    };

    private renderHome = (routeProps: RouteComponentProps, homeAction: HomeAction, gameId?: string) => {
        return (
            <Home
                history={routeProps.history}
                gameIdQueryParam={gameId}
                homeAction={homeAction}
            />
        );
    };

    private renderGame = (routeProps: RouteComponentProps<IGamePathPathParams>) => {
        const { history, match } = routeProps;
        const { gameId } = match.params;
        return CookieService.getSession(gameId)
            .map(playerMetadata => {
                const { playerId, playerName } = playerMetadata;
                return <Game gameId={gameId} playerId={playerId} playerName={playerName} history={history}/>;
            }).getOrDefault(this.renderDefault())

    }

    private renderDefault = () => <NotFound />;
}

export const App = withRouter<RouteComponentProps<any>>(ConnectedApp);
