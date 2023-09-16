// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./index.css";
import App from "./App";
import { AppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "@/utilities/applicationInsights";

ReactDOM.render(
    <React.StrictMode>
        <DndProvider backend={HTML5Backend}>
            <AppInsightsContext.Provider value={reactPlugin}>
                <App />
            </AppInsightsContext.Provider>
        </DndProvider>
    </React.StrictMode>,
    document.getElementById("root"),
);
