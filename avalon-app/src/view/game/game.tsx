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
    Tabs,
    Tab,
    Divider,
} from "@blueprintjs/core";
import styles from "./game.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";
import classNames from "classnames";
import { IconNames, IconName } from "@blueprintjs/icons";
import { IApplicationState, IGameState } from "../../state";
import { connect } from "react-redux";
import { History } from "history";
import { GameAction, IGame, IQuestAttempt, QuestAttemptStatus, GameStatus, Vote } from "../../state/types";
import { times, constant, random, maxBy } from "lodash-es";
import { PlayerList } from "./playerList";
import { assertNever } from "../../common/assertNever";
import { CountableValue } from "../../common/countableValue";
import { AsyncLoadedValue } from "../../common/redoodle";
import { NullableValue } from "../../common/nullableValue";
import { GameConfiguration } from "./gameConfiguration";
import sharedStyles from "../../styles/styles.module.scss";
import { TernaryValue } from "../../common/ternary";
import { voteToString } from "../../common/vote";
import { JoinPath } from "../../paths";
import { Supplier } from "../../common/supplier";
import pluralize from "pluralize";
import { Assassination } from "./assassination/assassination";

interface IOwnProps {
    history: History;
    gameId: string;
    playerId: string;
    playerName: string;
}

interface IState {
    questMembers: string[];
    selectedTabId: QuestTab;
    assassinationTarget?: string;
}

enum QuestTab {
    PREVIOUS_QUEST = "Previous quest",
    PREVIOUS_PROPOSAL = "Previous proposal",
    CURRENT_QUEST = "Current quest",
}

interface IPreviousQuestAttempt {
    tab: JSX.Element;
    display: JSX.Element;
}

type GameProps = IOwnProps & IGameState;

export class UnconnectedGame extends React.PureComponent<GameProps, IState> {
    public static contextTypes = ContextType;
    public state: IState = {
        questMembers: [],
        selectedTabId: QuestTab.CURRENT_QUEST,
    };
    private static STRINGS = {
        AVALON: "Avalon",
        WAITING_FOR_PLAYERS: "Waiting for players to join",
        PLAYERS: "Players",
        QUESTS: "Quests",
        QUEST_HISTORY: "Quests history",
        ROLES: "Roles",
        PREVIOUS_PROPOSAL_REJECTED: "Previous proposal failed",
        PREVIOUS_QUEST_PASSED: "Previous quest passed",
        PREVIOUS_QUEST_FAILED: "Previous quest failed",
        CURRENT_QUEST: "Current quest",
        START_GAME: "Start game",
        WAITING_FOR_QUEST_RESULTS: "Waiting for all quest members to vote",
        SELECT_PLAYERS_TO_GO_ON_A_QUEST: "Select players to go on a quest",
        WAITING_FOR_OTHER_VOTES: "Waiting for other players to vote",
        PROPOSAL_TITLE: "Do you approve or reject this proposal?",
        PROPOSE_QUEST: "Propose quest",
        QUEST_TITLE: "Do you want to pass or fail this quest?",
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
        NOT_ENOUGH_QUEST_MEMBERS: "Not enough quest members",
        YOU_VOTED: "You voted",
        NOT_PART_OF_QUEST: "You are not going on this quest",
        GOOD_CANNOT_FAIL: "Sorry, good roles cannot fail quests",
        HIDE_PREVIOUS_QUEST: "Hide previous quest",
        SHOW_PREVIOUS_QUEST: "Show previous quest",
        TAB_NAVIGATION: "TabNavigation",
    }
    private services = getServices(this.context);

    public componentDidMount() {
        this.services.gameService.register(this.getPlayerIdSupplier());
    }

