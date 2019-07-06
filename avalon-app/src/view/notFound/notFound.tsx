import React from "react";
import { NonIdealState, Button, Intent, Card, Elevation } from "@blueprintjs/core";
import { PathLink } from "../../common/navigationWithPath";
import { HomePath } from "../../paths/home";
import { IconNames } from "@blueprintjs/icons";
import sharedStyles from "../../styles/styles.module.scss";

export class NotFound extends React.PureComponent {
    private static STRINGS = {
        TITLE: "Page not found",
        ACTION: "Back to home",
    }

    public render() {
        const { STRINGS } = NotFound;
        return (
            <Card elevation={Elevation.THREE} className={sharedStyles.pageContent}>
                <NonIdealState
                    title={STRINGS.TITLE}
                    icon={IconNames.ERROR}
                    action={this.renderBackToHome()}
                />
            </Card>
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
