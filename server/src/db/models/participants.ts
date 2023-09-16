// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// External dependencies
import { ObjectId } from "mongodb";
import { ParticipantType } from "shared/interfaces";

// Class Implementation
export default class Participants {
    constructor(
        public firstName: string,
        public lastName: string,
        public displayName: string,
        public userId: string,
        public groupId: string,
        public threadId: string,
        public sessionId: string,

        public participantType: ParticipantType,
        public socketId: string,
        public createdDateTime: string,
        public id?: ObjectId,
        public _disconnected?: boolean, // We don't store participant state anywhere.
        public updatedDateTime?: string,
    ) {}
}
