// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

export var reactPlugin = new ReactPlugin();

const appInsights = new ApplicationInsights({
    config: {
        connectionString:
            process.env.REACT_APP_APPLICATION_INSIGHTS_CONNECTION_STRING,
        extensions: [reactPlugin],
    },
});

appInsights.addTelemetryInitializer((_t) => {
    return process.env.REACT_APP_ENABLE_LOGGING === "TRUE"; // Telemetry is disabled by default. Change REACT_APP_ENABLE_LOGGING is TRUE in .env file to enable it.
});

appInsights.loadAppInsights();
