// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from 'express';
import { createChatThread } from '../utilities/createChatThread';

const router = express.Router();

/**
 * route: /createThread/
 *
 * purpose: Create a new chat thread.
 *
 * @returns The new threadId as string
 *
 */

router.post('/', async function (req, res, next) {
  res.send(await createChatThread());
});

export default router;
