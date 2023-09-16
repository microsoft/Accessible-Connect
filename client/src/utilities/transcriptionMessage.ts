// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface TranscriptionMessage {
    /**
     * The information of the call participant who spoke the captioned text.
     */
    speakerDisplayName: string | undefined;
    /**
     * The information of the call participant who spoke the captioned text.
     */
    speakerParticipantType: string | undefined;
    /**
     * Timestamp of when the captioned words were initially spoken.
     */
    timestamp: Date;
    /**
     * The caption text.
     */
    comments: React.ReactNode[] | React.ReactNode;
    signalMessage: boolean;
}
