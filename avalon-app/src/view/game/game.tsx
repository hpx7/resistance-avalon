import React from "react";
import { Card, Classes, Elevation } from "@blueprintjs/core";
import styles from "./game.module.scss";

export const Game: React.SFC = () => {
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
