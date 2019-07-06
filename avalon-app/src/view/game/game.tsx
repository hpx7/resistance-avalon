import React, { CSSProperties } from "react";
import {
    Card,
    Classes,
    Elevation,
    Navbar,
    NavbarGroup,
    NavbarHeading,
    Button,
    NavbarDivider,
    H2,
    Intent,
    NonIdealState,
    Callout,
    Tag,
    Icon,
} from "@blueprintjs/core";
import styles from "./game.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";
import classNames from "classnames";
import { IconNames, IconName } from "@blueprintjs/icons";
import { IApplicationState, IGameState } from "../../state";
import { connect } from "react-redux";
import { History } from "history";
import { GameAction, IGame, IQuestAttempt, QuestAttemptStatus, GameStatus } from "../../state/types";
import { HomePath } from "../../paths/home";
import { times, constant, random, maxBy } from "lodash-es";
import { PlayerList } from "./playerList";
import { assertNever } from "../../common/assertNever";
import { CountableValue } from "../../common/countableValue";
import { AsyncLoadedValue } from "../../common/redoodle";
import { NullableValue } from "../../common/nullableValue";
import { GameConfiguration } from "./gameConfiguration";
import sharedStyles from "../../styles/styles.module.scss";
import { TernaryValue } from "../../common/ternary";

interface IOwnProps {
    history: History;
    gameId: string;
    playerId: string;
    playerName: string;
}

interface IState {
    questMembers: string[];
}

type GameProps = IOwnProps & IGameState;

const REFRESH_GAME_STATE_INTERVAL_IN_MS = 1000;

export class UnconnectedGame extends React.PureComponent<GameProps, IState> {
    public static contextTypes = ContextType;
    public state: IState = {
        questMembers: [],
    };
    private static STRINGS = {
        AVALON: "Avalon",
        WAITING_FOR_PLAYERS: "Waiting for players to join",
        PLAYERS: "Players",
        QUESTS: "Quests",
        ROLES: "Roles",
        QUEST_HISTORY: "Quest history",
        CURRENT_QUEST: "Current quest",
        START_GAME: "Start game",
        WAITING_FOR_QUEST_RESULTS: "Waiting for all quest members to vote.",
        SELECT_PLAYERS_TO_GO_ON_A_QUEST: "Select players to go on a quest.",
        WAITING_FOR_OTHER_VOTES: "Waiting for other players to vote.",
        PROPOSAL_TITLE: "Do you approve or reject this proposal?",
        PROPOSE_QUEST: "Propose quest",
        QUEST_TITLE: "Do you approve or reject this quest?",
        GAME_NOT_STARTED: "The game has not started and roles have not been specified",
        PASS: "Pass",
        FAIL: "Fail",
        APPROVE: "Approve",
        REJECT: "Reject",
        WAITING_FOR_GAME_START_TITLE: "Waiting for game to start",
        WAITING_FOR_PROPOSAL_VOTES_TITLE: "Waiting for players to vote on proposal",
        PROPOSAL_REJECTED_TITLE: "Proposal rejected",
        WAITING_FOR_QUEST_RESULTS_TITLE: "Waiting for quest results",
        QUEST_PASSED_TITLE: "Quest passed",
        QUEST_FAILED_TITLE: "Quest failed",
        VIEW_ROLES_TITLE: "View roles",
        VIEW_PLAYERS_TITLE: "View players",
        GOOD_WON: "Good won!",
        EVIL_WON: "Evil won!",
        DOES_NOT_EXIST: "does not exist",
        NOT_LEADER_TEXT: "You are not the leader of the quest",
        TOO_MANY_QUEST_MEMBERS_TEXT: "Too many quest members",
        NOT_ENOUGH_QUEST_MEMBERS: "Not enough quest members"
    }
    private services = getServices(this.context);
    private interval: number | undefined;

    public componentDidMount() {
        this.startFetchingGameState();
    }

