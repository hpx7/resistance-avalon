import React from "react";
import {
    Button,
    H2,
    Tabs,
    Tab,
    ControlGroup,
    HTMLSelect,
    Intent,
    NonIdealState,
    Icon,
    InputGroup,
    Divider,
} from "@blueprintjs/core";
import styles from "./gameConfiguration.module.scss";
import { ContextType, getServices } from "../../../common/contextProvider";
import { IGame, Role } from "../../../state/types";
import { PlayerList } from "../playerList";
import { handleStringChange } from "../../../common/handleStringChange";
import { History } from "history";
import { IconNames } from "@blueprintjs/icons";
import { removeElementAtIndex } from "../../../common/remove";
import { assertNever } from "../../../common/assertNever";
import { isEqual } from "lodash-es";
import { CountableValue } from "../../../common/countableValue";
import { getRoleCounts, getNumGoodRoles } from "../../../common/role";
import { NullableValue } from "../../../common/nullableValue";
import { calcNumGoodPlayers } from "../../../common/goodBad";
import { Clipboard } from "ts-clipboard";
import { JoinPath } from "../../../paths";
import { QRCode } from "../qrcode/qrcode";

interface IGameConfigurationProps {
    history: History;
    game: IGame;
    playerId: string;
    gameId: string;
}

enum ConfigurationTab {
    PLAYERS = "players",
    ROLES = "roles",
    INVITE = "invite",
}

interface IState {
    selectedTabId: ConfigurationTab;
    roles: Role[];
    selectedRole: Role,
    players: string[];
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

const MIN_PLAYER_COUNT = 5;
const MAX_PLAYER_COUNT = 10;
const ROLE_LIMIT = 1;
const DARK_GRAY_3 = "#293742";
const WHITE = "#FFFFFF";

export class GameConfiguration extends React.PureComponent<IGameConfigurationProps, IState> {
    public static contextTypes = ContextType;
    public state: IState = {
        selectedTabId: ConfigurationTab.INVITE,
        roles: [],
        selectedRole: ROLES[0],
        players: [],
    };
    private static STRINGS = {
        CONFIGURE_GAME: "Configure game",
        PLAYER_ORDER: "Player order",
        INVITE: "Invite",
        ROLES: "Roles",
        ADD_ROLE: "Add role",
        START_GAME: "Start game",
        NOT_ENOUGH_ROLES: "Not enough roles specified",
        TOO_MANY_ROLES: "Too many roles specified",
        NOT_ENOUGH_PLAYERS: "Not enough players",
        TOO_MANY_PLAYERS: "Too many players",
        THERE_CAN_BE_AT_MOST: "There can be at most",
        TAB_NAVIGATION: "TabNavigation",
        DND_HELPER_TEXT: "Drag and drop to configure player order",
        NO_ROLES_SPECIFIED: "No roles specified",
        GOOD_ROLE: "good role",
        THERE_MUST_BE_EXACTLY: "There must be exactly",
        INVITE_OTHERS: "Invite others to join this game",
        COPY_LINK: "Copy link",
    }
    private services = getServices(this.context);

    public componentDidUpdate(prevProps: IGameConfigurationProps) {
        if (!isEqual(this.props, prevProps)) {
            this.updatePlayerState();
        }
    }

    public componentDidMount() {
        const { STRINGS } = GameConfiguration;
        this.services.stateService.setDocumentTitle(STRINGS.CONFIGURE_GAME);
        this.updatePlayerState();
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
                    <Tab id={ConfigurationTab.INVITE} title={STRINGS.INVITE} />
                    <Tab id={ConfigurationTab.PLAYERS} title={STRINGS.PLAYER_ORDER} />
                    <Tab id={ConfigurationTab.ROLES} title={STRINGS.ROLES} />
                </Tabs>
                <div className={styles.configurationContent}>{this.renderContent()}</div>
                <Divider />
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
        const { players, selectedTabId, selectedRole } = this.state;
        const { game, gameId } = this.props;
        const { STRINGS } = GameConfiguration;
        switch (selectedTabId) {
            case ConfigurationTab.PLAYERS:
                return (
                    <>
                        <PlayerList
                            players={players}
                            game={game}
                            showKnowledge={false}
                            showMyself={true}
                            canDragNDrog={true}
                            onReorderPlayers={this.onReorderPlayers}
                        />
                        <div className={styles.dndHelper}>{STRINGS.DND_HELPER_TEXT}</div>
                    </>
                );
            case ConfigurationTab.ROLES:
                return  (
                    <>
                        {this.renderRoles()}
                        <ControlGroup fill={true} className={styles.addRole}>
                            <HTMLSelect
                                options={ROLES}
                                value={selectedRole}
                                onChange={this.handleSelectedRoleChange}
                            />
                            <Button intent={Intent.PRIMARY} text={STRINGS.ADD_ROLE} onClick={this.addRole} />
                        </ControlGroup>
                    </>
                );
            case ConfigurationTab.INVITE:
                return (
                    <>
                        <div>{STRINGS.INVITE_OTHERS}</div>
                        <QRCode url={this.getCopyLink()} backgroundColor={DARK_GRAY_3} foregroundColor={WHITE} />
                        <ControlGroup className={styles.copyLink} fill={true}>
                            <InputGroup disabled={true} value={gameId} />
                            <Button icon={IconNames.CLIPBOARD} text={STRINGS.COPY_LINK} onClick={this.onCopyGameLink}/>
                        </ControlGroup>
                    </>
                )
            default:
                return assertNever(selectedTabId)
        }
    }

