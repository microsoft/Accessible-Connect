// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createParticipant } from "@/apis/createParticipant";
import { ParticipantConfig } from "shared/interfaces";

const ALERT_TEXT_TRY_AGAIN =
    "There was a problem in server. Please wait at least 60 seconds and refresh the browser if the website does not work.";

export const createAcsParticipant = async (
    participantConfig: ParticipantConfig,
) => {
    const result = await createParticipant(participantConfig);
    if (!result) {
        alert(ALERT_TEXT_TRY_AGAIN);
        return;
    }
};
