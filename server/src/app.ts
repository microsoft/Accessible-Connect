// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
// Loads environment variables from a .env file into process.env
dotenv.config();
import http from "http";
import express from "express";
import logger from "morgan";
import path from "path";
import { Server } from "socket.io";

import { collections, connectToDatabase } from "./db/db";
import { log } from "./utilities/logger";
import createParticipant from "./routes/createParticipant";
import getAppConfig from "./routes/getAppConfig";
import { LoggerLevel } from "mongodb";

//import addUser from "./routes/addUser";
//import removeUser from "./routes/removeUser";
//import createThread from "./routes/createThread";
// import getEndpointUrl from "./routes/getEndpointUrl";
// import getThreadId from "./routes/getThreadId";
// import issueToken from "./routes/issueToken";
// import refreshToken from "./routes/refreshToken";

const app = express();

app.use(logger("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "build")));

/**
 * route: /getAppConfig
 * purpose: Get app configuration data
 */
app.use("/getAppConfig", cors(), getAppConfig);

/**
 * route: /createThread
 * purpose: Chat: create a new chat thread
 */
//app.use("/createThread", cors(), createThread);

/**
 * route: /addUser
 * purpose: Chat: add the user to the chat thread
 */
//app.use("/addUser", cors(), addUser);

/**
 * route: /removeUser
 * purpose: Chat: remove the user from the chat thread
 */
//app.use("/removeUser", cors(), removeUser);

/**
 * route: /createParticipant
 * purpose: Chat, Calling: add the participant to the database
 */
app.use("/createParticipant", cors(), createParticipant);

/**
 * route: /refreshToken
 * purpose: Chat,Calling: get a new token
 */
//app.use("/refreshToken", cors(), refreshToken);

/**
 * route: /getEndpointUrl
 * purpose: Chat,Calling: get the endpoint url of ACS resource
 */
//app.use("/getEndpointUrl", cors(), getEndpointUrl);

/**
 * route: /token
 * purpose: Chat,Calling: get ACS token with the given scope
 */
//app.use("/token", cors(), issueToken);

/**
 * route: /getThreadId
 * purpose: Chat: get threadId using sessionId from db
 */
//app.use("/getThreadId", cors(), getThreadId);

// Change the 404 message modifing the middleware
app.use(function (req, res, next) {
    res.status(404).send("Sorry, that route doesn't exist. Have a nice day :)");
});

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "8080");
//app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

server.listen(port);
/**
 * Listen on provided port, on all network interfaces.
 */

server.on("error", onError);
server.on("listening", onListening);

connectToDatabase()
    .then(() => {
        log.info(
            `Successfully connected to collections: [${collections.moderators.collectionName}, ${collections.participants.collectionName}]`,
        );
    })
    .catch((error: Error) => {
        log.error("Database connection failed", error);
        process.exit();
    });

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): number | string | false {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: { syscall: string; code: string }): void {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            log.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            log.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
    const addr = server.address();
    const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    log.info(`Listening on ${bind}`);
}

// SOCKET
const io = new Server(server, {
    perMessageDeflate: false,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Socket middleware, make sure db is connected before clients tries to connect with server socket
io.use((socket, next) => {
    setTimeout(() => {
        if (collections.participants !== undefined) {
            log.info(
                "Good news: DB is reachable before sockets get connected.",
            );
            next();
        } else {
            // CHANGE THIS ERROR MESSAGE WITH CARE, IT'S BEING USED BY THE CLIENT.
            const err = new Error("DB CONNECTION ERROR");
            log.error("Bad news: DB is not connected.");
            next(err);
        }
    }, 3000);
});

// Gets fired for every new websocket connection
io.on("connection", (socket) => {
    log.info(`Socket Connected: ${socket.id}`);

    /*
	arg: {"sessonId": <>}
	*/
    socket.on("addParticipantToRoom", (arg) => {
        log.info(
            `Socket addParticipantToRoom: ${socket.id} to ${arg["sessionId"]}`,
        );
        // Room: arg["sessionId"]
        socket.join(arg["sessionId"]);
    });

    socket.on("sendMessageToParticipant", (message) => {
        log.info(`Socket sendMessageToParticipant: ${JSON.stringify(message)}`);
        // Need db call to get recipient's socket id.
        const participant = collections.participants
            .find({
                _disconnected: { $exists: false },
                userId: message.toUserId,
            })
            .sort({
                _id: -1,
            })
            .limit(1);
        participant
            .next()
            .then((arg) => {
                let destinationMessage = {
                    fromUserName: message.fromUserName,
                    fromUserId: message.fromUserId,
                    signalMessage: message.signalMessage,
                };
                socket
                    .to(arg["socketId"])
                    .emit("messageReceivedFromParticipant", destinationMessage);
            })
            .catch((error: Error) => {
                log.error("Database connection failed", error);
            });
    });

    socket.on("broadcastMessage", (message) => {
        log.info(`Socket broadcastMessage: ${JSON.stringify(message)}`);
        let destinationMessage = {
            fromUserName: message.fromUserName,
            fromUserId: message.fromUserId,
            signalMessage: message.signalMessage,
            signalCode: message.signalCode,
        };
        socket
            .to(message.sessionId)
            .emit("broadcastMessageServer", destinationMessage);
    });

    socket.on("broadcastSpeakingMessage", (message) => {
        log.info(`Socket broadcastSpeakingMessage: ${JSON.stringify(message)}`);
        let destinationMessage = {
            speakingUserId: message.speakingUserId,
            speakingDisplayName: message.speakingDisplayName,
            speaking: message.speaking,
        };
        socket
            .to(message.sessionId)
            .emit("broadcastSpeakingMessageServer", destinationMessage);
    });

    socket.on("disconnect", (reason) => {
        log.info(`Socket disconnect: ${socket.id} ${reason}`);

        // https://socket.io/docs/v3/server-socket-instance/#disconnect
        // If the client has manually disconnected the socket using socket.disconnect()
        if (reason === "client namespace disconnect") {
            // Update participant _disconnected to true
            const updatedParticipant = collections.participants.updateOne(
                { _disconnected: { $exists: false }, socketId: socket.id },
                { $set: { _disconnected: true } },
            );
            updatedParticipant
                .then((arg) => {
                    if (arg.modifiedCount == 1) {
                        log.info(
                            "Participant updated succesfully with _disconnected",
                        );
                    } else if (arg.modifiedCount > 1) {
                        log.error(
                            `This shouldn' happen, it means there are multiple participants with same ${socket.id}`,
                        );
                    } else if (arg.modifiedCount == 0) {
                        log.error(
                            `Participant with ${socket.id} not found in db`,
                        );
                    }
                })
                .catch((error: Error) => {
                    log.error("Participant update failed", error);
                });
        }
    });
});

//export default app;
