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
    Icon,
    IIconProps,
    Intent,
} from "@blueprintjs/core";
import styles from "./game.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";
import classNames from "classnames";
import { IconNames } from "@blueprintjs/icons";
import { IApplicationState, IGameState } from "../../state";
import { connect } from "react-redux";
import { History } from "history";
import { GameAction, IGame, IQuestAttempt, QuestAttemptStatus } from "../../state/types";
import { HomePath } from "../../paths/home";
import { isReady } from "../../common/redoodle";
import { times, constant, random, maxBy } from "lodash-es";
import { Player } from "./player";
import { assertNever } from "../../common/assertNever";
import { isEvilRole } from "../../common/role";

interface IOwnProps {
    history: History;
    gameId: string;
    userId: string;
}

type GameProps = IOwnProps & IGameState;

const REFRESH_GAME_STATE_INTERVAL_IN_MS = 1000;

export class UnconnectedGame extends React.PureComponent<GameProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        PLAYERS: "Players",
        QUESTS: "Quests",
        ROLES: "Roles",
        QUEST_HISTORY: "Quest history",
        CURRENT_QUEST: "Current quest",
        START_GAME: "Start game",
        WAITING_FOR_QUEST_RESULTS: "Waiting for all quest members to vote.",
        WAITING_FOR_OTHER_VOTES: "Waiting for other players to vote.",
        PROPOSAL_TITLE: "Do you approve or reject this proposal?",
        QUEST_TITLE: "Do you approve or reject this quest?",
        PASS: "Pass",
        FAIL: "Fail",
        APPROVE: "Approve",
        REJECT: "Reject",
    }
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
        const { STRINGS } = UnconnectedGame;
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
                                text={STRINGS.PLAYERS}
                                onClick={this.setAction(GameAction.VIEW_PLAYERS)}
                            />
                            <Button
                                active={gameAction === GameAction.VIEW_QUESTS}
                                className={Classes.MINIMAL}
                                icon={IconNames.PATH_SEARCH}
                                text={STRINGS.QUESTS}
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
        const { STRINGS } = UnconnectedGame;
        if (!isReady(game)) {
            return this.renderGameSkeleton();
        } else if (gameAction === GameAction.VIEW_PLAYERS) {
            return (
                <div>
                    <H2 className={styles.gameHeader}>{STRINGS.PLAYERS}</H2>
                    {this.renderPlayers(game.value)}
                    <H2 className={styles.gameHeader}>{STRINGS.ROLES}</H2>
                    {this.renderRoles(game.value.roleList)}
                </div>
            )
        } else {
            return (
                <div>
                    <H2 className={styles.gameHeader}>{STRINGS.QUEST_HISTORY}</H2>
                    <div className={styles.questHistory}>{this.renderQuestHistory(game.value)}</div>
                    <H2 className={styles.gameHeader}>{STRINGS.CURRENT_QUEST}</H2>
                    {this.renderCurrentQuest(game.value)}
                    {this.renderCurrentQuestActions(game.value)}
                </div>
            )
        }
    }

    private renderQuestHistory(game: IGame) {
        console.log("swag", game);
        const { questConfigurations, questAttempts } = game;
        return questConfigurations.map((questConfiguration, idx) => {
            return (
                <div key={`quest-${idx}`}>
                    <span className={styles.questNumber}>{questConfiguration}</span>
                    <Icon {...this.getQuestIconProps(questAttempts, idx + 1)} />
                </div>
            );
        })
    }

    private getQuestIconProps(questAttempts: IQuestAttempt[], questNumber: number): IIconProps {
        const relevantQuest = maxBy(questAttempts.filter(
            questAttempt => questAttempt.questNumber === questNumber),
            questAttempt => questAttempt.attemptNumber);
        if (relevantQuest == null) {
            return { icon: IconNames.CIRCLE, intent: Intent.NONE };
        }
        return { icon: IconNames.FULL_CIRCLE, intent: this.getIntentForAttemptStatus(relevantQuest.status) }
    }

    private getIntentForAttemptStatus(status: QuestAttemptStatus) {
        switch (status) {
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
                return assertNever(status);
        }
    }

    private renderCurrentQuest(game: IGame) {
        const { questAttempts } = game;
        const { STRINGS } = UnconnectedGame;
        if (questAttempts.length === 0) {
            return undefined;
        }
        const {
            status,
            attemptNumber,
            questNumber,
            leader,
            members,
        } = questAttempts[questAttempts.length - 1];
        if (status === QuestAttemptStatus.PENDING_PROPOSAL) {
            return undefined;
        }
        return (
            <div>
                <div className={styles.questMetadata}>
                    <div>Quest {questNumber} Attempt {attemptNumber}</div>
                    <div>Leader: {leader}</div>
                </div>
                {members.map(member => (
                    <Player
                        player={member}
                        game={game}
                        showKnowledge={false}
                        showMyself={false}
                    />
                ))}
            </div>
        );
    }

    private renderCurrentQuestActions(game: IGame) {
        const { questAttempts, myName, myRole } = game;
        const { STRINGS } = UnconnectedGame;
        if (questAttempts.length === 0) {
            return this.renderPendingProposal(game);
        }
        const { status, attemptNumber, questNumber, votes } = questAttempts[questAttempts.length - 1];
        switch (status) {
            case QuestAttemptStatus.PENDING_PROPOSAL:
                return this.renderPendingProposal(game);
            case QuestAttemptStatus.PENDING_PROPOSAL_VOTES:
                if (votes.has(myName)) {
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
                return `Quest ${questNumber} proposal ${attemptNumber} was rejected.`;
            case QuestAttemptStatus.PENDING_QUEST_RESULTS:
                if (votes.has(myName)) {
                    return STRINGS.WAITING_FOR_QUEST_RESULTS;
                } else {
                    return (
                        <div>
                            <div>{STRINGS.QUEST_TITLE}</div>
                            <div className={styles.voteButtons}>
                                <Button intent={Intent.SUCCESS} text={STRINGS.PASS}/>
                                {isEvilRole(myRole) ? <Button intent={Intent.DANGER} text={STRINGS.FAIL}/> : undefined}
                            </div>
                        </div>
                    )
                }
            case QuestAttemptStatus.PASSED:
            case QuestAttemptStatus.FAILED:
                return `Quest number ${questNumber} ${status}!`;
            default:
                return assertNever(status);
        }
    }

    private renderPendingProposal(game: IGame) {
        const { creator, myName } = game;
        const { STRINGS } = UnconnectedGame;
        if (creator === myName) {
            return <Button text={STRINGS.START_GAME}/>
        }
        return `Waiting for ${creator} to start the game`;
    }

    private renderGameSkeleton() {
        const classes = classNames(Classes.SKELETON, styles.skeletonRow);
        return times(10, constant(0)).map((_val, idx) => {
            const style: CSSProperties = { width: `${random(50, 100)}%` };
            return <div style={style} key={`skeleton-row-${idx}`} className={classes}>skeleton</div>
        });
    }

    private renderPlayers(game: IGame) {
        return game.players.map((player, idx) => {
            return <Player key={`plyaer-${idx}`} player={player} game={game} />
        })
    }

    private renderRoles(roleList: string[]) {
        return roleList.map((role, idx) => <div key={`${role}-${idx}`} className={styles.role}>{role}</div>)
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
