import React from "react";
import { Card, Classes, Elevation } from "@blueprintjs/core";
import styles from "./game.module.scss";
import { ContextType, getServices } from "../../common/contextProvider";

export class Game extends React.PureComponent<{}> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);

    public componentWillUnmount() {
        this.services.stateService.clearGame();
    }

    public render() {
        return (
            <div className={styles.game}>
                <div className={styles.body}>
                    <Card elevation={Elevation.THREE} className={Classes.DARK}>
                        <div className={styles.form}>
                            Waiting for other players...
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
}
