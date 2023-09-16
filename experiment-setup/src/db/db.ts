// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// External Dependencies
import * as mongoDB from "mongodb";

// Global Variables
export const collections: {
    moderators?: mongoDB.Collection;
    participants?: mongoDB.Collection;
} = {};

// Initialize Connection
export async function connectToDatabase(client: mongoDB.MongoClient) {
    await client.connect();

    const db: mongoDB.Db = client.db(process.env.DB_NAME);

    const moderatorsCollection: mongoDB.Collection = db.collection(
        process.env.MODERATORS_COLLECTION_NAME,
    );
    const participantsCollection: mongoDB.Collection = db.collection(
        process.env.PARTICIPANTS_COLLECTION_NAME,
    );

    collections.moderators = moderatorsCollection;
    collections.participants = participantsCollection;

    console.log(
        `Successfully connected to database: ${db.databaseName} and collections: [${moderatorsCollection.collectionName}, ${participantsCollection.collectionName}]`,
    );
}
