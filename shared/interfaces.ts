import { CommunicationUserIdentifier } from "@azure/communication-common";

export const participantTypes = [
    "Deaf",
    "Hearing",
    "Interpreter",
    "Admin",
] as const;
export type ParticipantType = typeof participantTypes[number];

export interface ParticipantConfig {
    firstName: string;
    lastName: string;
    displayName: string;
    userId: string;
    groupId: string;
    threadId: string;
    sessionId: string;
    socketId: string;
    participantType?: ParticipantType;
}

export interface ISession {
    moderatorUserId: CommunicationUserIdentifier;
    sessionId: string;
    groupId: string;
    threadId: string;
}

export interface AppConfig {
    acsResourceConnectionString: string;
    acsEndpointUrl: string;
    // TODO: applicationInsightsConnectionString is not being used at the moment.
    applicationInsightsConnectionString: string;
    sessions: ISession[];
}

export interface MongoConfig {
    dbConnectionString: string;
    moderatorsCollectionName: string;
    participantsCollectionName: string;
}
