import React from "react";
import { Icon, Intent, Popover } from "@blueprintjs/core";
import styles from "./player.module.scss";
import { IconNames } from "@blueprintjs/icons";
import { IGame, Role } from "../../state/types";
import { assertNever } from "../../common/assertNever";
import { isNotNullish } from "../../common/nullish";
import { capitalize } from "lodash-es";

interface IProps {
    player: string;
    game: IGame;
    showKnowledge: boolean;
}

export class Player extends React.PureComponent<IProps> {
    private static STRINGS = {
        BAD_GUYS_TEXT: "This person is definitely one of the minions of Mordred.",
        PERCIVAL_TEXT: "This person is either Merlin or Morgana."
    }

    public render() {
        const {
            game: {
                knowledge, myRole, myName
            },
            player,
            showKnowledge,
        } = this.props;
        const knownPlayers = new Set<string>(knowledge);
        const status = this.renderStatusIcon(myRole);
        const content = [
            <div key="player-name">{player}</div>,
            (player === myName)
                ? <div key="your-role" className={styles.you}>(You are {capitalize(myRole)})</div>
                : undefined,
        ].filter(isNotNullish);
        return (
            <div className={styles.player}>
                <div>{content.map(elem => <div className={styles.playerElement}>{elem}</div>)}</div>
                {showKnowledge && knownPlayers.has(player) ? status : undefined}
            </div>
        )
    }

    private renderStatusIcon(role: Role) {
        const { STRINGS } = Player;
        switch (role) {
            case Role.ASSASSIN:
            case Role.MORGANA:
            case Role.MINION:
            case Role.MORDRED:
            case Role.MERLIN:
                return (
                    <Popover content={<div>{STRINGS.BAD_GUYS_TEXT}</div>}>
                        <Icon iconSize={12} icon={IconNames.FULL_CIRCLE} intent={Intent.DANGER} />
                    </Popover>
                )
            case Role.PERCIVAL:
                    return (
                        <Popover content={<div>{STRINGS.PERCIVAL_TEXT}</div>}>
                            <Icon iconSize={12} icon={IconNames.FULL_CIRCLE} intent={Intent.WARNING} />
                        </Popover>
                    )
            case Role.OBERON:
            case Role.LOYAL_SERVANT:
                return undefined;
            default:
                return assertNever(role);
        }
    }
}
