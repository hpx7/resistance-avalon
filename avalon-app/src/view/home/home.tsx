import React from "react";
import { FormGroup, InputGroup, Button, Intent, Card, Classes, Elevation, H2, Collapse } from "@blueprintjs/core";
import styles from "./home.module.scss";
import { IHomeState } from "../../state";
import { IApplicationState, HomeAction } from "../../state/types";
import { connect } from "react-redux";
import { ContextType, getServices } from "../../common/contextProvider";
import { RouteComponentProps, withRouter } from "react-router";
import { handleStringChange } from "../../common/handleStringChange";
import { GamePath } from "../../paths/game";
import classNames from "classnames";

type HomeProps = RouteComponentProps<any> & IHomeState;

class UnconnectedHome extends React.PureComponent<HomeProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        JOIN_GAME_TITLE: "Join a game",
        CREATE_GAME_TITLE: "Create a game",
        USER_NAME_LABEL: "Name",
        USER_NAME_HELPER_TEXT: "Please enter your name",
        GAME_ID_HELPER_TEXT: "Please enter id of the game you would like to join",
        GAME_ID_LABEL: "Game id",
        JOIN_GAME: "Join game",
        CREATE_GAME: "Create game",
        NAME_PLACEHOLDER: "merlin",
        GAME_PLACEHOLDER: "avalon",
        DONT_HAVE_A_GAME: "Don't have a game to join?",
        ALREADY_HAVE_A_GAME: "Already have a game set up?",
        CREATE_A_GAME: "Create one!",
        JOIN_A_GAME: "Join it!",
        REQUIRED_TEXT: "(required)"
    }
    private services = getServices(this.context);

    public componentDidMount() {
        this.services.stateService.clearGame();
    }

    public render() {
        const isJoinGameAction = this.shouldShowActionMatch(HomeAction.JOIN_GAME);
        const isCreateGameAction = this.shouldShowActionMatch(HomeAction.CREATE_GAME);
        return (
            <div className={styles.home}>
                <div className={styles.body}>
                    <Card elevation={Elevation.THREE} className={Classes.DARK}>
                        <Collapse
                            className={classNames({[styles.fadeCollapse]: isJoinGameAction})}
                            transitionDuration={400}
                            isOpen={isJoinGameAction}
                        >
                            {this.maybeRenderJoinGame()}
                        </Collapse>
                        <Collapse
                            className={classNames({[styles.fadeCollapse]: isCreateGameAction})}
                            transitionDuration={400}
                            isOpen={isCreateGameAction}
                        >
                            {this.maybeRenderCreateGame()}
                        </Collapse>
                    </Card>
                </div>
            </div>
        );
    }

    private maybeRenderJoinGame() {
        const { STRINGS } = UnconnectedHome;
        return [
            <H2 key="create-game-title">{STRINGS.JOIN_GAME_TITLE}</H2>,
            this.renderUserNameInput(),
            this.renderGameIdInput(),
            <Button
                key="join-game-button"
                className={styles.actionButton}
                disabled={!this.canJoinGame()}
                intent={Intent.SUCCESS}
                text={STRINGS.JOIN_GAME}
                onClick={this.tryToJoinGame}
            />,
            <div key="toggle-create-game" className={styles.create}>
                {STRINGS.DONT_HAVE_A_GAME}
                <Button
                    onClick={this.setAction(HomeAction.CREATE_GAME)}
                    text={STRINGS.CREATE_A_GAME}
                    minimal={true}
                    intent={Intent.PRIMARY}
                />
            </div>,
        ]
    }

    private maybeRenderCreateGame() {
        const { STRINGS } = UnconnectedHome;
        return [
            <H2 key="create-game-title">{STRINGS.CREATE_GAME_TITLE}</H2>,
            this.renderUserNameInput(),
            <Button
                key="create-game-button"
                className={styles.actionButton}
                disabled={!this.canCreateGame()}
                intent={Intent.SUCCESS}
                text={STRINGS.CREATE_GAME}
                onClick={this.tryToCreateGame}
            />,
            <div key="toggle-join-game" className={styles.create}>
                {STRINGS.ALREADY_HAVE_A_GAME}
                <Button
                    onClick={this.setAction(HomeAction.JOIN_GAME)}
                    text={STRINGS.JOIN_A_GAME}
                    minimal={true}
                    intent={Intent.PRIMARY}
                />
            </div>,
        ]
    }

    private renderUserNameInput() {
        const { hasPreviouslyBeenSet, value } = this.props.userName;
        const { STRINGS } = UnconnectedHome;
        return (
            <FormGroup
                key="user-name-input"
                helperText={hasPreviouslyBeenSet && !this.hasValue(value) ? STRINGS.USER_NAME_HELPER_TEXT : undefined}
                label={STRINGS.USER_NAME_LABEL}
                labelFor="name-input"
                labelInfo={STRINGS.REQUIRED_TEXT}
                className={styles.form}
                intent={this.getIntentForValue(value)}
            >
                <InputGroup
                    id="name-input"
                    onChange={handleStringChange(this.onUserNameChange)}
                    placeholder={STRINGS.NAME_PLACEHOLDER}
                    value={value}
                />
            </FormGroup>
        );
    }

    private renderGameIdInput() {
        const { hasPreviouslyBeenSet, value } = this.props.gameId;
        const { STRINGS } = UnconnectedHome;
        return (
            <FormGroup
                key="game-id-input"
                helperText={hasPreviouslyBeenSet && !this.hasValue(value) ? STRINGS.GAME_ID_HELPER_TEXT : undefined}
                label={STRINGS.GAME_ID_LABEL}
                labelFor="game-id-input"
                labelInfo={STRINGS.REQUIRED_TEXT}
                className={styles.form}
                intent={this.getIntentForValue(value)}
            >
                <InputGroup
                    id="game-id-input"
                    onChange={handleStringChange(this.onGameIdChange)}
                    placeholder={STRINGS.GAME_PLACEHOLDER}
                    value={value}
                />
            </FormGroup>
        );
    }

    private getIntentForValue(value: string | undefined) {
        if (value == null) {
            return Intent.NONE;
        } else if (value.length > 0) {
            return Intent.PRIMARY;
        } else {
            return Intent.DANGER;
        }
    }

    private canJoinGame() {
        const { gameId, userName } = this.props;
        return this.hasValue(gameId.value) && this.hasValue(userName.value);
    }

    private canCreateGame() {
        const { gameId, userName } = this.props;
        return this.hasValue(userName.value) && !this.hasValue(gameId.value);
    }

    private shouldShowActionMatch(homeAction: HomeAction) {
        return this.props.homeAction === homeAction;
    }

    private tryToJoinGame = () => {
        const {
            gameId: {
                value: gameId
            },
            userName: {
                value: userName
            },
            history
        } = this.props;
        if (this.hasValue(gameId) && this.hasValue(userName)) {
            this.services.gameService.joinGame(gameId, userName).then(userId => {
                history.push(new GamePath(gameId, userId).getPathName());
            })
        }
    }

    private tryToCreateGame = () => {
        const {
            gameId: {
                value: gameId
            },
            userName: {
                value: userName
            },
            history
        } = this.props;
        if (!this.hasValue(gameId) && this.hasValue(userName)) {
            this.services.gameService.createGame(userName).then(({ gameId, userId }) => {
                history.push(new GamePath(gameId, userId).getPathName());
            })
        }
    }

    private setAction = (action: HomeAction) => () => this.services.stateService.setHomeAction(action);

    private hasValue = (value: string | undefined): value is string => value != null && value.length > 0;

    private onUserNameChange = (userName: string) => this.services.stateService.setUserName(userName);

    private onGameIdChange = (gameId: string) => this.services.stateService.setGameId(gameId);
}

const mapStateToProps = (appState: IApplicationState): IHomeState => appState.homeState;

export const Home = connect(mapStateToProps)(withRouter(UnconnectedHome));
