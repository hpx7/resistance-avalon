import React from "react";
import { NonIdealState, Button, Intent, Card, Elevation } from "@blueprintjs/core";
import { PathLink } from "../../common/navigationWithPath";
import { IconNames } from "@blueprintjs/icons";
import sharedStyles from "../../styles/styles.module.scss";
import { JoinPath } from "../../paths";

export class NotFound extends React.PureComponent {
    private static STRINGS = {
        TITLE: "Page not found",
        ACTION: "Back to home",
    }

    public render() {
        const { STRINGS } = NotFound;
        return (
            <div className={sharedStyles.pageContentWrapper}>
                <Card elevation={Elevation.THREE} className={sharedStyles.pageContent}>
                    <NonIdealState
                        title={STRINGS.TITLE}
                        icon={IconNames.ERROR}
                        action={this.renderBackToHome()}
                    />
                </Card>
            </div>
        );
    }

    private renderBackToHome() {
        const { STRINGS } = NotFound;
        return (
            <PathLink to={new JoinPath()}>
                <Button intent={Intent.PRIMARY} text={STRINGS.ACTION} />
            </PathLink>
        );
    }
}
