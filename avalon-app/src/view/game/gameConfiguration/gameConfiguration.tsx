import React from "react";
import {
    Button,
    H2,
    Tabs,
    Tab,
    ControlGroup,
    Intent,
    NonIdealState,
    Icon,
    InputGroup,
    Divider,
    Colors,
    NumericInput,
    Position,
} from "@blueprintjs/core";
import styles from "./gameConfiguration.module.scss";
import { ContextType, getServices } from "../../../common/contextProvider";
import { IGame, Role } from "../../../state/types";
import { PlayerList } from "../playerList";
import { History } from "history";
import { IconNames } from "@blueprintjs/icons";
import { assertNever } from "../../../common/assertNever";
import { isEqual, times, constant, flatten } from "lodash-es";
import { CountableValue } from "../../../common/countableValue";
import {
    getNumGoodRoles,
    getNumRoles,
    calcNumGoodPlayers,
    MAX_ONE_ROLES,
    getUnmetDependenciesMessageForRole
} from "../../../common/role";
import { NullableValue } from "../../../common/nullableValue"
import { Clipboard } from "ts-clipboard";
import { JoinPath } from "../../../paths";
import { QRCode } from "../qrcode/qrcode";
import { Popover } from "@blueprintjs/core";
import pluralize from "pluralize";

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
    roles: Record<Role, number>;
    players: string[];
}

const MIN_PLAYER_COUNT = 5;
const MAX_PLAYER_COUNT = 10;
const ROLE_LIMIT = 1;

const roleRecord: Record<Role, number> = {
    [Role.LOYAL_SERVANT]: 0,
    [Role.MERLIN]: 0,
    [Role.MORGANA]: 0,
    [Role.PERCIVAL]: 0,
    [Role.MORDRED]: 0,
    [Role.OBERON]: 0,
    [Role.ASSASSIN]: 0,
    [Role.MINION]: 0,
}

