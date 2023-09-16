// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Code modified from access-tokens-quickstart/issue-access-token.js

import {
    AzureCommunicationTokenCredential,
    CommunicationUserIdentifier,
} from "@azure/communication-common";
import {
    CommunicationIdentityClient,
    CommunicationUserToken,
} from "@azure/communication-identity";

import { v4 as uuidv4 } from "uuid";

import config from "../config/config.json";
import { getIdentityClient } from "./identityClient";
import { collections } from "../db/db";
import Moderator from "../db/models/moderators";
import { createChatThreadUsingCommunicationUserToken } from "./createChatThreadUsingCommunicationUserToken";

const createModerator = async (
    identityClient: CommunicationIdentityClient,
    sessionId: string,
): Promise<Moderator> => {
    let identityTokenResponse: CommunicationUserToken =
        await identityClient.createUserAndToken(["voip", "chat"]);
    // Get the token, its expiration date, and the user from the response
    // const { token, expiresOn, user } = identityTokenResponse;

    let threadId = await createChatThreadUsingCommunicationUserToken(
        identityTokenResponse,
        sessionId,
    );

    const date = new Date();
    const createdDateTime = date.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
    });

    const newModerator: Moderator = {
        identityId: identityTokenResponse.user,
        sessionId: sessionId,
        groupId: uuidv4(),
        threadId: threadId,
        createdDateTime: createdDateTime,
    };
    return newModerator;
};

export const createNewAppConfig = async (): Promise<void> => {
    if (config["CREATE_NEW_APP_CONFIG"]) {
        console.log("Create new app config");
        const identityClient: CommunicationIdentityClient = getIdentityClient();
        const workshopCount: number = config["WORKSHOP_COUNT"];
        const sessionCount: number = config["SESSION_COUNT"];
        for (
            let workshopCounter: number = 1;
            workshopCounter <= workshopCount;
            workshopCounter++
        ) {
            //console.log(workshopCounter);
            for (
                let sessionCounter: number = 1;
                sessionCounter <= sessionCount;
                sessionCounter++
            ) {
                //console.log(sessionCounter);
                let sessionId = `Workshop-${workshopCounter}|Session-${sessionCounter}`;
                console.log(`For SessionId: ${sessionId}`);

                const newModerator = await createModerator(
                    identityClient,
                    sessionId,
                );

                const result = await collections.moderators.insertOne(
                    newModerator,
                );
                result
                    ? console.log("\tModerator inserted")
                    : console.log("\tFailed to create a new Moderator.");
            }
        }
    }
    if (config["CREATE_ADDITIONAL_SESSION_CONFIG"]) {
        console.log("Create additional sessions app config");
        const identityClient: CommunicationIdentityClient = getIdentityClient();
        for (let session of config["ADDITIONAL_SESSIONS"]) {
            console.log(session["sessionId"]);
            const newModerator = await createModerator(
                identityClient,
                session["sessionId"],
            );
            const result = await collections.moderators.insertOne(newModerator);
            result
                ? console.log("\tModerator inserted")
                : console.log("\tFailed to create a new Moderator.");
        }
    }
};
