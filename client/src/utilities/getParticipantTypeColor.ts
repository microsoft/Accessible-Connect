// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { getString } from "@/utilities/strings";

export const getParticipantTypeColor = (
    participantType: string | undefined,
): string => {
    if (participantType === getString("HEARING_PARTICIPANT_TYPE")) {
        return getString("HEARING_PARTICIPANT_TYPE_COLOR");
    } else if (participantType === getString("DHH_PARTICIPANT_TYPE")) {
        return getString("DHH_PARTICIPANT_TYPE_COLOR");
    } else {
        return getString("INTERPRETER_PARTICIPANT_TYPE_COLOR");
    }
};
