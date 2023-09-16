// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AppConfig } from "shared/interfaces";

export const getAppConfig = async (): Promise<AppConfig> => {
    const baseUrl: string =
        process.env.REACT_APP_SERVER_BASE_URL || "http://localhost:8080";
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    };
    const response = await fetch(`${baseUrl}/getAppConfig/`, requestOptions);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("Could not get app config");
    }
};
