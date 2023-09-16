// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.


import * as express from "express";

import { collections } from "../db/db";
import Participants from "../db/models/participants";
import {log} from "../utilities/logger";
import { ParticipantConfig, ParticipantType } from "shared/interfaces";

const router = express.Router();

/**
 * route: /createParticipant/
 *
 * purpose: Add the participant to the database
 *
 * @param participant: ParticipantConfig
 *
 */

router.post("/", async function (req, res, next) {
	try {
        const participant: ParticipantConfig = req.body;
        const date = new Date();
        const createdDateTime = date.toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
        });

        const candidateParticipant: Participants = {
            firstName: participant.firstName,
            lastName: participant.lastName,
            displayName: participant.displayName,
            userId: participant.userId,
            groupId: participant.groupId,
            threadId: participant.threadId,
            sessionId: participant.sessionId,
            participantType: participant.participantType,
            socketId: participant.socketId,
            createdDateTime: createdDateTime,
        };
        const result = await collections.participants.insertOne(
            candidateParticipant,
        );
        if (result) {
            log.info(
                `Participant inserted successfully: ${JSON.stringify(participant)}`,
            );
            res.sendStatus(201);
        } else {
            log.info("Failed at inserting Participant into database.");
            res.sendStatus(500);
        }
    } catch (error) {
        log.error(
            "Failed at inserting Participant into database, Error: ",
            error,
        );
        res.sendStatus(500);
    }
	
});

export default router;
