import { Toaster, IToastProps, Intent } from "@blueprintjs/core";
import { Action, CompoundAction, Dispatch, Middleware } from "redoodle";
import { CreateToast } from "../state";
import { IconNames } from "@blueprintjs/icons";

export function toasterMiddleware(): Middleware {
    const toaster = Toaster.create();
    let key: string | undefined;

    return <S>(_store: Middleware.Api<S>) => (next: Dispatch) => <A extends Action>(newAction: A) => {
        let action: A = newAction;
        if (newAction.type === CompoundAction.TYPE) {
            const possibleAction = (newAction.payload as A[]).find(isCreateToastAction);
            if (possibleAction) {
                action = possibleAction;
            }
        } else {
            action = newAction;
        }
        if (isCreateToastAction(action)) {
            if (key != null) {
                toaster.dismiss(key);
            }
            const toastProps: IToastProps = { message: action.payload };
            if (action.type === CreateToast.Success.TYPE) {
                toastProps.icon = IconNames.TICK_CIRCLE;
                toastProps.intent = Intent.SUCCESS;
            } else if (action.type === CreateToast.Failure.TYPE) {
                toastProps.icon = IconNames.ERROR;
                toastProps.intent = Intent.DANGER;
            } else if (action.type === CreateToast.InProgress.TYPE) {
                toastProps.icon = IconNames.REFRESH;
                toastProps.intent = Intent.PRIMARY;
            }
            key = toaster.show(toastProps);
        }
        return next(newAction);
    };
}

function isCreateToastAction({ type }: Action) {
    return type === CreateToast.Failure.TYPE
        || type === CreateToast.Success.TYPE
        || type === CreateToast.InProgress.TYPE;
}
