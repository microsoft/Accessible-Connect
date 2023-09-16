// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    AzureCommunicationTokenCredential,
    CommunicationTokenRefreshOptions,
    CommunicationUserIdentifier,
} from "@azure/communication-common";
import { CommunicationUserToken } from "@azure/communication-identity";

import { getToken } from "@/utilities/identityClient";

/**
 * Create credentials that auto-refresh asynchronously.
 */
export const createAutoRefreshingCredential = (
    resourceConnectionString: string,
    userId: string,
    token: string,
): AzureCommunicationTokenCredential => {
    const options: CommunicationTokenRefreshOptions = {
        token: token,
        tokenRefresher: refreshTokenAsync(resourceConnectionString, userId),
        refreshProactively: true,
    };
    return new AzureCommunicationTokenCredential(options);
};

const refreshTokenAsync = (
    resourceConnectionString: string,
    userIdentity: string,
): (() => Promise<string>) => {
    return async (): Promise<string> => {
        const user: CommunicationUserIdentifier = {
            communicationUserId: userIdentity,
        };
        const token = await getToken(resourceConnectionString, user, [
            "chat",
            "voip",
        ]);
        const userToken: CommunicationUserToken = {
            user,
            ...token,
        };
        return userToken.token;
    };
};
