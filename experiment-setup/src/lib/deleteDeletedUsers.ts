// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationIdentityClient } from "@azure/communication-identity";

import config from "../config/config.json";
import { getIdentityClient } from "../lib/identityClient";
import { collections } from "../db/db";

export const deleteDeletedUsers = async () => {
    const identityClient: CommunicationIdentityClient = getIdentityClient();

    // Delete participant user identities
    if (config["DELETE_DISCONNECTED_PARTICIPANT_USER_IDENTITIES"]) {
        console.log("Delete disconnected participant identities");
        const query = {
            _disconnected: { $exists: true },
        };
        console.log(
            `Deleting these many identities: ${await collections.participants.countDocuments(
                query,
            )}`,
        );
        const cursor = await collections.participants.find(query);

        const documents = await cursor.toArray();
        console.log(
            `Number of participant documents found: ${documents.length}`,
        );
        for (let document of documents) {
            await identityClient.deleteUser({
                communicationUserId: document["userId"],
            });
            // console.log(
            // 	`Deleted the identity with ID: ${document["userId"]}`,
            // );
        }
    }

    // Delete moderator user identities
    if (config["DELETE_DELETED_MODERATOR_USER_IDENTITIES"]) {
        console.log("Delete deleted moderator identities");
        const query = {
            _deleted: { $exists: true },
        };
        console.log(
            `Deleting these many identities: ${await collections.moderators.countDocuments(
                query,
            )}`,
        );
        const cursor = await collections.moderators.find(query);

        const documents = await cursor.toArray();
        console.log(`Number of moderator documents found: ${documents.length}`);
        for (let document of documents) {
            await identityClient.deleteUser(document["identityId"]);
            // console.log(
            // 	`Deleted the identity with ID: ${document["userId"]}`,
            // );
        }
    }
};