    public componentDidUpdate() {
        const { game, gameAction } = this.props;
        const { STRINGS } = UnconnectedGame;
        switch (gameAction) {
            case GameAction.VIEW_ROLES:
                this.services.stateService.setDocumentTitle(STRINGS.VIEW_ROLES_TITLE);
                return;
            case GameAction.VIEW_PLAYERS:
                this.services.stateService.setDocumentTitle(STRINGS.VIEW_PLAYERS_TITLE);
                return;
            case GameAction.VIEW_QUESTS:
                if (AsyncLoadedValue.isReady(game)) {
                    CountableValue.of(game.value.questAttempts)
                        .maybeGetLastElement()
                        .map(this.setDocumentTitleBasedOnQuestAttempt);
                } else {
                    this.services.stateService.setDocumentTitle(STRINGS.AVALON);
                }
                return;
            default:
                return assertNever(gameAction);
        }
    }

    public componentWillUnmount() {
        this.maybeStopFetchingGameState();
        this.services.stateService.clearGame();
    }

    public render() {
        return (
            <>
                <Navbar className={styles.navbar}>
                    <NavbarGroup>
                        <NavbarHeading onClick={this.redirectToHome} className={styles.logo} />
                        {this.maybeRenderNavigationButtons()}
                    </NavbarGroup>
                </Navbar>
                <div className={styles.content}>
                    <Card elevation={Elevation.THREE} className={sharedStyles.pageContent}>
                        {this.renderContent()}
                    </Card>
                </div>
            </>
        );
    }

    private maybeRenderNavigationButtons() {
        const { STRINGS } = UnconnectedGame;
        const { game } = this.props;
        if (!AsyncLoadedValue.isReady(game) || game.value.status !== GameStatus.IN_PROGRESS) {
            return undefined;
        }
        return (
            <>
                <NavbarDivider />
                {this.renderNavigationButton(GameAction.VIEW_ROLES, STRINGS.ROLES, IconNames.EYE_OPEN)}
                {this.renderNavigationButton(GameAction.VIEW_PLAYERS, STRINGS.PLAYERS, IconNames.PEOPLE)}
                {this.renderNavigationButton(GameAction.VIEW_QUESTS, STRINGS.QUESTS, IconNames.PATH_SEARCH)}
            </>
        )
    }

    private renderNavigationButton(targetGameAction: GameAction, text: string, icon: IconName) {
        const { gameAction } = this.props;
        return (
            <Button
                active={gameAction === targetGameAction}
                className={Classes.MINIMAL}
                icon={icon}
                text={text}
                onClick={this.setAction(targetGameAction)}
            />
        );
    }

    private renderContent() {
        const { game, playerId, gameId } = this.props;
        if (!AsyncLoadedValue.isReady(game)) {
            return this.renderGameSkeleton();
        }
        const { status, creator, myName } = game.value;
        const { STRINGS } = UnconnectedGame;
        switch (status) {
            case GameStatus.NOT_STARTED:
                if (creator === myName) {
                    return <GameConfiguration game={game.value} playerId={playerId} gameId={gameId} />
                }
                return (
                    <div>
                        <H2 className={styles.gameHeader}>{STRINGS.WAITING_FOR_PLAYERS}</H2>
                        <PlayerList
                            players={game.value.players}
                            game={game.value}
                            showKnowledge={false}
                            showMyself={true}
                        />
                    </div>
                )
            case GameStatus.IN_PROGRESS:
                return this.renderInProgressGame(game.value);
            case GameStatus.GOOD_WON:
                return (
                    <Callout
                        icon={IconNames.THUMBS_UP}
                        title={STRINGS.GOOD_WON}
                        intent={Intent.SUCCESS}
                    />
                )
            case GameStatus.EVIL_WON:
                return (
                    <Callout
                        icon={IconNames.THUMBS_UP}
                        title={STRINGS.EVIL_WON}
                        intent={Intent.DANGER}
                    />
                )
        }
    }