export class GameConfiguration extends React.PureComponent<IGameConfigurationProps, IState> {
    public static contextTypes = ContextType;
    public state: IState = {
        selectedTabId: ConfigurationTab.INVITE,
        roles: roleRecord,
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
        THERE_CANNOT_BE_NEGATIVE: "There cannot be a negative number of",
        TAB_NAVIGATION: "TabNavigation",
        DND_HELPER_TEXT: "Drag and drop to configure player order",
        PLAYER_ORDER_WARNING: "Note that the game will pick a random starting point in the provided ordering",
        NO_ROLES_SPECIFIED: "No roles specified",
        GOOD_ROLE: "good role",
        THERE_MUST_BE_EXACTLY: "There must be exactly",
        We_RECOMMEND: "We recommend",
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
                <H2>{STRINGS.CONFIGURE_GAME}</H2>
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
                    className={styles.startGameButton}
                    intent={Intent.SUCCESS}
                    disabled={!this.canStartGame()}
                    onClick={this.startGame}
                    text={STRINGS.START_GAME}
                />
            </div>
        );
    }

    private renderContent() {
        const { players, selectedTabId } = this.state;
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
                        <div className={styles.playerOrderWarning}>
                            <Icon
                                className={styles.warningIcon}
                                iconSize={12}
                                icon={IconNames.WARNING_SIGN}
                                intent={Intent.WARNING}
                            />
                            <span className={styles.warning}>{STRINGS.PLAYER_ORDER_WARNING}</span>
                        </div>
                    </>
                );
            case ConfigurationTab.ROLES:
                return  this.renderRoles();
            case ConfigurationTab.INVITE:
                return (
                    <>
                        <div>{STRINGS.INVITE_OTHERS}</div>
                        <QRCode url={this.getCopyLink()} backgroundColor={Colors.DARK_GRAY3} foregroundColor={Colors.WHITE} />
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
        const { players, roles } = this.state;
        const allRoles = Object.keys(roles) as Role[];
        return CountableValue.of(allRoles)
            .map((role, idx) => (
                <div key={`role-${idx}`} className={styles.roleRow}>
                    <div  className={styles.role}>
                        <div className={styles.roleName}>
                        <span>{role}</span>
                        {this.maybeRenderInfoTooltip(role)}
                        </div>
                        <div className={styles.roleCount}>
                            <NumericInput
                                rightElement={this.maybeRenderClearButton(role)}
                                min={0}
                                max={MAX_ONE_ROLES.has(role) ? 1 : players.length}
                                value={roles[role]}
                                onValueChange={this.onValueChange(role)}
                                buttonPosition={Position.LEFT}
                                fill={true}
                            />
                        </div>
                    </div>
                    {this.maybeRenderRoleWarning(role)}
                </div>
            )).getValueOrDefault(
                <NonIdealState
                    title={STRINGS.NO_ROLES_SPECIFIED}
                    icon={IconNames.WARNING_SIGN}
                />
            );
    }

    private maybeRenderInfoTooltip = (role: Role) => {
        if (MAX_ONE_ROLES.has(role)) {
            const { STRINGS } = GameConfiguration;
            const content = `${STRINGS.THERE_CAN_BE_AT_MOST} ${ROLE_LIMIT} ${role}`;
            return (
                <Popover content={<div className={styles.roleCountInfoTooltip}>{content}</div>}>
                    <Icon className={styles.infoIcon} icon={IconNames.INFO_SIGN} />
                </Popover>
            );
        }
    }

    private maybeRenderClearButton = (role: Role) => {
        const { roles } = this.state;
        if (roles[role] !== 0) {
            return <Button minimal={true} icon={IconNames.REMOVE} onClick={this.clearRole(role)}/>;
        }
    }

    private onValueChange = (role: Role) => (valueAsNumber: number) => this.setState(prevState => ({
        ...prevState,
        roles: { ...prevState.roles, [role]: valueAsNumber }
    }));

    private handleTabChange = (newTabId: ConfigurationTab) => {
        this.setState({ selectedTabId: newTabId });
    }

    private clearRole = (role: Role) => () => this.onValueChange(role)(0);

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

    private updatePlayerState() {
        this.setState(prevState => {
            const prevPlayers = new Set<string>(prevState.players);
            const newPlayers = this.props.game.players.filter(player => !prevPlayers.has(player));
            return { ...prevState, players: [ ...prevState.players, ...newPlayers ] }
        })
    }

    private maybeRenderStartGameError() {
        return NullableValue.of(this.maybeGetErrorMessage())
            .map<JSX.Element | undefined>(errorMessage => (
                <div className={styles.configurationError}>
                    <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.ERROR} />
                    <div className={styles.error}>{errorMessage}</div>
                </div>
            ))
            .getOrDefault(this.maybeRenderStartGameWarning());
    }

    private maybeRenderStartGameWarning() {
        return NullableValue.of(this.maybeGetWarningMessage())
            .map(errorMessage => (
                <div className={styles.configurationError}>
                    <Icon iconSize={12} intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} />
                    <div className={styles.warning}>{errorMessage}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private maybeRenderRoleWarning(role: Role) {
        const { roles } = this.state;
        return NullableValue.of(getUnmetDependenciesMessageForRole(roles, role))
            .map(message => (
                <div className={styles.roleWarning}>
                    <Icon iconSize={12} intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} />
                    <div className={styles.warning}>{message}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private maybeGetErrorMessage() {
        const { players, roles } = this.state;
        const { STRINGS } = GameConfiguration;
        const roleCount = getNumRoles(roles);
        if (players.length < roleCount) {
            return STRINGS.TOO_MANY_ROLES;
        } else if (players.length > roleCount) {
            return STRINGS.NOT_ENOUGH_ROLES;
        } else if (players.length < MIN_PLAYER_COUNT) {
            return STRINGS.NOT_ENOUGH_PLAYERS;
        } else if (players.length > MAX_PLAYER_COUNT) {
            return STRINGS.TOO_MANY_PLAYERS;
        }
        for (const role in MAX_ONE_ROLES) {
            if (roles[role as Role] > ROLE_LIMIT) {
                return `${STRINGS.THERE_CAN_BE_AT_MOST} ${ROLE_LIMIT} ${role}`
            }
        }
        const allRoles = Object.keys(roles) as Role[];
        for (const role of allRoles) {
            if (roles[role] < 0) {
                return `${STRINGS.THERE_CANNOT_BE_NEGATIVE} ${role}`
            }
        }
        return undefined;
    }

    private maybeGetWarningMessage() {
        const { roles } = this.state;
        const { STRINGS } = GameConfiguration;
        const roleCount = getNumRoles(roles);
        const numGoodPlayers = calcNumGoodPlayers(roleCount);
        if (getNumGoodRoles(roles) !== numGoodPlayers) {
            return `${STRINGS.We_RECOMMEND} ${pluralize(STRINGS.GOOD_ROLE, numGoodPlayers, true)}`
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
        const { players, roles: roleCounts } = this.state;
        const roles = Object.keys(roleCounts) as Role[];
        const roleList = flatten(roles.map(role => times(roleCounts[role], constant(role))));
        if (this.canStartGame()) {
            this.services.gameService.startGame(gameId, playerId, myName, roleList, players);
        }
    }
}
