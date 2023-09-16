// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// External dependencies
import { CommunicationUserIdentifier } from "@azure/communication-common";
import { ObjectId } from "mongodb";

// Class Implementation
export default class Moderator {
    constructor(
        public identityId: CommunicationUserIdentifier,
        public sessionId: string,
        public groupId: string,
        public threadId: string,
        public createdDateTime: string,
        public id?: ObjectId,
        public _deleted?: boolean,
        public updatedDateTime?: string,
    ) {}
}
