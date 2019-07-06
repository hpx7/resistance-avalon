import React from "react";
import { Icon, Intent, Popover, NonIdealState } from "@blueprintjs/core";
import styles from "./playerList.module.scss";
import { IconNames } from "@blueprintjs/icons";
import { IGame, Role } from "../../../state/types";
import { assertNever } from "../../../common/assertNever";
import { capitalize, isEqual } from "lodash-es";
import { NullableValue } from "../../../common/nullableValue";
import { CountableValue } from "../../../common/countableNumber";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { TernaryValue } from "../../../common/ternary";


interface IBaseProps {
    players: string[];
    game: IGame;
    showKnowledge: boolean;
    showMyself: boolean;
    canDragNDrog: boolean;
}

interface INotDragNDropProps extends IBaseProps {
    canDragNDrog: false;
}

interface IDragNDropProps extends IBaseProps {
    canDragNDrog: true;
    onReorderPlayers: (players: string[]) => void;
}

type IProps = INotDragNDropProps | IDragNDropProps;

export class PlayerList extends React.PureComponent<IProps> {
    public static defaultProps: Partial<IProps> = {
        showKnowledge: true,
        showMyself: true,
        canDragNDrog: false,
    }
    private static STRINGS = {
        BAD_GUYS_TEXT: "This person is one of the minions of Mordred.",
        PERCIVAL_TEXT: "This person is either Merlin or Morgana.",
        NO_PLAYERS_IN_GAME: "There are no players in this game",
        PLAYER_LIST: "player_list",
    }

    public render() {
        const { STRINGS } = PlayerList;
        const { canDragNDrog, players } = this.props;
        const countablePlayers = CountableValue.of(players);
        const renderedPlayers =  countablePlayers
            .map(this.renderPlayer)
            .getValueOrDefault(
                <NonIdealState
                    title={STRINGS.NO_PLAYERS_IN_GAME}
                    icon={IconNames.WARNING_SIGN}
                />
            )
        return TernaryValue.of(canDragNDrog && !countablePlayers.isEmpty())
            .ifTrue(
                <DragDropContext onDragEnd={this.onDragEnd}>
                    <Droppable droppableId={STRINGS.PLAYER_LIST}>
                        {provided => (
                            <div className={styles.playerList} ref={provided.innerRef} {...provided.droppableProps}>
                                {renderedPlayers}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )
            .ifFalse(<div className={styles.playerList}>{renderedPlayers}</div>)
            .get();
    }

    private renderPlayer = (player: string, idx: number) => {
        const {
            game: {
                knowledge, myRole, myName
            },
            showKnowledge,
            showMyself,
            canDragNDrog,
        } = this.props;
        const knownPlayers = new Set<string>(knowledge.players);
        const status = this.maybeRenderStatusIcon(myRole);
        const content = [
            <div key="player-name">{player}</div>,
            (showMyself && player === myName && NullableValue.isNotNullish(myRole))
                ? <div key="your-role" className={styles.you}>(You are {capitalize(myRole)})</div>
                : undefined,
        ].filter(NullableValue.isNotNullish);
        const uniqueKey = `${player}-${idx}`;
        const renderedPlayer = (
            <div className={styles.player} key={uniqueKey}>
                <div className={styles.playerMainContent}>
                    {content.map((elem, idx) => {
                        return <div key={`player-${idx}`} className={styles.playerElement}>{elem}</div>
                    })
                }</div>
                {TernaryValue.of(showKnowledge && knownPlayers.has(player)).ifTrue(status).get()}
            </div>
        )
        return TernaryValue.of(canDragNDrog)
            .ifTrue(
                <Draggable draggableId={uniqueKey} index={idx} key={`draggable-${uniqueKey}`}>
                    {provided => (
                        <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                            {renderedPlayer}
                        </div>
                    )}
                </Draggable>
            )
            .ifFalse(renderedPlayer)
            .get();
    }

    private maybeRenderStatusIcon(role: Role | null | undefined) {
        if (NullableValue.isNullish(role)) {
            return null;
        }
        const { STRINGS } = PlayerList;
        switch (role) {
            case Role.ASSASSIN:
            case Role.MORGANA:
            case Role.MINION:
            case Role.MORDRED:
            case Role.MERLIN:
                const merlinContent = <div className={styles.playerStatusTooltip}>{STRINGS.BAD_GUYS_TEXT}</div>;
                return (
                    <Popover content={merlinContent}>
                        <Icon iconSize={12} icon={IconNames.THUMBS_UP} intent={Intent.DANGER} />
                    </Popover>
                )
            case Role.PERCIVAL:
                    const percivalContent = <div className={styles.playerStatusTooltip}>{STRINGS.PERCIVAL_TEXT}</div>;
                    return (
                        <Popover content={percivalContent}>
                            <Icon iconSize={12} icon={IconNames.THUMBS_UP} intent={Intent.WARNING} />
                        </Popover>
                    )
            case Role.OBERON:
            case Role.LOYAL_SERVANT:
                return undefined;
            default:
                return assertNever(role);
        }
    }

    private onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (this.props.canDragNDrog && destination != null && !isEqual(destination, source)) {
            const playerOrder = Array.from(this.props.players);
            playerOrder.splice(source.index, 1);
            playerOrder.splice(destination.index, 0, draggableId.split("-")[0]);
            this.props.onReorderPlayers(playerOrder);
        }
    };
}
