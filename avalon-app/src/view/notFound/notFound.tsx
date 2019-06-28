import React from "react";
import { NonIdealState, Button, Intent } from "@blueprintjs/core";
import styles from "./notFound.module.scss";
import { PathLink } from "../../common/navigationWithPath";
import { HomePath } from "../../paths/home";
import { IconNames } from "@blueprintjs/icons";

export class NotFound extends React.PureComponent<{}> {
    private static STRINGS = {
        TITLE: "Page not found",
        ACTION: "Back to home",
    }

    public render() {
        const { STRINGS } = NotFound;
        return (
            <NonIdealState
                className={styles.notFound}
                title={STRINGS.TITLE}
                icon={IconNames.ERROR}
                action={this.renderBackToHome()}
            />
        );
    }

    private renderBackToHome() {
        const { STRINGS } = NotFound;
        return (
            <PathLink to={new HomePath()}>
                <Button intent={Intent.PRIMARY} text={STRINGS.ACTION} />
            </PathLink>
        );
    }
}
