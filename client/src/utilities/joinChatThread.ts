// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    AzureCommunicationTokenCredential,
    CommunicationUserIdentifier,
} from "@azure/communication-common";
import { ChatClient } from "@azure/communication-chat";

import { logger } from "@/utilities/logger";

export const joinChatThread = async (
    acsEndpointUrl: string,
    displayName: string,
    threadId: string,
    moderatorTokenCredential: AzureCommunicationTokenCredential,
    userId: CommunicationUserIdentifier,
) => {
    // Get thread Id using sessionId
    logger.log("joinChatThread");
    const chatClient = new ChatClient(acsEndpointUrl, moderatorTokenCredential);
    const chatThreadClient = chatClient.getChatThreadClient(threadId);
    await chatThreadClient.addParticipants({
        participants: [
            {
                id: { communicationUserId: userId.communicationUserId },
                displayName: displayName,
            },
        ],
    });
    logger.log("Participant successfully added to the chat thread");
};
