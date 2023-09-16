// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const getResourceConnectionString = (): string => {
    const resourceConnectionString =
        process.env["ACS_RESOURCE_CONNECTION_STRING"];

    if (!resourceConnectionString) {
        throw new Error("No ACS connection string provided");
    }

    return resourceConnectionString;
};