    private renderInProgressGame(game: IGame) {
        const { gameAction } = this.props;
        const { STRINGS } = UnconnectedGame;
        switch (gameAction) {
            case GameAction.VIEW_ROLES:
                return (
                    <div>
                        <H2 className={styles.gameHeader}>{STRINGS.ROLES}</H2>
                        {this.renderRoles(game.roles)}
                    </div>
                );
            case GameAction.VIEW_PLAYERS:
                return (
                    <div>
                        <H2 className={styles.gameHeader}>{STRINGS.PLAYERS}</H2>
                        <PlayerList players={game.players} game={game} />
                    </div>
                );
            case GameAction.VIEW_QUESTS:
                return (
                    <div>
                        <H2 className={styles.gameHeader}>{STRINGS.QUEST_HISTORY}</H2>
                        <div className={styles.questHistory}>{this.renderQuestHistory(game)}</div>
                        <H2 className={styles.gameHeader}>{STRINGS.CURRENT_QUEST}</H2>
                        {this.renderCurrentQuest(game)}
                        {this.maybeRenderCurrentQuestActions(game)}
                    </div>
                );
            default:
                return assertNever(gameAction);
        }
    }

    private renderQuestHistory(game: IGame) {
        const { questConfigurations, questAttempts } = game;
        return NullableValue.of(questConfigurations)
            .map<JSX.Element | string>(presentQuestConfigurations => {
                return (
                    <>
                        {presentQuestConfigurations.map((questConfiguration, idx) => {
                            return (
                                <Tag
                                    className={styles.roundNumber}
                                    key={`quest-${idx}`}
                                    intent={this.getIntentForAttempt(questAttempts, idx + 1)}
                                    minimal={true}
                                    round={true}
                                >
                                    {questConfiguration}
                                </Tag>
                            );
                        })}
                    </>
                );
            }).getOrDefault(this.renderGameNotStarted(game));
    }

    private getIntentForAttempt(questAttempts: IQuestAttempt[], roundNumber: number) {
        const relevantQuest = maxBy(questAttempts.filter(
            questAttempt => questAttempt.roundNumber === roundNumber),
            questAttempt => questAttempt.attemptNumber);
        if (relevantQuest == null) {
            return Intent.NONE;
        }
        switch (relevantQuest.status) {
            case QuestAttemptStatus.PENDING_PROPOSAL:
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
            case QuestAttemptStatus.PROPOSAL_REJECTED:
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                return Intent.PRIMARY;
            case QuestAttemptStatus.PASSED:
                return Intent.SUCCESS;
            case QuestAttemptStatus.FAILED:
                return Intent.DANGER;
            default:
                return assertNever(relevantQuest.status);
        }
    }

    private renderCurrentQuest(game: IGame) {
        return CountableValue.of(game.questAttempts)
            .maybeGetLastElement()
            .map(latestQuestAttempt => {
                const {
                    status,
                    attemptNumber,
                    roundNumber,
                    leader,
                    members,
                } = latestQuestAttempt;
                return TernaryValue.of(status !== QuestAttemptStatus.PENDING_PROPOSAL)
                    .ifTrue(
                        <div>
                            <div className={styles.questMetadata}>
                                <div>Quest {roundNumber} - Attempt {attemptNumber}</div>
                                <div>Leader: {leader}</div>
                                <div>Participants:</div>
                                <PlayerList players={members} game={game} showKnowledge={false} showMyself={true} />
                            </div>
                        </div>
                    ).get();
            })
            .getOrUndefined();
    }

    private maybeRenderCurrentQuestActions(game: IGame) {
        return CountableValue.of(game.questAttempts)
            .maybeGetLastElement()
            .map(latestQuestAttempt => this.renderCurrentQuestActions(game, latestQuestAttempt))
            .getOrDefault(this.renderGameNotStarted(game));
    }

