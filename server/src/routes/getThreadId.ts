// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from "express";
import { collections } from "../db/db";

const router = express.Router();

/**
 * route: /getThreadId/
 *
 * purpose: Get the threadId for the corresponding Session.
 *
 * @param sessionId: id of the session
 *
 * @returns The thread id as string
 *
 */

router.get("/:sessionId", async function (req, res, next) {
	const sessionId = req.params["sessionId"];

	try {
		const moderatorDocument = await collections.moderators.findOne({
			_deleted: { $exists: false },
			sessionId: sessionId,
		});
		res.status(200).send({ threadId: moderatorDocument.threadId });
	} catch (error) {
		res.status(500).send(error.message);
	}
});

export default router;
