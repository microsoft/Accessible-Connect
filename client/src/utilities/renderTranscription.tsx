// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    ActivityItem,
    IActivityItemProps,
    IActivityItemStyles,
} from "@fluentui/react";
import { Hearing, HearingDisabled, SignLanguage } from "@mui/icons-material";

import { TranscriptionMessage } from "@/utilities/transcriptionMessage";
import { getString } from "./strings";

export const renderTranscription = (
    transcription: TranscriptionMessage,
    key: number,
) => {
    const iconSx = {
        border: 1,
        borderRadius: "25px",
        padding: "2px",
        fontSize: 25,
    };

    const getIcon = () => {
        const participantType = transcription.speakerParticipantType;
        if (participantType === getString("INTERPRETER_PARTICIPANT_TYPE")) {
            return (
                <SignLanguage
                    style={{
                        color: getString("INTERPRETER_PARTICIPANT_TYPE_COLOR"),
                    }}
                    sx={iconSx}
                />
            );
        } else if (participantType === getString("HEARING_PARTICIPANT_TYPE")) {
            return (
                <Hearing
                    style={{
                        color: getString("HEARING_PARTICIPANT_TYPE_COLOR"),
                    }}
                    sx={iconSx}
                />
            );
        } else if (participantType === getString("DHH_PARTICIPANT_TYPE")) {
            return (
                <HearingDisabled
                    style={{
                        color: getString("DHH_PARTICIPANT_TYPE_COLOR"),
                    }}
                    sx={iconSx}
                />
            );
        }
    };

    const style: IActivityItemStyles = {
        root: {
            color: "white",
            fontWeight: "bold",
            paddingTop: "5px",
        },
        activityContent: {
            color: "white",
            fontSize: "1rem",
        },
        commentText: {
            color: "white",
            fontWeight: "normal",
            paddingTop: "2px",
        },
        timeStamp: {
            color: "light-grey",
            paddingTop: "2px",
            paddingBottom: "5px",
        },
    };

    const activityItem: IActivityItemProps & { key: string | number } = {
        key: key,
        activityDescription: [
            <span key={1}>{transcription.speakerDisplayName}</span>,
        ],
        activityIcon: getIcon(),
        comments: transcription.comments,
        isCompact: false,
        timeStamp: transcription.timestamp
            .toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            })
            .toString(),
    };

    return (
        <ActivityItem {...activityItem} key={activityItem.key} styles={style} />
    );
};
