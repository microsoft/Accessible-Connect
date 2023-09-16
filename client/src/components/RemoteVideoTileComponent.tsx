// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    StreamMedia,
    VideoGalleryParticipant,
    VideoGalleryRemoteParticipant,
    VideoTile,
    VideoTileProps,
    VideoTileStylesProps,
} from "@azure/communication-react";
import { useBoolean } from "@fluentui/react-hooks";
import { useState } from "react";

import { RemoteVideoTileOverlay } from "@/components/RemoteVideoTileOverlay";
import { getParticipantType } from "@/utilities/getParticipantType";
import { getParticipantTypeColor } from "@/utilities/getParticipantTypeColor";
import {
    onRenderPlaceholderDHH,
    onRenderPlaceholderHearing,
    onRenderPlaceholderInterpreter,
} from "@/utilities/onRenderPlaceholders";
import { getString } from "@/utilities/strings";
import { TranscriptionMessage } from "@/utilities/transcriptionMessage";

import "@/styles/App.css";

interface RemoteVideoTileProps {
    localParticipant: VideoGalleryParticipant;
    participant: VideoGalleryParticipant;
    lockTile: (participantUserId: string) => void;
    removeTile: (participantUserId: string) => void;
    // Show feedback and reaction stack if true
    isRemoteParticipantTile: boolean;
    // Remove remove icon if false
    allowRemoveTile: boolean;
    // Remove video icon if false
    allowVideoOnOff: boolean;
    setTranscription: React.Dispatch<
        React.SetStateAction<TranscriptionMessage[]>
    >;
    // Show reaction icons
    handRaised?: boolean;
    iUnderstood?: boolean;
    liked?: boolean;
    clapped?: boolean;
    // Show border on overlay if participant is speaking
    speaking?: boolean;
}

const RemoteVideoTileComponent = (props: RemoteVideoTileProps): JSX.Element => {
    // Props
    const {
        localParticipant,
        participant,
        lockTile,
        removeTile,
        isRemoteParticipantTile,
        allowRemoveTile,
        allowVideoOnOff,
        setTranscription,
        handRaised,
        iUnderstood,
        liked,
        clapped,
        speaking,
    } = props;

    const [isHovering, setIsHovering] = useState(false);
    // Lock/Unlock Icon on video overlay
    const [isLocked, { toggle: toggleIsLocked }] = useBoolean(false);
    // Video/VideoOff Icon on video overlay
    const [isVideoOff, { toggle: toggleIsVideoOff }] = useBoolean(false);

    const remoteVideoTileOverLay = RemoteVideoTileOverlay(
        localParticipant,
        participant,
        setIsHovering,
        isHovering,
        // Lock/Unlock Icon
        lockTile,
        toggleIsLocked,
        isLocked,
        // Remove tile icon
        removeTile,
        // Video on/off icon
        toggleIsVideoOff,
        isVideoOff,
        isRemoteParticipantTile,
        allowRemoveTile,
        allowVideoOnOff,
        setTranscription,
        handRaised,
        iUnderstood,
        liked,
        clapped,
    );

    const getVideoTile = (participant: VideoGalleryRemoteParticipant) => {
        const participantType = getParticipantType(participant);

        const displayName =
            participantType === "Interpreter"
                ? participant.displayName
                : participant.displayName?.split(": ")[1];

        const videoDivStyle = {
            height: "100%",
            width: "100%",
        };
        const videoTileStyles: VideoTileStylesProps = {
            root: {
                border: speaking ? `4px solid #2899f5` : "inherit",
            },
            displayNameContainer: {
                top: "1rem",
                bottom: "auto",
                right: "1rem",
                left: "auto",
                color: "white",
                backgroundColor: getParticipantTypeColor(participantType),
                borderRadius: "4px",
            },
        };

        const defaultVideoTileProps: VideoTileProps = {
            children: remoteVideoTileOverLay,
            displayName: displayName,
            isMuted: participant.isMuted,
            isSpeaking:
                participantType === getString("HEARING_PARTICIPANT_TYPE")
                    ? participant.isSpeaking
                    : false,
            onRenderPlaceholder:
                participantType === getString("HEARING_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderHearing
                    : participantType === getString("DHH_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderDHH
                    : onRenderPlaceholderInterpreter,
            renderElement: isVideoOff ? null : participant.videoStream
                  ?.isAvailable ? (
                <StreamMedia
                    videoStreamElement={
                        participant.videoStream?.renderElement ?? null
                    }
                    styles={{ root: { "& video": { borderRadius: "0rem" } } }}
                />
            ) : null,
            showLabel: true,
            showMuteIndicator: true,
            styles: videoTileStyles,
            userId: participant.userId,
        };

        return (
            <div style={videoDivStyle}>
                <VideoTile {...defaultVideoTileProps} />
            </div>
        );
    };

    return getVideoTile(participant);
};

export default RemoteVideoTileComponent;