    public componentDidUpdate(prevProps: GameProps) {
        const { game: prevGame } = prevProps;
        const { game, gameAction } = this.props;
        if (AsyncLoadedValue.isReady(prevGame) && AsyncLoadedValue.isReady(game)) {
            const { currentQuest, questHistory, status } = game.value;
            const {
                currentQuest: prevQuestAttempt,
                questHistory: prevQuestHistory,
                status: prevStatus,
            } = prevGame.value;
            if (status === prevStatus) {
                if (prevQuestHistory.length + 1 === questHistory.length) {
                    CountableValue.of(questHistory)
                        .maybeGetLastElement()
                        .map(this.toastQuestStatusChange);
                } else if (questHistory.length === prevQuestHistory.length) {
                    const prevStatus = NullableValue.of(prevQuestAttempt)
                        .map(({ status }) => status)
                        .getOrUndefined();
                    NullableValue.of(currentQuest)
                        .map(questAttempt => prevStatus !== questAttempt.status
                            ? this.toastQuestStatusChange(questAttempt)
                            : undefined);
                }
            } else {
                this.toastGameStatusChange(status);
            }
        }
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
                    NullableValue.of(game.value.currentQuest)
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
        this.services.gameService.unregister(this.getPlayerIdSupplier());
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
                    <div className={sharedStyles.pageContentWrapper}>
                        <div className={sharedStyles.pageContent}>
                            <Card elevation={Elevation.THREE}>
                                {this.renderContent()}
                            </Card>
                        </div>
                    </div>
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
        const { game, playerId, playerName, gameId, history } = this.props;
        if (!AsyncLoadedValue.isReady(game)) {
            return this.renderGameSkeleton();
        }
        const { status, creator, myName } = game.value;
        const { STRINGS } = UnconnectedGame;
        switch (status) {
            case GameStatus.NOT_STARTED:
                if (creator === myName) {
                    return (
                        <GameConfiguration
                            game={game.value}
                            playerId={playerId}
                            gameId={gameId}
                            history={history}
                        />
                    );
                };
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
                );
            case GameStatus.IN_PROGRESS:
                return this.renderInProgressGame(game.value);
            case GameStatus.GOOD_WON:
                return (
                    <Callout
                        icon={IconNames.THUMBS_UP}
                        title={STRINGS.GOOD_WON}
                        intent={Intent.SUCCESS}
                    />
                );
            case GameStatus.EVIL_WON:
                return (
                    <Callout
                        icon={IconNames.THUMBS_UP}
                        title={STRINGS.EVIL_WON}
                        intent={Intent.DANGER}
                    />
                );
            case GameStatus.ASSASSNATING:
                return (
                    <Assassination
                        game={game.value}
                        playerId={playerId}
                        playerName={playerName}
                        gameId={gameId}
                    />
                );
            default:
                return assertNever(status);
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
                const prevQuestAttempt = CountableValue.of(game.questHistory)
                    .maybeGetLastElement()
                    .map<IPreviousQuestAttempt>(attempt => this.maybeRenderPreviousQuestAttempt(game, attempt));
                return (
                    <div>
                        <H2 className={styles.gameHeader}>{STRINGS.QUESTS}</H2>
                        <div className={Classes.HEADING}>{STRINGS.QUEST_HISTORY}</div>
                        <div className={styles.questHistory}>{this.renderQuestHistory(game)}</div>
                        <Divider />
                        <Tabs
                            className={styles.questTabs}
                            id={STRINGS.TAB_NAVIGATION}
                            onChange={this.handleTabChange}
                            selectedTabId={this.state.selectedTabId}
                        >
                            <Tab id={QuestTab.CURRENT_QUEST} title={QuestTab.CURRENT_QUEST} />
                            {prevQuestAttempt.map(attempt => attempt.tab).getOrUndefined()}
                        </Tabs>
                        <div className={styles.questContent}>
                            {this.renderQuestContent(game, prevQuestAttempt)}
                        </div>
                    </div>
                );
            default:
                return assertNever(gameAction);
        }
    }

    private renderQuestContent(game: IGame, prevQuestAttempt: NullableValue<IPreviousQuestAttempt>) {
        const { selectedTabId } = this.state;
        switch (selectedTabId) {
            case QuestTab.PREVIOUS_QUEST:
            case QuestTab.PREVIOUS_PROPOSAL:
                return prevQuestAttempt.map(attempt => attempt.display).getOrUndefined();
            case QuestTab.CURRENT_QUEST:
                return (
                    <>
                        {this.renderCurrentQuest(game)}
                        <div className={styles.questActions}>
                            {this.maybeRenderCurrentQuestActions(game)}
                        </div>
                    </>
                )
            default:
                return assertNever(selectedTabId);
        }
    }

    private handleTabChange = (newTabId: QuestTab) => {
        this.setState({ selectedTabId: newTabId });
    }

    private maybeRenderPreviousQuestAttempt = (
        game: IGame, previousQuestAttempt: IQuestAttempt): IPreviousQuestAttempt => {
        const tabId = previousQuestAttempt.status === QuestAttemptStatus.PROPOSAL_REJECTED
            ? QuestTab.PREVIOUS_PROPOSAL
            : QuestTab.PREVIOUS_QUEST;
        return {
            tab: <Tab id={tabId} title={tabId} />,
            display: (
                <>
                    <div className={styles.previousQuestTitle}>
                        {this.getPreviousQuestTitle(previousQuestAttempt)}
                    </div>
                    {this.renderQuestAttemptMetadata(game, previousQuestAttempt)}
                    {this.renderQuestAttemptVotes(game, previousQuestAttempt)}
                </>
            )
        }
    }

    private renderQuestAttemptVotes(_game: IGame, previousQuestAttempt: IQuestAttempt) {
        const { votes } = previousQuestAttempt;
        const playerVoteRowStyles = classNames(styles.playerVote, Classes.RUNNING_TEXT);
        const renderedVotes = votes.map((playerVote, index) => {
            const { player, vote } = playerVote;
            const voteStyles = vote === Vote.PASS ? styles.good : styles.bad;
            return (
                <div key={`${player}-${index}`} className={playerVoteRowStyles}>
                    {player} <code className={voteStyles}>{voteToString(vote)}</code>
                </div>
            );
        });
        const numApproves = votes.filter(({ vote }) => vote === Vote.PASS).length;
        const numRejects = votes.length - numApproves;
        const voteBreakdown = `( ${pluralize("approve", numApproves, true)} `
            + `and ${pluralize("reject", numRejects, true)} )`;
        return (
            <>
                <div className={styles.proposalVotes}>Proposal votes: {voteBreakdown}</div>
                {renderedVotes}
            </>
        )
    }

    private renderQuestHistory(game: IGame) {
        const { questConfigurations, questHistory, currentQuest } = game;
        const allQuestAttempts = [...questHistory, currentQuest ].filter(NullableValue.isNotNullish);
        return NullableValue.of(questConfigurations)
            .map<JSX.Element | string>(presentQuestConfigurations => {
                return (
                    <>
                        {presentQuestConfigurations.map((questConfiguration, idx) => {
                            return (
                                <Tag
                                    className={styles.roundNumber}
                                    key={`quest-${idx}`}
                                    intent={this.getIntentForAttempt(allQuestAttempts, idx + 1)}
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

    private getPreviousQuestTitle(questAttempt: IQuestAttempt) {
        const { STRINGS } = UnconnectedGame;
        const { results, status } = questAttempt;
        const numPasses = results.filter(vote => vote === Vote.PASS).length;
        const numFails = results.length - numPasses;
        const voteBreakdown = `( ${pluralize("pass", numPasses, true)} `
            + `and ${pluralize("fail", numFails, true)} )`;
        switch (status) {
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                return (
                    <div className={styles.alert}>
                        <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.THUMBS_DOWN} />
                        <div className={styles.danger}>
                            {STRINGS.PREVIOUS_PROPOSAL_REJECTED}
                        </div>
                    </div>
                );
            case QuestAttemptStatus.PASSED:
                return (
                    <>
                        <div className={styles.alert}>
                            <Icon iconSize={12} intent={Intent.SUCCESS} icon={IconNames.TICK_CIRCLE} />
                            <div className={styles.success}>
                                {STRINGS.PREVIOUS_QUEST_PASSED}
                            </div>
                        </div>
                        <div className={classNames(styles.success, styles.voteBreakdown)}>{voteBreakdown}</div>
                    </>
                );
            case QuestAttemptStatus.FAILED:
                return (
                    <>
                        <div className={styles.alert}>
                            <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.BAN_CIRCLE} />
                            <div className={styles.danger}>
                                {STRINGS.PREVIOUS_QUEST_FAILED}
                            </div>
                        </div>
                        <div className={classNames(styles.danger, styles.voteBreakdown)}>{voteBreakdown}</div>
                    </>
                );
            default:
                return undefined;
        }
    }

    private renderCurrentQuest(game: IGame) {
        return NullableValue.of(game.currentQuest)
            .map(latestQuestAttempt => this.renderQuestAttemptMetadata(game, latestQuestAttempt))
            .getOrUndefined();
    }

    private renderQuestAttemptMetadata(game: IGame, questAttempt: IQuestAttempt) {
        const {
            attemptNumber,
            roundNumber,
            leader,
            members,
            status,
        } = questAttempt;
        const questContent = TernaryValue.of(status !== QuestAttemptStatus.PENDING_PROPOSAL)
            .ifTrue(
                <>
                    <div>Participants:</div>
                    <div className={styles.questParticipants}>
                        <PlayerList players={members} game={game} showKnowledge={false} showMyself={false} />
                    </div>
                </>
            )
            .get();
        return (
            <div className={styles.questMetadata}>
                <div>Quest {roundNumber} - Attempt {attemptNumber}</div>
                <div>Leader: {leader}</div>
                {questContent}
            </div>
        )
    }

    private maybeRenderCurrentQuestActions(game: IGame) {
        return NullableValue.of(game.currentQuest)
            .map(latestQuestAttempt => this.renderCurrentQuestActions(game, latestQuestAttempt))
            .getOrDefault(this.renderGameNotStarted(game));
    }

    private renderCurrentQuestActions(game: IGame, questAttempt: IQuestAttempt) {
        const {
            status,
            attemptNumber,
            roundNumber,
            leader,
            members,
            myVote,
            myResult,
            remainingVotes,
            remainingResults
        } = questAttempt;
        const { myName } = game;
        const { STRINGS } = UnconnectedGame;
        switch (status) {
            case QuestAttemptStatus.PENDING_PROPOSAL:
                return TernaryValue.of(leader === myName)
                    .ifTrue(this.renderQuestPropoosal(game, questAttempt))
                    .ifFalse(<div>Waiting for {leader} to propose a quest.</div>)
                    .get();
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
                return NullableValue.of(myVote)
                    .map(this.renderMyVote(false, remainingVotes))
                    .getOrDefault(
                        <div>
                            <div className={styles.waitingForVotes}>{STRINGS.PROPOSAL_TITLE}</div>
                            <div className={styles.voteButtons}>
                                <Button
                                    onClick={this.onVoteOnQuestProposal(questAttempt, Vote.PASS)}
                                    intent={Intent.SUCCESS}
                                    text={STRINGS.APPROVE}
                                />
                                <Button
                                    onClick={this.onVoteOnQuestProposal(questAttempt, Vote.FAIL)}
                                    intent={Intent.DANGER}
                                    text={STRINGS.REJECT}
                                />
                            </div>
                        </div>
                    )
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                return <div>Quest {roundNumber} proposal {attemptNumber} was rejected.</div>;
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                return TernaryValue.of(members.includes(myName))
                    .ifTrue(NullableValue.of(myResult)
                        .map(this.renderMyVote(true, remainingResults))
                        .getOrDefault(
                            <div>
                                <div className={styles.waitingForVotes}>{STRINGS.QUEST_TITLE}</div>
                                <div className={styles.voteButtons}>
                                    <Button
                                        onClick={this.onVoteOnQuest(game, questAttempt, Vote.PASS)}
                                        intent={Intent.SUCCESS}
                                        text={STRINGS.PASS}
                                    />
                                    <Button
                                        onClick={this.onVoteOnQuest(game, questAttempt, Vote.FAIL)}
                                        intent={Intent.DANGER}
                                        text={STRINGS.FAIL}
                                    />
                                </div>
                            </div>
                        )
                    ).ifFalse(
                        <>
                            <div className={styles.waitingForVotes}>{STRINGS.NOT_PART_OF_QUEST}</div>
                            <div className={styles.waitingForVotes}>{STRINGS.WAITING_FOR_QUEST_RESULTS}</div>
                        </>
                    ).get();
            case QuestAttemptStatus.PASSED:
            case QuestAttemptStatus.FAILED:
                return <div>Quest number {roundNumber} {status}!</div>;
            default:
                return assertNever(status);
        }
    }

    private renderQuestPropoosal(game: IGame, questAttempt: IQuestAttempt) {
        const { id: questId } = questAttempt;
        const { STRINGS } = UnconnectedGame;
        return (
            <div>
                <div>{STRINGS.SELECT_PLAYERS_TO_GO_ON_A_QUEST}</div>
                <div className={styles.proposalPlayerList}>
                    <PlayerList
                        players={game.players}
                        game={game}
                        showKnowledge={false}
                        showMyself={false}
                        canSelect={true}
                        selectedPlayers={this.state.questMembers}
                        onUpdateSelectedPlayers={this.onUpdateSelectedPlayers}
                    />
                </div>
                {this.maybeRenderProposeQuestError(game)}
                <Button
                    className={styles.proposeQuest}
                    disabled={!this.canProposeQuest(game)}
                    intent={Intent.PRIMARY}
                    text={STRINGS.PROPOSE_QUEST}
                    onClick={this.onProposeQuest(game, questId)}
                />
            </div>
        )
    }

    private maybeRenderProposeQuestError(game: IGame) {
        return NullableValue.of(this.maybeGetProposeQuestErrorMessage(game))
            .map(errorMessage => (
                <div className={styles.alert}>
                    <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.ERROR} />
                    <div className={styles.danger}>{errorMessage}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private renderMyVote = (isQuest: boolean, numVotesRemaining: number) => (myVote: Vote) => {
        const { STRINGS } = UnconnectedGame;
        const voteStyles = myVote === Vote.PASS ? styles.good : styles.bad;
        return (
            <>
                <div className={styles.alert}>
                    <Icon iconSize={12} icon={IconNames.CONFIRM} />
                    <div className={classNames(styles.myVote, Classes.RUNNING_TEXT)}>
                        {STRINGS.YOU_VOTED}: <code className={voteStyles}>{voteToString(myVote, isQuest)}</code>
                    </div>
                </div>
                <div className={styles.waitingForVotes}>
                    {STRINGS.WAITING_FOR_OTHER_VOTES}: {numVotesRemaining} more
                </div>
            </>
        );
    }

    private maybeGetProposeQuestErrorMessage(game: IGame) {
        const { questConfigurations, currentQuest, myName } = game;
        const { STRINGS } = UnconnectedGame;
        return NullableValue.of(questConfigurations)
            .map(actualQuestConfigurations => NullableValue.of(currentQuest)
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

    private onProposeQuest = (game: IGame, questId: string) => () => {
        const { playerId, playerName } = this.props;
        if (this.canProposeQuest(game)) {
            this.services.gameService.proposeQuest(questId, playerId, playerName, this.state.questMembers).then(() => {
                this.setState({ questMembers: [] });
            });
        }
    }

    private onVoteOnQuestProposal = (questAttempt: IQuestAttempt, vote: Vote) => () => {
        const { playerId, playerName } = this.props;
        this.services.gameService.voteOnProposal(questAttempt.id, playerId, playerName, vote);
    }

    private onVoteOnQuest = (game: IGame, questAttempt: IQuestAttempt, vote: Vote) => () => {
        const { playerId, playerName } = this.props;
        const { myRole, roles } = game;
        const { STRINGS } = UnconnectedGame;
        const { gameService, stateService } = this.services;
        NullableValue.of(myRole)
            .map(role => {
                if (vote === Vote.FAIL && roles[role]) {
                    stateService.showFailToast(STRINGS.GOOD_CANNOT_FAIL)
                } else {
                    gameService.voteOnQuest(questAttempt.id, playerId, playerName, vote);
                }
                return undefined;
            });
    }

    private onUpdateSelectedPlayers = (selectedPlayers: string[]) => {
        this.setState({ questMembers: selectedPlayers });
    }

    /**
     * Should never be called in practice since game will
     * always be started if you can see the quest page
     */
    private renderGameNotStarted(game: IGame) {
        const { creator } = game;
        return <div>Waiting for {creator} to start the game</div>;
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
        this.props.history.push(new JoinPath().getLocationDescriptor());
    }

    private setAction = (action: GameAction) => () => this.services.stateService.setGameAction(action);

    private selectAssinationTarget = (target: string) => () => this.setState({ assassinationTarget: target });

    private confirmAssinationTarget = () => {
        const { assassinationTarget } = this.state;
        const { gameId, playerId, playerName } = this.props;
        NullableValue.of(assassinationTarget)
            .map(target => {
                this.services.gameService.assassinate(gameId, playerId, playerName, target);
                return undefined;
            });
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
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
                return STRINGS.WAITING_FOR_PROPOSAL_VOTES_TITLE;
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                return STRINGS.PROPOSAL_REJECTED_TITLE;
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                return STRINGS.WAITING_FOR_QUEST_RESULTS_TITLE;
            case QuestAttemptStatus.PASSED:
                return STRINGS.QUEST_PASSED_TITLE;
            case QuestAttemptStatus.FAILED:
                return STRINGS.QUEST_FAILED_TITLE;
            default:
                return assertNever(status);
        }
    }

    private toastQuestStatusChange = (questAttempt: IQuestAttempt) => {
        const { leader, attemptNumber, roundNumber, status } = questAttempt;
        const quest = `Quest ${roundNumber}`;
        switch (status) {
            case QuestAttemptStatus.PROPOSAL_REJECTED:
                const attempt = `Proposal ${attemptNumber}`;
                return this.services.stateService.showFailToast(`${quest} - ${attempt} was rejected`);
            case QuestAttemptStatus.FAILED:
                return this.services.stateService.showFailToast(`${quest} failed`);
            case QuestAttemptStatus.PASSED:
                return this.services.stateService.showSuccessToast(`${quest} succeeded`);
            case QuestAttemptStatus.PENDING_PROPOSAL:
                return undefined;
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
                return this.services.stateService.showInProgressToast(`${leader} has proposed a quest`);
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                const leaderText = `${leader}\`` + (leader.endsWith("s") ? "" : "s");
                return this.services.stateService.showSuccessToast(`${leaderText} proposal was approved!`);
            default:
                return assertNever(status);
        }
    }

    private toastGameStatusChange(status: GameStatus) {
        const { stateService } = this.services;
        switch (status) {
            case GameStatus.NOT_STARTED:
                return stateService.showInProgressToast("The game was created");
            case GameStatus.IN_PROGRESS:
                return stateService.showInProgressToast("The game has started");
            case GameStatus.GOOD_WON:
                return stateService.showSuccessToast("Good won!");
            case GameStatus.EVIL_WON:
                return stateService.showFailToast("Evil won!");
            case GameStatus.ASSASSNATING:
                return stateService.showFailToast("3 quests succeeded! Assassin, did you find Merlin?");
            default:
                return assertNever(status);
        }
    }

    private getPlayerIdSupplier = (): Supplier<string | undefined> => {
        return {
            get: () => this.props.playerId,
        }
    }
}

const mapStateToProps = (appState: IApplicationState): IGameState => appState.gameState;

export const Game = connect(mapStateToProps)(UnconnectedGame);
