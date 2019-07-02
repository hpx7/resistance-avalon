import React from "react";
import {
    FormGroup,
    InputGroup,
    Button,
    Intent,
    Card,
    Elevation,
    H2,
    Collapse
} from "@blueprintjs/core";
import styles from "./home.module.scss";
import { IHomeState } from "../../state";
import { IApplicationState, HomeAction } from "../../state/types";
import { connect } from "react-redux";
import { ContextType, getServices } from "../../common/contextProvider";
import { handleStringChange } from "../../common/handleStringChange";
import { GamePath } from "../../paths/game";
import classNames from "classnames";
import { History } from "history";
import { AsyncLoadedValue } from "../../common/redoodle";

interface IOwnProps {
    history: History;
}

type HomeProps = IOwnProps & IHomeState;

class UnconnectedHome extends React.PureComponent<HomeProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        AVALON_TITLE: "Avalon",
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
        const { STRINGS } = UnconnectedHome;
        this.services.stateService.clearGame();
        this.services.stateService.setDocumentTitle(STRINGS.AVALON_TITLE)
    }

    public render() {
        const isJoinGameAction = this.shouldShowActionMatch(HomeAction.JOIN_GAME);
        const isCreateGameAction = this.shouldShowActionMatch(HomeAction.CREATE_GAME);
        return (
            <Card elevation={Elevation.THREE} className={styles.home}>
                <Collapse
                    className={classNames({[styles.fadeCollapse]: isJoinGameAction})}
                    transitionDuration={400}
                    isOpen={isJoinGameAction}
                >
                    {this.renderJoinGame()}
                </Collapse>
                <Collapse
                    className={classNames({[styles.fadeCollapse]: isCreateGameAction})}
                    transitionDuration={400}
                    isOpen={isCreateGameAction}
                >
                    {this.renderCreateGame()}
                </Collapse>
            </Card>
        );
    }

    private renderJoinGame() {
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

    private renderCreateGame() {
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
        const { playerName } = this.props;
        const { STRINGS } = UnconnectedHome;
        const value = AsyncLoadedValue.getValueOrDefault(playerName, "");
        const helperText = AsyncLoadedValue.valueCheck(playerName, name => name.length === 0)
            ? STRINGS.GAME_ID_HELPER_TEXT
            : undefined;
        return (
            <FormGroup
                key="user-name-input"
                helperText={helperText}
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
        const { gameId } = this.props;
        const { STRINGS } = UnconnectedHome;
        const value = AsyncLoadedValue.getValueOrDefault(gameId, "");
        const helperText = AsyncLoadedValue.valueCheck(gameId, id => id.length === 0)
            ? STRINGS.GAME_ID_HELPER_TEXT
            : undefined;
        return (
            <FormGroup
                key="game-id-input"
                helperText={helperText}
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
        const { gameId, playerName } = this.props;
        return AsyncLoadedValue.isReady(gameId) && AsyncLoadedValue.isReady(playerName);
    }

    private canCreateGame() {
        const { gameId, playerName } = this.props;
        return AsyncLoadedValue.isReady(playerName) && AsyncLoadedValue.isNotStartedLoading(gameId);
    }

    private shouldShowActionMatch(homeAction: HomeAction) {
        return this.props.homeAction === homeAction;
    }

    private tryToJoinGame = () => {
        const { gameId, playerName, history } = this.props;
        if (AsyncLoadedValue.isReady(gameId) && AsyncLoadedValue.isReady(playerName)) {
            this.services.gameService.joinGame(gameId.value, playerName.value).then(maybePlayerId => {
                if (maybePlayerId != null && maybePlayerId.success) {
                    history.push(new GamePath(gameId.value, maybePlayerId.playerId, playerName.value).getPathName());
                }
            })
        }
    }

    private tryToCreateGame = () => {
        const { gameId, playerName, history } = this.props;
        if (AsyncLoadedValue.isNotStartedLoading(gameId) && AsyncLoadedValue.isReady(playerName)) {
            this.services.gameService.createGame(playerName.value).then(maybeCreateGame => {
                if (maybeCreateGame != null) {
                    const { gameId, playerId } = maybeCreateGame;
                    history.push(new GamePath(gameId, playerId, playerName.value).getPathName());
                }
            })
        }
    }

    private setAction = (action: HomeAction) => () => this.services.stateService.setHomeAction(action);

    private hasValue = (value: string | undefined): value is string => value != null && value.length > 0;

    private onUserNameChange = (userName: string) => this.services.stateService.setUserName(userName);

    private onGameIdChange = (gameId: string) => this.services.stateService.setGameId(gameId);
}

const mapStateToProps = (appState: IApplicationState): IHomeState => appState.homeState;

export const Home = connect(mapStateToProps)(UnconnectedHome);
