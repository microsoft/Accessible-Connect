// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const getEndpoint = (): string => {
    const uri = new URL(process.env["ACS_ENDPOINT_URL"]);
    return `${uri.protocol}//${uri.host}`;
};