    private renderCurrentQuestActions(game: IGame, questAttempt: IQuestAttempt) {
        const { status, attemptNumber, roundNumber, votes, leader } = questAttempt;
        const { myName } = game;
        const { STRINGS } = UnconnectedGame;
        switch (status) {
            case QuestAttemptStatus.PENDING_PROPOSAL:
                return TernaryValue.of(leader === myName)
                    .ifTrue(this.renderQuestPropoosal(game))
                    .ifFalse(`Waiting for ${leader} to propose a quest.`)
                    .get();
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
                if (votes[myName]) {
                    return STRINGS.WAITING_FOR_OTHER_VOTES;
                } else {
                    return (
                        <div>
                            <div>{STRINGS.PROPOSAL_TITLE}</div>
                            <div className={styles.voteButtons}>
                                <Button intent={Intent.SUCCESS} text={STRINGS.APPROVE}/>
                                <Button intent={Intent.DANGER} text={STRINGS.REJECT}/>
                            </div>
                        </div>
                    )
                }
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                return `Quest ${roundNumber} proposal ${attemptNumber} was rejected.`;
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                if (myName in votes) {
                    return STRINGS.WAITING_FOR_QUEST_RESULTS;
                } else {
                    return (
                        <div>
                            <div>{STRINGS.QUEST_TITLE}</div>
                            <div className={styles.voteButtons}>
                                <Button intent={Intent.SUCCESS} text={STRINGS.PASS}/>
                                {this.maybeRenderFailButton(game)}
                            </div>
                        </div>
                    )
                }
            case QuestAttemptStatus.PASSED:
            case QuestAttemptStatus.FAILED:
                return `Quest number ${roundNumber} ${status}!`;
            default:
                return assertNever(status);
        }
    }

    private renderQuestPropoosal(game: IGame) {
        const { STRINGS } = UnconnectedGame;
        return (
            <div>
                {STRINGS.SELECT_PLAYERS_TO_GO_ON_A_QUEST}
                <PlayerList
                    players={game.players}
                    game={game}
                    showKnowledge={false}
                    showMyself={false}
                    canSelect={true}
                    selectedPlayers={this.state.questMembers}
                    onUpdateSelectedPlayers={this.onUpdateSelectedPlayers}
                />
                {this.maybeRenderProposeQuestError(game)}
                <Button
                    className={styles.proposeQuest}
                    disabled={!this.canProposeQuest(game)}
                    intent={Intent.PRIMARY}
                    text={STRINGS.PROPOSE_QUEST}
                    onClick={this.onProposeQuest(game)}
                />
            </div>
        )
    }

