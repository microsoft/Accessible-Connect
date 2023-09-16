// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { StatusCode } from "../utilities/constants";
import { ParticipantConfig } from "shared/interfaces";
import { logger } from "@/utilities/logger";

/**
 *
 * @param participant the participant
 *
 */
export const createParticipant = async (
    participant: ParticipantConfig,
): Promise<boolean> => {
    try {
        const baseUrl: string =
            process.env.REACT_APP_SERVER_BASE_URL || "http://localhost:8080";
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(participant),
        };
        const response = await fetch(
            `${baseUrl}/createParticipant/`,
            requestOptions,
        );
        if (response.status === StatusCode.CREATED) {
            return true;
        }
    } catch (error) {
        logger.error(
            "Failed at inserting participant into database, Error: ",
            error,
        );
    }
    return false;
};
