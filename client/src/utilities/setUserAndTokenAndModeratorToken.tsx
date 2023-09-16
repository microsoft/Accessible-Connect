// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationUserIdentifier } from "@azure/communication-common";

import {
    CommunicationUserToken,
    TokenScope,
} from "@azure/communication-identity";

import { createUserAndToken, getToken } from "@/utilities/identityClient";

export const setUserAndTokenAndModeratorToken = async (
    resourceConnectionString: string,
    moderatorUserId: CommunicationUserIdentifier,
    setUserId: React.Dispatch<
        React.SetStateAction<CommunicationUserIdentifier | undefined>
    >,
    setToken: React.Dispatch<React.SetStateAction<string | undefined>>,
    setModeratorToken: React.Dispatch<React.SetStateAction<string | undefined>>,
) => {
    const scopes: TokenScope[] = ["chat", "voip"];
    const communicationUserToken: CommunicationUserToken =
        await createUserAndToken(resourceConnectionString, scopes);

    setUserId(communicationUserToken.user);
    setToken(communicationUserToken.token);

    const moderatorToken = await getToken(
        resourceConnectionString,
        moderatorUserId,
        ["chat", "voip"],
    );
    setModeratorToken(moderatorToken.token);
};
