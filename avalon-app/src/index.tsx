import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { App } from "./view/app/app";
import * as serviceWorker from "./serviceWorker";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { loggingMiddleware } from "redoodle";
import { applyMiddleware, createStore, Reducer } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { createInitialState, appReducer } from "./state";
import { ContextProvider } from "./common/contextProvider";
import { GameService, StateService } from "./service";
import { createApi } from "./common/createApi";
import { toasterMiddleware, titleMiddleware } from "./middleware";
import { IApplicationState } from "./state/types";
import { createBrowserHistory } from "history";
import { CookieService } from "./common/cookie";

const history = createBrowserHistory();
const middlewareEnhancer = composeWithDevTools(applyMiddleware(
    titleMiddleware(),
    loggingMiddleware(),
    toasterMiddleware()));
const createStoreWithMiddleware = middlewareEnhancer(createStore);
const store = createStoreWithMiddleware(appReducer as Reducer<IApplicationState>, createInitialState(history));

const api = createApi({ gameServiceApi: "" });

const stateService = new StateService(store.dispatch);
const gameService = new GameService(store, api.gameService);

ReactDOM.render(
    <Provider store={store}>
        <ContextProvider
            stateService={stateService}
            gameService={gameService}
        >
            <Router history={history}>
                <App />
            </Router>
        </ContextProvider>
    </Provider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
