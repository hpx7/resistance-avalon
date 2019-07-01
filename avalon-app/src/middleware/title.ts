import { Action, CompoundAction, Dispatch, Middleware } from "redoodle";
import { SetTitle } from "../state";

export function titleMiddleware(): Middleware {
    let currentTitle: string | undefined;

    return <S>(_store: Middleware.Api<S>) => (next: Dispatch) => <A extends Action>(newAction: A) => {
        let action: A = newAction;
        if (newAction.type === CompoundAction.TYPE) {
            const possibleAction = (newAction.payload as A[]).find(isSetTitleAction);
            if (possibleAction) {
                action = possibleAction;
            }
        } else {
            action = newAction;
        }
        if (isSetTitleAction(action)) {
            const { payload: newTitle } = action;
            if (newTitle !== currentTitle) {
                window.document.title = newTitle;
                currentTitle = newTitle;
            }
        }
        return next(newAction);
    };
}

function isSetTitleAction({ type }: Action) {
    return type === SetTitle.TYPE;
}
