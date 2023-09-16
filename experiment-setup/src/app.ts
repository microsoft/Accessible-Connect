// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import config from "./config/config.json";
import dotenv from "dotenv";
// Loads environment variables from a .env file into process.env
dotenv.config();

import * as mongoDB from "mongodb";
import { connectToDatabase } from "./db/db";

import { createNewAppConfig } from "./lib/createNewAppConfig";
import { deleteDeletedUsers } from "./lib/deleteDeletedUsers";
import { deleteExistingAppConfig } from "./lib/deleteExistingAppConfig";

console.log(
    "Edit the config.json file before proceeding and comment `process.exit()` line.",
);
console.log(config);

//process.exit();

async function main() {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(
        process.env.DB_CONNECTION_STRING,
    );
    try {
        // Connect to the MongoDB cluster
        await connectToDatabase(client);
        // Delete existing app config
        await deleteExistingAppConfig();
        await deleteDeletedUsers();

        await createNewAppConfig();
        process.exit();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
