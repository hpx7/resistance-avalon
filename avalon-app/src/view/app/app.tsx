import React from "react";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { PathRedirect } from "../../common/navigationWithPath";
import { Home } from "../home/home";
import { GamePath, HomePath } from "../../paths";
import { Game } from "../game/game";
import { NotFound } from "../notFound/notFound";
import { IGamePathParams } from "../../paths/game";

class ConnectedApp extends React.PureComponent<RouteComponentProps<any>> {
    public render() {
        return (
            <div>
            <Switch>
                <Route exact={true} path="/" render={this.renderRootRedirect} />
                <Route path={HomePath.TEMPLATE} render={this.renderHome} />
                <Route path={GamePath.TEMPLATE} render={this.renderGame} />
                <Route render={this.renderDefault} />
            </Switch>
            </div>
        );
    }

    private renderRootRedirect = () => <PathRedirect to={new HomePath()} />;

    private renderHome = ({ history }: RouteComponentProps) => <Home history={history} />;

    private renderGame = (routeProps: RouteComponentProps<IGamePathParams>) => {
        const { history, match } = routeProps;
        const { gameId, userId } = match.params;
        return <Game gameId={gameId} userId={userId} history={history}/>;
    }

    private renderDefault = () => <NotFound />;
}

export const App = withRouter<RouteComponentProps<any>>(ConnectedApp);
