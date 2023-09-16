// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    ActivityItem,
    IActivityItemProps,
    IActivityItemStyles,
} from "@fluentui/react";

import { TranscriptionMessage } from "@/utilities/transcriptionMessage";

export const renderSubtitle = (
    transcription: TranscriptionMessage,
    key: number,
) => {
    const style: IActivityItemStyles = {
        root: {
            color: "white",
            //fontWeight: "bold",
            paddingTop: "0px",
        },
        activityContent: {
            color: "white",
            fontSize: "1.3rem",
        },
    };

    const activityItem: IActivityItemProps & { key: string | number } = {
        key: key,
        activityDescription: [
            <span key={1}>
                <strong>{transcription.speakerDisplayName}: </strong>
            </span>,
            transcription.comments,
        ],
        isCompact: false,
    };

    return (
        <ActivityItem {...activityItem} key={activityItem.key} styles={style} />
    );
};
