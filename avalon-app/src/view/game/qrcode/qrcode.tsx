import React from "react";
import styles from "./qrcode.module.scss";
import * as qrcode from "qrcode";

interface IQRCodeProps {
    url: string;
    margin: number;
    scale: number;
    size: number;
    backgroundColor: string;
    foregroundColor: string;
}

const DEFAULT_BACKGROUND_COLOR = "#000000";
const DEFAULT_FOREGROUND_COLOR = "#FFFFFF";

export class QRCode extends React.PureComponent<IQRCodeProps> {
    public static defaultProps = {
        margin: 1,
        scale: 4,
        size: 150,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        foregroundColor: DEFAULT_FOREGROUND_COLOR,
    };
    private canvasRef?: HTMLCanvasElement;
    private refHandlers = {
        canvas: (ref: HTMLCanvasElement) => (this.canvasRef = ref),
    };

    public componentDidMount() {
        const { size, scale, margin, url, backgroundColor, foregroundColor } = this.props;
        if (this.canvasRef != null) {
            qrcode.toCanvas(this.canvasRef, url, {
                margin,
                scale,
                width: size,
                color: {
                    dark: backgroundColor,
                    light: foregroundColor,
                },
            });
        }
    }

    public render() {
        const { size } = this.props;
        return (
            <div className={styles.qrCodeWrapper}>
                <canvas
                    ref={this.refHandlers.canvas}
                    className={styles.qrCode}
                    width={size}
                    height={size}
                />
            </div>
        )
    }
}
