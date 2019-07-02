import React from "react";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { PathRedirect } from "../../common/navigationWithPath";
import { Home } from "../home/home";
import { GamePath, HomePath } from "../../paths";
import { Game } from "../game/game";
import { NotFound } from "../notFound/notFound";
import { IGamePathParams } from "../../paths/game";
import styles from "./app.module.scss";
import { Classes } from "@blueprintjs/core";

class ConnectedApp extends React.PureComponent<RouteComponentProps<any>> {
    public render() {
        return (
            <div className={Classes.DARK}>
                <div className={styles.body}>
                    <Switch>
                        <Route exact={true} path="/" render={this.renderRootRedirect} />
                        <Route path={HomePath.TEMPLATE} render={this.renderHome} />
                        <Route path={GamePath.TEMPLATE} render={this.renderGame} />
                        <Route render={this.renderDefault} />
                    </Switch>
                </div>
            </div>
        );
    }

    private renderRootRedirect = () => <PathRedirect to={new HomePath()} />;

    private renderHome = ({ history }: RouteComponentProps) => <Home history={history} />;

    private renderGame = (routeProps: RouteComponentProps<IGamePathParams>) => {
        const { history, match } = routeProps;
        const { gameId, playerId, playerName } = match.params;
        return <Game gameId={gameId} playerId={playerId} playerName={playerName} history={history}/>;
    }

    private renderDefault = () => <NotFound />;
}

export const App = withRouter<RouteComponentProps<any>>(ConnectedApp);
