// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import config from "../config/config.json";
import { collections } from "../db/db";

export const deleteExistingAppConfig = async (): Promise<void> => {
    // Delete old moderator identities
    if (config["DELETE_EXISTING_APP_CONFIG"]) {
        console.log("Delete existing app config");
        const date = new Date();
        const updatedDateTime = date.toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
        });
        await collections.moderators.updateMany(
            {}, // NOTE: You can put a filter here based on `sessionId` to delete specific app configuration. For example, { sessionId: "Workshop-1|Session-1"}
            { $set: { _deleted: true, updatedDateTime: updatedDateTime } },
        );
    }
};
