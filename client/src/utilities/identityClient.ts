// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Contains methods related to identityClient ACS.

import {
    CommunicationAccessToken,
    CommunicationIdentityClient,
    CommunicationUserToken,
    TokenScope,
} from "@azure/communication-identity";
import { CommunicationUserIdentifier } from "@azure/communication-common";

// lazy init to allow mocks in test
let identityClient: CommunicationIdentityClient | undefined = undefined;

export const getIdentityClient = (
    resourceConnectionString: string,
): CommunicationIdentityClient =>
    identityClient ??
    (identityClient = new CommunicationIdentityClient(
        resourceConnectionString,
    ));

// replicate here to allow for mocks in tests
export const createUser = (
    resourceConnectionString: string,
): Promise<CommunicationUserIdentifier> =>
    getIdentityClient(resourceConnectionString).createUser();

export const getToken = (
    resourceConnectionString: string,
    user: CommunicationUserIdentifier,
    scopes: TokenScope[],
): Promise<CommunicationAccessToken> =>
    getIdentityClient(resourceConnectionString).getToken(user, scopes);

export const createUserAndToken = (
    resourceConnectionString: string,
    scopes: TokenScope[],
): Promise<CommunicationUserToken> =>
    getIdentityClient(resourceConnectionString).createUserAndToken(scopes);

export const revokeTokens = (
    resourceConnectionString: string,
    user: CommunicationUserIdentifier,
): Promise<void> =>
    getIdentityClient(resourceConnectionString).revokeTokens(user);
