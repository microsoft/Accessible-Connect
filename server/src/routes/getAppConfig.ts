// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from "express";
import { collections } from "../db/db";
import { log } from "../utilities/logger";
import { ISession, AppConfig } from "shared/interfaces";

const router = express.Router();

/**
 * route: /getAppConfig/
 *
 * purpose: Get the app configuration
 *
 * @returns The app config as json
 *
 */

router.get("/", async function (req, res, next) {
    try {
        const envVariables = {
            acsResourceConnectionString:
                process.env.ACS_RESOURCE_CONNECTION_STRING,
            acsEndpointUrl: process.env.ACS_ENDPOINT_URL,
            applicationInsightsConnectionString:
                process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
        };
        let sessions: ISession[] = [];
        const query = {
            _deleted: { $exists: false },
        };

        const cursor = collections.moderators.find(query);
        while (await cursor.hasNext()) {
            const document = await cursor.next();
            sessions.push({
                moderatorUserId: document["identityId"],
                sessionId: document["sessionId"],
                groupId: document["groupId"],
                threadId: document["threadId"],
            });
        }

        const sessionVariables = { sessions: sessions };
        const response: AppConfig = { ...envVariables, ...sessionVariables };
        //log.info(response);
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
