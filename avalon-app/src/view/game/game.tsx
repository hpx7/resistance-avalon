import React, { CSSProperties } from "react";
import { Card, Classes, Elevation, Navbar, NavbarGroup, NavbarHeading, Button, NavbarDivider, Tooltip, Icon, Intent } from "@blueprintjs/core";
import styles from "./game.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";
import classNames from "classnames";
import { IconNames } from "@blueprintjs/icons";
import { IApplicationState, IGameState } from "../../state";
import { connect } from "react-redux";
import { History } from "history";
import { GameAction, IGame, Role } from "../../state/types";
import { HomePath } from "../../paths/home";
import { isReady } from "../../common/redoodle";
import { times, constant, random } from "lodash-es";
import { assertNever } from "../../common/assertNever";
import { Player } from "./player";

interface IOwnProps {
    history: History;
    gameId: string;
    userId: string;
}

type GameProps = IOwnProps & IGameState;

const REFRESH_GAME_STATE_INTERVAL_IN_MS = 1000;

export class UnconnectedGame extends React.PureComponent<GameProps> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    private interval: number | undefined;

    public componentDidMount() {
        this.startFetchingGameState();
    }

    public componentWillUnmount() {
        this.maybeStopFetchingGameState();
        this.services.stateService.clearGame();
    }

    public render() {
        const { gameAction } = this.props;
        return (
            <div className={styles.game}>
                <div className={classNames(styles.body, Classes.DARK)}>
                    <Navbar className={styles.navbar}>
                        <NavbarGroup>
                            <NavbarHeading onClick={this.redirectToHome} className={styles.logo} />
                            <NavbarDivider />
                            <Button
                                active={gameAction === GameAction.VIEW_PLAYERS}
                                className={Classes.MINIMAL}
                                icon={IconNames.PEOPLE}
                                text="Players"
                                onClick={this.setAction(GameAction.VIEW_PLAYERS)}
                            />
                            <Button
                                active={gameAction === GameAction.VIEW_QUESTS}
                                className={Classes.MINIMAL}
                                icon={IconNames.PATH_SEARCH}
                                text="Quests"
                                onClick={this.setAction(GameAction.VIEW_QUESTS)}
                            />
                        </NavbarGroup>
                    </Navbar>
                    <div className={styles.content}>
                        <Card elevation={Elevation.THREE} className={styles.card}>
                            {this.renderContent()}
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    private renderContent() {
        const { game, gameAction } = this.props;
        if (!isReady(game)) {
            return this.renderGameSkeleton();
        } else if (gameAction === GameAction.VIEW_PLAYERS) {
            return this.renderPlayers(game.value);
        } else {
            return this.renderQuests(game.value);
        }
    }

    private renderGameSkeleton() {
        const classes = classNames(Classes.SKELETON, styles.skeletonRow);
        return times(4, constant(0)).map((_val, idx) => {
            const style: CSSProperties = { width: `${random(50, 100)}%` };
            return <div style={style} key={`skeleton-row-${idx}`} className={classes}>skeleton</div>
        });
    }

    private renderPlayers(game: IGame) {
        return game.players.map(player => {
            return <Player player={player} game={game} showKnowledge={true} />
        })
    }

    private renderQuests(game: IGame) {
        return "Let us go on a quest"
    }

    private redirectToHome = () => {
        this.props.history.push(new HomePath().getPathName());
    }

    private setAction = (action: GameAction) => () => this.services.stateService.setGameAction(action);

    private startFetchingGameState() {
        this.interval = window.setInterval(
            () => {
                const { gameId, userId } = this.props;
                this.services.gameService.getGameState(gameId, userId)
                    .then(succeeded => {
                        if (!succeeded) {
                            this.maybeStopFetchingGameState();
                        }
                    });
            },
            REFRESH_GAME_STATE_INTERVAL_IN_MS);
    }

    private maybeStopFetchingGameState() {
        if (this.interval != null) {
            window.clearInterval(this.interval);
        }
    }
}

const mapStateToProps = (appState: IApplicationState): IGameState => appState.gameState;

export const Game = connect(mapStateToProps)(UnconnectedGame);
