import React from "react";
import {
    Button,
    H2,
    Intent,
    Icon,
    Divider,
    RadioGroup,
    Radio,
    Dialog,
    Classes,
} from "@blueprintjs/core";
import styles from "./assassination.module.scss";
import { ContextType, getServices } from "../../../common/contextProvider";
import { IGame, Role } from "../../../state/types";
import { IconNames } from "@blueprintjs/icons";
import { NullableValue } from "../../../common/nullableValue"
import { handleStringChange } from "../../../common/handleStringChange";

interface IAssassinationProps {
    game: IGame;
    playerId: string;
    playerName: string;
    gameId: string;
}

interface IState {
    assassinationTarget?: string;
    openDialog: boolean;
}

export class Assassination extends React.PureComponent<IAssassinationProps, IState> {
    public static contextTypes = ContextType;
    public state: IState = { assassinationTarget: undefined, openDialog: false };
    private static STRINGS = {
        ASSASSINATE: "Assassinate",
        ASSASSINATE_MERLIN: "Assassinate Merlin",
        CHOOSE_MERLIN: "Who do you think Merlin is?",
        WAITING_FOR_THE_ASSASSIN: "Waiting for the assassin to pick Merlin",
        DISCUSS_WITH_YOUR_TEAM_MATES: "Discuss with your teammates who you think Merlin is",
        ARE_YOU_SURE: "Are you sure?",
        CLOSE: "Close",
        CONFIRM: "Confirm",
        PLEASE_SELECT_MERLIN: "Please select the one player who you think is Merlin",
    }
    private services = getServices(this.context);

    public render() {
        const { STRINGS } = Assassination;
        const { myRole, roles } = this.props.game;
        const evilRoles = Object.keys(roles).filter(role => !roles[role]) as Role[];
        if (myRole !== Role.ASSASSIN) {
            if (myRole != null && evilRoles.includes(myRole)) {
                return <div>{STRINGS.DISCUSS_WITH_YOUR_TEAM_MATES}</div>;
            } else {
                return <div>{STRINGS.WAITING_FOR_THE_ASSASSIN}</div>;
            }
        }
        return (
            <div>
                <Dialog
                    icon={IconNames.WARNING_SIGN}
                    isOpen={this.state.openDialog && this.state.assassinationTarget != null}
                    onClose={this.toggleAssassinationDialog}
                    title={STRINGS.ARE_YOU_SURE}
                >
                    <div className={Classes.DIALOG_BODY}>
                        <p>Are you sure you want to kill <strong>{this.state.assassinationTarget}</strong>?</p>
                    </div>
                    <div className={Classes.DIALOG_FOOTER}>
                        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                            <Button onClick={this.toggleAssassinationDialog} text={STRINGS.CLOSE} />
                            <Button onClick={this.confirmAssinationTarget} intent={Intent.PRIMARY} text={STRINGS.CONFIRM}/>
                        </div>
                    </div>
                </Dialog>
                <H2>{STRINGS.ASSASSINATE_MERLIN}</H2>
                <RadioGroup
                    label={STRINGS.CHOOSE_MERLIN}
                    onChange={this.handleAssassinationTargetChange}
                    selectedValue={this.state.assassinationTarget}
                >
                    {this.renderPlayers()}
                </RadioGroup>
                <Divider />
                {this.maybeRenderStartGameError()}
                <Button
                    className={styles.assassinateButton}
                    intent={Intent.SUCCESS}
                    disabled={this.state.assassinationTarget == null}
                    onClick={this.toggleAssassinationDialog}
                    text={STRINGS.ASSASSINATE}
                />
            </div>
        );
    }

    private handleAssassinationTargetChange = handleStringChange(assassinationTarget => this.setState({ assassinationTarget }));

    private maybeRenderStartGameError() {
        const { STRINGS } = Assassination;
        const message = this.state.assassinationTarget == null
            ? STRINGS.PLEASE_SELECT_MERLIN
            : undefined;
        return NullableValue.of(message)
            .map(errorMessage => (
                <div className={styles.configurationError}>
                    <Icon iconSize={12} intent={Intent.DANGER} icon={IconNames.ERROR} />
                    <div>{errorMessage}</div>
                </div>
            ))
            .getOrUndefined();
    }

    private toggleAssassinationDialog = () => this.setState(prevState => ({ ...prevState, openDialog: !prevState.openDialog }));

    private confirmAssinationTarget = () => {
        const { assassinationTarget } = this.state;
        const { gameId, playerId, playerName } = this.props;
        NullableValue.of(assassinationTarget)
            .map(target => {
                this.services.gameService.assassinate(gameId, playerId, playerName, target);
                return undefined;
            });
    }

    private renderPlayers = () => {
        const { players, knowledge } = this.props.game;
        return players.filter(player => !knowledge.players.includes(player)).map((player, idx) => {
            return <Radio key={`${player}-${idx}`} label={player} value={player} />;
        })
    }
}