    private maybeRenderProposeQuestError(game: IGame) {
        return NullableValue.of(this.maybeGetProposeQuestErrorMessage(game))
            .map(errorMessage => (
                <div className={styles.configurationError}>
                    <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.ERROR} />
                    <div>{errorMessage}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private maybeGetProposeQuestErrorMessage(game: IGame) {
        const { questConfigurations, questAttempts, myName } = game;
        const { STRINGS } = UnconnectedGame;
        return NullableValue.of(questConfigurations)
            .map(actualQuestConfigurations => CountableValue.of(questAttempts)
                .maybeGetLastElement()
                .map(latestQuestAttempt => {
                    const { roundNumber, leader } = latestQuestAttempt;
                    if (actualQuestConfigurations.length < roundNumber) {
                        return `Round ${roundNumber} ${STRINGS.DOES_NOT_EXIST}`;
                    }
                    const numPlayersNeededForQuest = actualQuestConfigurations[roundNumber - 1];
                    const { questMembers } = this.state;
                    if (leader !== myName) {
                        return STRINGS.NOT_LEADER_TEXT;
                    } else if (numPlayersNeededForQuest < questMembers.length) {
                        return STRINGS.TOO_MANY_QUEST_MEMBERS_TEXT;
                    } else if (numPlayersNeededForQuest > questMembers.length) {
                        return STRINGS.NOT_ENOUGH_QUEST_MEMBERS;
                    }
                    return undefined;
                })
                .getOrUndefined())
            .getOrUndefined();
    }

    private canProposeQuest(game: IGame) {
        return this.maybeGetProposeQuestErrorMessage(game) == null;
    }

    private onProposeQuest = (game: IGame) => () => {
        const {
            gameId,
            playerId,
            playerName,
        } = this.props;
        if (this.canProposeQuest(game)) {
            this.services.gameService.proposeQuest(gameId, playerId, playerName, {
                proposal: this.state.questMembers,
            });
        }
    }

    private onUpdateSelectedPlayers = (selectedPlayers: string[]) => {
        this.setState({ questMembers: selectedPlayers })
    }

    private maybeRenderFailButton(game: IGame) {
        const { STRINGS } = UnconnectedGame;
        const { myRole, roles } = game;
        return NullableValue.of(myRole)
            .map(role => TernaryValue.of(!roles[role])
                .ifTrue(<Button intent={Intent.DANGER} text={STRINGS.FAIL}/>)
                .get())
            .getOrUndefined();

    }

    /**
     * Should never be called in practice since game will
     * always be started if you can see the quest page
     */
    private renderGameNotStarted(game: IGame) {
        const { creator } = game;
        return `Waiting for ${creator} to start the game`;
    }

    private renderGameSkeleton() {
        const classes = classNames(Classes.SKELETON, styles.skeletonRow);
        return times(10, constant(0)).map((_val, idx) => {
            const style: CSSProperties = { width: `${random(50, 100)}%` };
            return <div style={style} key={`skeleton-row-${idx}`} className={classes}>skeleton</div>
        });
    }

    private renderRoles = (roles: Record<string, boolean>) => {
        const { STRINGS } = UnconnectedGame;
        return CountableValue.of(Object.keys(roles))
            .map((role, idx) => {
                const classes = classNames(styles.role, roles[role] ? styles.good : styles.bad);
                return <div key={`${role}-${idx}`} className={classes}>{role}</div>
            }).getValueOrDefault(
                <NonIdealState
                    title={STRINGS.GAME_NOT_STARTED}
                    icon={IconNames.WARNING_SIGN}
                />
            );
    }

    private redirectToHome = () => {
        this.props.history.push(new HomePath().getPathName());
    }

    private setAction = (action: GameAction) => () => this.services.stateService.setGameAction(action);

    private startFetchingGameState() {
        this.interval = window.setInterval(
            () => {
                const { gameId, playerId } = this.props;
                this.services.gameService.getGameState(gameId, playerId)
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

    private setDocumentTitleBasedOnQuestAttempt = (questAttempt: IQuestAttempt) => {
        this.services.stateService.setDocumentTitle(this.getTitleFOrQuestAttempt(questAttempt));
    }

    private getTitleFOrQuestAttempt(questAttempt: IQuestAttempt) {
        const { status } = questAttempt;
        const { STRINGS } = UnconnectedGame;
        switch (status) {
            case QuestAttemptStatus.PENDING_PROPOSAL:
                return STRINGS.WAITING_FOR_GAME_START_TITLE;
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES :
                return STRINGS.WAITING_FOR_PROPOSAL_VOTES_TITLE;
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                return STRINGS.PROPOSAL_REJECTED_TITLE;
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                return STRINGS.WAITING_FOR_QUEST_RESULTS_TITLE;
            case QuestAttemptStatus.PASSED:
                return STRINGS.QUEST_PASSED_TITLE;
            case QuestAttemptStatus.FAILED:
                return STRINGS.QUEST_FAILED_TITLE;
        }
    }
}

const mapStateToProps = (appState: IApplicationState): IGameState => appState.gameState;

export const Game = connect(mapStateToProps)(UnconnectedGame);
