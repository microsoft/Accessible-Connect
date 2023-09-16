// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { VideoGalleryParticipant } from "@azure/communication-react";

export const getParticipantName = (
    participant: VideoGalleryParticipant,
): string | undefined => {
    return participant?.displayName?.split(": ")[1];
};
