// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationUserToken, TokenScope } from '@azure/communication-identity';
import * as express from 'express';
import { createUserAndToken } from '../utilities/identityClient';
import { log } from "../utilities/logger";

const router = express.Router();

/**
 * handleUserTokenRequest will return a default scoped token if no scopes are provided.
 * @param requestedScope [optional] string from the request, this should be a comma seperated list of scopes.
 */
const handleUserTokenRequest = async (requestedScope?: string): Promise<CommunicationUserToken> => {
  const scopes: TokenScope[] = requestedScope ? (requestedScope.split(',') as TokenScope[]) : ['chat', 'voip'];
  return await createUserAndToken(scopes);
};

/**
 * route: /token/
 *
 * purpose: To get Azure Communication Services token with the given scope.
 *
 * @param scope: scope for the token as string
 *
 * @returns The token as string
 *
 * @remarks
 * By default the get and post routes will return a token with scopes ['chat', 'voip'].
 * Optionally ?scope can be passed in containing scopes seperated by comma
 * e.g. ?scope=chat,voip
 *
 */
router.get('/', async (req, res, next) => res.send(await handleUserTokenRequest((req.query.scope as string) ?? '')));

router.post('/', async function (req, res, next) { 
  const communicationUserToken: CommunicationUserToken =
		await handleUserTokenRequest((req.body.scope as string) ?? "");
  log.info(communicationUserToken);
 
  res.send(communicationUserToken);
});

export default router;
