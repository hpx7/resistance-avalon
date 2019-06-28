import React from "react";
import { FormGroup, InputGroup, Button, Intent, Card, Classes, Elevation, H2 } from "@blueprintjs/core";
import styles from "./home.module.scss";
import { IHomeState } from "../../state";
import { IApplicationState } from "../../state/types";
import { connect } from "react-redux";
import { ContextType, getServices } from "../../common/contextProvider";
import { RouteComponentProps, withRouter } from "react-router";
import { handleStringChange } from "../../common/handleStringChange";
import { GamePath } from "../../paths/game";

type HomeProps = RouteComponentProps<any> & IHomeState;

class UnconnectedHome extends React.PureComponent<HomeProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        USER_NAME_LABEL: "Name",
        USER_NAME_HELPER_TEXT: "Please enter your name",
        GAME_ID_HELPER_TEXT: "Please enter id of the game you would like to join",
        GAME_ID_LABEL: "Game id",
        JOIN_GAME: "Join game",
        NAME_PLACEHOLDER: "merlin",
        GAME_PLACEHOLDER: "avalon",
        DONT_HAVE_A_GAME: "Don't have a game to join?",
        CREATE_A_GAME: "Create a game!",
        REQUIRED_TEXT: "(required)"
    }
    private services = getServices(this.context);

    public render() {
        const { STRINGS } = UnconnectedHome;
        return (
            <div className={styles.home}>
                <div className={styles.body}>
                    <Card elevation={Elevation.THREE} className={Classes.DARK}>
                        <H2>Join a game of Avalon</H2>
                        {this.renderUserNameInput()}
                        {this.renderGameIdInput()}
                        <Button
                            className={styles.join}
                            disabled={!this.canJoinGame()}
                            intent={Intent.SUCCESS}
                            text={STRINGS.JOIN_GAME}
                            onClick={this.tryToJoinGame}
                        />
                        <div className={styles.create}>
                            {STRINGS.DONT_HAVE_A_GAME}
                            <Button text={STRINGS.CREATE_A_GAME} minimal={true} intent={Intent.PRIMARY}/>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    private renderUserNameInput() {
        const { userName } = this.props;
        const { STRINGS } = UnconnectedHome;
        return (
            <FormGroup
                helperText={userName === "" ? STRINGS.USER_NAME_HELPER_TEXT : undefined}
                label={STRINGS.USER_NAME_LABEL}
                labelFor="name-input"
                labelInfo={STRINGS.REQUIRED_TEXT}
                className={styles.form}
                intent={this.getIntentForValue(userName)}
            >
                <InputGroup
                    id="name-input"
                    onChange={handleStringChange(this.onUserNameChange)}
                    placeholder={STRINGS.NAME_PLACEHOLDER}
                    value={userName}
                />
            </FormGroup>
        );
    }

    private renderGameIdInput() {
        const { gameId } = this.props;
        const { STRINGS } = UnconnectedHome;
        return (
            <FormGroup
                helperText={gameId === "" ? STRINGS.GAME_ID_HELPER_TEXT : undefined}
                label={STRINGS.GAME_ID_LABEL}
                labelFor="game-id-input"
                labelInfo={STRINGS.REQUIRED_TEXT}
                className={styles.form}
                intent={this.getIntentForValue(gameId)}
            >
                <InputGroup
                    id="game-id-input"
                    onChange={handleStringChange(this.onGameIdChange)}
                    placeholder={STRINGS.GAME_PLACEHOLDER}
                    value={gameId}
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
        return this.hasValue(gameId) && this.hasValue(userName);
    }

    private tryToJoinGame = () => {
        const { gameId, history } = this.props;
        if (this.hasValue(gameId)) {
            history.push(new GamePath(gameId).getPathName())
        }
    }

    private hasValue = (value: string | undefined): value is string => value != null && value.length > 0;

    private onUserNameChange = (userName: string) => this.services.stateService.setUserName(userName);

    private onGameIdChange = (gameId: string) => this.services.stateService.setGameId(gameId);
}

const mapStateToProps = (appState: IApplicationState): IHomeState => appState.homeState;

export const Home = connect(mapStateToProps)(withRouter(UnconnectedHome));
