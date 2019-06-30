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
    showMyself: boolean;
}

export class Player extends React.PureComponent<IProps> {
    public static defaultProps: Partial<IProps> = {
        showKnowledge: true,
        showMyself: true,
    }
    private static STRINGS = {
        BAD_GUYS_TEXT: "This person is definitely one of the minions of Mordred.",
        PERCIVAL_TEXT: "This person is either Merlin or Morgana."
    }

    public render() {
        console.log("swag");
        const {
            game: {
                knowledge, myRole, myName
            },
            player,
            showKnowledge,
            showMyself,
        } = this.props;
        const knownPlayers = new Set<string>(knowledge);
        const status = this.renderStatusIcon(myRole);
        const content = [
            <div key="player-name">{player}</div>,
            (showMyself && player === myName)
                ? <div key="your-role" className={styles.you}>(You are {capitalize(myRole)})</div>
                : undefined,
        ].filter(isNotNullish);
        return (
            <div className={styles.player}>
                <div className={styles.playerMainContent}>
                    {content.map((elem, idx) => {
                        return <div key={`player-${idx}`} className={styles.playerElement}>{elem}</div>
                    })
                }</div>
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
}
