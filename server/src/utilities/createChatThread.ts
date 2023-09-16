// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
	AzureCommunicationTokenCredential,
	CommunicationUserIdentifier,
} from "@azure/communication-common";
import { CommunicationUserToken } from "@azure/communication-identity";
import {
	ChatClient,
	CreateChatThreadOptions,
	CreateChatThreadRequest,
} from "@azure/communication-chat";
import { getEndpoint } from "./getEndpoint";
import { createUser, getToken } from "./identityClient";

export const createChatThread = async (
	identityResponse?: CommunicationUserIdentifier,
	tokenCredential?: AzureCommunicationTokenCredential,
	topicName?: string,
): Promise<string> => {
	const user = identityResponse ? identityResponse : await createUser();

	const credential = tokenCredential
		? tokenCredential
		: new AzureCommunicationTokenCredential({
				tokenRefresher: async () =>
					(await getToken(user, ["chat", "voip"])).token,
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
					communicationUserId: user.communicationUserId,
				},
				// Removing displayName hides the `Moderator joined the chat.` message in chat thread
				//displayName: "Moderator",
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
