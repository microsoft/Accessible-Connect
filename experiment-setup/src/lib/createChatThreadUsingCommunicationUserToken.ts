// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
	AzureCommunicationTokenCredential,
} from "@azure/communication-common";
import { CommunicationUserToken } from "@azure/communication-identity";
import {
	ChatClient,
	CreateChatThreadOptions,
	CreateChatThreadRequest,
} from "@azure/communication-chat";
import { getEndpoint } from "../lib/getEndpoint";

export const createChatThreadUsingCommunicationUserToken = async (
	acsIdentity: CommunicationUserToken,
	topicName?: string,
): Promise<string> => {
	const credential = new AzureCommunicationTokenCredential({
		tokenRefresher: async () => acsIdentity.token,
		refreshProactively: true,
	});
	const chatClient = new ChatClient(getEndpoint(), credential);

	const request: CreateChatThreadRequest = {
		topic: topicName ?? "Your Chat sample",
	};
	const options: CreateChatThreadOptions = {
		participants: [
			{
				id: {
					communicationUserId: acsIdentity.user.communicationUserId,
				},
			},
		],
	};
	const result = await chatClient.createChatThread(request, options);

	const threadID = result.chatThread?.id;
	if (!threadID) {
		throw new Error(
			`Invalid or missing ID for newly created thread ${result.chatThread}`,
		);
	}

	return threadID;
};
