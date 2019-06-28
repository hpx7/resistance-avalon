import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { App } from "./view/app/app";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { loggingMiddleware } from "redoodle";
import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { INITIAL_APPLICATION_STATE, appReducer, IApplicationState } from "./state";
import { ContextProvider } from "./common/contextProvider";
import { StateService } from "./service/state";

const middlewareEnhancer = composeWithDevTools(applyMiddleware(loggingMiddleware()));
const createStoreWithMiddleware = middlewareEnhancer<IApplicationState>(createStore);
const store = createStoreWithMiddleware(appReducer, INITIAL_APPLICATION_STATE);

const stateService = new StateService(store.dispatch);

ReactDOM.render(
    <Provider store={store}>
        <ContextProvider
            stateService={stateService}
        >
            <BrowserRouter basename="/">
                <App />
            </BrowserRouter>
        </ContextProvider>
    </Provider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