    private renderRoles() {
        const { STRINGS } = GameConfiguration;
        return CountableValue.of(this.state.roles)
            .map((role, idx) => (
                <div key={`role-${idx}`} className={styles.role}>
                    <span>{role}</span>
                    <Button minimal={true} icon={IconNames.REMOVE} onClick={this.removeRole(idx)}/>
                </div>
            )).getValueOrDefault(
                <NonIdealState
                    title={STRINGS.NO_ROLES_SPECIFIED}
                    icon={IconNames.WARNING_SIGN}
                />
            );
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

    private onReorderPlayers = (players: string[]) => this.setState({ players });

    private onCopyGameLink = () => {
        Clipboard.copy(this.getCopyLink());
    }

    private getCopyLink = () => {
        const { gameId, history } = this.props;
        return window.location.origin + history.createHref(new JoinPath({ gameId }).getLocationDescriptor())
    }

    private canStartGame() {
        return this.maybeGetErrorMessage() == null;
    }

    private getRoleCount(roleCounts: Map<Role, number>, role: Role) {
        return roleCounts.get(role) || 0;
    }

    private updatePlayerState() {
        this.setState(prevState => {
            const prevPlayers = new Set<string>(prevState.players);
            const newPlayers = this.props.game.players.filter(player => !prevPlayers.has(player));
            return { ...prevState, players: [ ...prevState.players, ...newPlayers ] }
        })
    }


    private maybeRenderStartGameError() {
        return NullableValue.of(this.maybeGetErrorMessage())
            .map(errorMessage => (
                <div className={styles.configurationError}>
                    <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.ERROR} />
                    <div>{errorMessage}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private maybeGetErrorMessage() {
        const { players } = this.state;
        const { roles } = this.state;
        const { STRINGS } = GameConfiguration;
        const roleCounts = getRoleCounts(roles);
        if (players.length < roles.length) {
            return STRINGS.TOO_MANY_ROLES;
        } else if (players.length > roles.length) {
            return STRINGS.NOT_ENOUGH_ROLES;
        } else if (players.length < MIN_PLAYER_COUNT) {
            return STRINGS.NOT_ENOUGH_PLAYERS;
        } else if (players.length > MAX_PLAYER_COUNT) {
            return STRINGS.TOO_MANY_PLAYERS;
        }
        const numGoodPlayers = calcNumGoodPlayers(roles.length);
        if (getNumGoodRoles(roles) !== numGoodPlayers) {
            return `${STRINGS.THERE_MUST_BE_EXACTLY} ${numGoodPlayers} ${STRINGS.GOOD_ROLE}`
        }
        for (const role of [Role.MERLIN, Role.MORGANA, Role.PERCIVAL]) {
            if (this.getRoleCount(roleCounts, role) !== ROLE_LIMIT) {
                return `${STRINGS.THERE_MUST_BE_EXACTLY} ${ROLE_LIMIT} ${role}`
            }
        }
        for (const role of [Role.OBERON, Role.MORDRED, Role.ASSASSIN]) {
            if (this.getRoleCount(roleCounts, Role.MERLIN) !== ROLE_LIMIT) {
                return `${STRINGS.THERE_CAN_BE_AT_MOST} ${ROLE_LIMIT} ${role}`
            }
        }
        return undefined;
    }

    private startGame = () => {
        const {
            game: {
                myName,
            },
            gameId,
            playerId,
        } = this.props;
        const { players, roles } = this.state;
        if (this.canStartGame()) {
            this.services.gameService.startGame(gameId, playerId, myName, {
                roleList: roles,
                playerOrder: players,
            });
        }
    }
}
