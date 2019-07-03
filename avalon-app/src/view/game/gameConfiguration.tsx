import React from "react";
import {
    Button,
    H2,
    Tabs,
    Tab,
    ControlGroup,
    HTMLSelect,
    Intent,
    Callout,
} from "@blueprintjs/core";
import styles from "./gameConfiguration.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";
import { IGame, Role } from "../../state/types";
import { Player } from "./player";
import { handleStringChange } from "../../common/handleStringChange";
import { IconNames } from "@blueprintjs/icons";
import { removeElementAtIndex } from "../../common/remove";
import { assertNever } from "../../common/assertNever";

interface IGameConfigurationProps {
    game: IGame;
    playerId: string;
}

enum ConfigurationTab {
    PLAYERS = "players",
    ROLES = "roles",
}

interface IState {
    selectedTabId: ConfigurationTab;
    roles: Role[];
    selectedRole: Role,
}

const roleRecord: Record<Role, true> = {
    [Role.LOYAL_SERVANT]: true,
    [Role.MERLIN]: true,
    [Role.MORGANA]: true,
    [Role.PERCIVAL]: true,
    [Role.MORDRED]: true,
    [Role.OBERON]: true,
    [Role.ASSASSIN]: true,
    [Role.MINION]: true,
}

const ROLES: Role[] = Object.keys(roleRecord) as Role[];

export class GameConfiguration extends React.PureComponent<IGameConfigurationProps, IState> {
    public static contextTypes = ContextType;
    public state = {
        selectedTabId: ConfigurationTab.PLAYERS,
        roles: [],
        selectedRole: ROLES[0],
    };
    private static STRINGS = {
        CONFIGURE_GAME: "Configure game",
        PLAYER_ORDER: "Player order",
        ROLES: "Roles",
        ADD_ROLE: "Add role",
        START_GAME: "Start game",
        NOT_ENOUGH_ROLES: "There are more players than roles specified.",
        TOO_MANY_ROLES: "There too many roles specified.",
        TAB_NAVIGATION: "TabNavigation",
    }
    private services = getServices(this.context);

    public componentDidMount() {
        const { STRINGS } = GameConfiguration;
        this.services.stateService.setDocumentTitle(STRINGS.CONFIGURE_GAME);
    }

    public render() {
        const { STRINGS } = GameConfiguration;
        return (
            <div>
                <H2 className={styles.configurationHeader}>{STRINGS.CONFIGURE_GAME}</H2>
                <Tabs
                    id={STRINGS.TAB_NAVIGATION}
                    onChange={this.handleTabChange}
                    selectedTabId={this.state.selectedTabId}
                >
                    <Tab id={ConfigurationTab.PLAYERS} title={STRINGS.PLAYER_ORDER} />
                    <Tab id={ConfigurationTab.ROLES} title={STRINGS.ROLES} />
                </Tabs>
                {this.renderContent()}
                {this.maybeRenderStartGameError()}
                <Button
                    intent={Intent.SUCCESS}
                    disabled={!this.canStartGame()}
                    onClick={this.startGame}
                    text={STRINGS.START_GAME}
                />
            </div>
        );
    }

    private renderContent() {
        const { selectedTabId } = this.state;
        switch (selectedTabId) {
            case ConfigurationTab.PLAYERS:
                return <div>{this.renderPlayers()}</div>;
            case ConfigurationTab.ROLES:
                return this.renderRoleSelect();
            default:
                return assertNever(selectedTabId)
        }
    }

    private renderRoleSelect() {
        const { STRINGS } = GameConfiguration;
        return (
            <div>
                {this.renderRoles()}
                <ControlGroup>
                    <HTMLSelect options={ROLES} value={this.state.selectedRole} onChange={this.handleSelectedRoleChange}/>
                    <Button intent={Intent.PRIMARY} text={STRINGS.ADD_ROLE} onClick={this.addRole} />
                </ControlGroup>
            </div>
        )
    }

    private renderPlayers() {
        const { game } = this.props;
        return game.players.map((player, idx) => {
            return <Player key={`player-${idx}`} player={player} game={game} />
        })
    }

    private renderRoles() {
        const { roles } = this.state;
        return roles.map((role, idx) => {
            return (
                <div key={`role-${idx}`} className={styles.role}>
                    <span>{role}</span>
                    <Button minimal={true} icon={IconNames.REMOVE} onClick={this.removeRole(idx)}/>
                </div>
            );
        })
    }

    private handleSelectedRoleChange = handleStringChange((role: string) => this.setState({ selectedRole: role as Role }));

    private handleTabChange = (newTabId: ConfigurationTab) => {
        this.setState({ selectedTabId: newTabId });
    }

    private addRole = () => {
        this.setState(prevState => ({ ...prevState, roles: [...prevState.roles, prevState.selectedRole] }));
    }

    private removeRole = (idx: number) => () => {
        this.setState(prevState => ({ ...prevState, roles: removeElementAtIndex(prevState.roles, idx) }));
    }

    private canStartGame() {
        const { players } = this.props.game;
        const { roles } = this.state;
        return players.length === roles.length;
    }

    private maybeRenderStartGameError() {
        if (this.canStartGame()) {
            return undefined;
        }
        const { players } = this.props.game;
        const { roles } = this.state;
        const { STRINGS } = GameConfiguration;
        const message = players.length > roles.length ? STRINGS.NOT_ENOUGH_ROLES : STRINGS.TOO_MANY_ROLES;
        return (<Callout intent={Intent.DANGER}>{message}</Callout>)
    }

    private startGame = () => {
        const {
            game: {
                id: gameId,
                myName,
                players,
            },
            playerId,
        } = this.props;
        if (this.canStartGame()) {
            this.services.gameService.startGame(gameId, playerId, myName, {
                roleList: this.state.roles,
                playerOrder: players,
            });
        }
    }
}
