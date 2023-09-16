// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    StreamMedia,
    VideoGalleryLocalParticipant,
    VideoTile,
    VideoTileProps,
    VideoTileStylesProps,
} from "@azure/communication-react";
import {
    IStackItemStyles,
    IStackStyles,
    IStackTokens,
    ITooltipHostStyles,
    Stack,
    TooltipHost,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { Lock, LockOpen, Remove } from "@mui/icons-material";
import { IconButton as MuiIconButton } from "@mui/material";
import { useState } from "react";
import Emoji from "react-emojis";

import { getParticipantType } from "@/utilities/getParticipantType";
import { getParticipantTypeColor } from "@/utilities/getParticipantTypeColor";
import { logger } from "@/utilities/logger";
import {
    onRenderPlaceholderDHH,
    onRenderPlaceholderHearing,
    onRenderPlaceholderInterpreter,
} from "@/utilities/onRenderPlaceholders";
import { getString } from "@/utilities/strings";

import { calloutProps } from "@/styles/calloutProps";
import "@/styles/App.css";

interface LocalVideoTileComponentProps {
    localParticipant: VideoGalleryLocalParticipant;
    lockTile: (participantUserId: string) => void;
    removeTile: (participantUserId: string) => void;
    // videoOn is controlled by onToggleCamera callback in Layout
    videoOn: boolean;
    localPreviewHTML: HTMLElement | null;
    // Show reaction icons
    handRaised?: boolean;
    iUnderstood?: boolean;
    liked?: boolean;
    clapped?: boolean;
    // Show border on overlay if participant is speaking
    speaking?: boolean;
}

const LocalVideoTileComponent = (
    props: LocalVideoTileComponentProps,
): JSX.Element => {
    // Props
    const {
        localParticipant,
        lockTile,
        removeTile,
        videoOn,
        localPreviewHTML,
        handRaised,
        iUnderstood,
        liked,
        clapped,
        speaking,
    } = props;

    const [isHovering, setIsHovering] = useState(false);
    // Lock/Unlock Icon on video overlay
    const [isLocked, { toggle: toggleIsLocked }] = useBoolean(false);

    const localVideoTileOverLay = LocalVideoTileOverlay(
        localParticipant,
        setIsHovering,
        isHovering,
        // Lock/Unlock Icon
        lockTile,
        toggleIsLocked,
        isLocked,
        // Remove tile icon
        removeTile,
        // Flags to display emojis on video frames
        handRaised,
        iUnderstood,
        liked,
        clapped,
    );

    const getVideoTile = (participant: VideoGalleryLocalParticipant) => {
        const participantType = getParticipantType(participant);
        const displayName =
            participantType === getString("INTERPRETER_PARTICIPANT_TYPE")
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
                color: "white",
                backgroundColor: getParticipantTypeColor(participantType),
                borderRadius: "4px",
            },
        };

        const defaultVideoTileProps: VideoTileProps = {
            children: localVideoTileOverLay,
            displayName: `(You) ${displayName}`,
            isMuted: participant.isMuted,
            onRenderPlaceholder:
                participantType === getString("HEARING_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderHearing
                    : participantType === getString("DHH_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderDHH
                    : onRenderPlaceholderInterpreter,
            renderElement: videoOn ? (
                participant.videoStream?.isAvailable ? (
                    <StreamMedia videoStreamElement={localPreviewHTML} />
                ) : null
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

    return getVideoTile(localParticipant);
};

const LocalVideoTileOverlay = (
    localParticipant: VideoGalleryLocalParticipant,
    // To display icons onHover
    setIsHovering: React.Dispatch<React.SetStateAction<boolean>>,
    isHovering: boolean,
    // Lock Icon
    lockTile: (participantUserId: string) => void,
    toggleIsLocked: () => void,
    isLocked: boolean,
    // Remove Icon
    removeTile: (participantUserId: string) => void,

    // Show reaction icons
    handRaised?: boolean,
    iUnderstood?: boolean,
    liked?: boolean,
    clapped?: boolean,
): JSX.Element => {
    const appInsights = useAppInsightsContext();
    const componentName = "LocalVideoTileOverlay";
    const overlayContainer = {
        width: "100%",
        height: "100%",
    };

    const stackStyles: IStackStyles = {
        root: {
            width: "100%",
            height: "100%",
        },
    };
    const outerStackTokens: IStackTokens = { padding: "10px" };

    const stackItemStyles: IStackItemStyles = {
        root: {
            alignItems: "center",
            backgroundColor: "white",
            //boxShadow: `0px 0px 10px 5px ${DefaultPalette.themeLight}`,
            boxShadow: `0px 0px 2px 1px ${getParticipantTypeColor(
                getParticipantType(localParticipant),
            )}`,
            borderRadius: "20px",
            display: "flex",
            justifyContent: "center",
        },
    };

    // The TooltipHost root uses display: inline by default.
    // If that's causing sizing issues or tooltip positioning issues, try overriding to inline-block.
    const hostStyles: Partial<ITooltipHostStyles> = {
        root: { display: "inline-block" },
    };
    const sxProps = { "&:hover": { backgroundColor: "#eaeaea" } };

    const handleMouseOver = () => {
        appInsights.trackEvent(
            { name: "handleMouseOver" },
            {
                componentName: componentName,
                localParticipantUserId: localParticipant.userId,
            },
        );
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        appInsights.trackEvent(
            { name: "handleMouseLeave" },
            {
                componentName: componentName,
                localParticipantUserId: localParticipant.userId,
            },
        );
        setIsHovering(false);
    };

    const toggleLock = (): void => {
        logger.log("toggleLock");
        appInsights.trackEvent(
            { name: "toggleLock" },
            {
                componentName: componentName,
                localParticipantUserId: localParticipant.userId,
            },
        );
        lockTile(localParticipant.userId);
        toggleIsLocked();
    };

    const removeIconClicked = (): void => {
        appInsights.trackEvent(
            { name: "removeIconClicked" },
            {
                componentName: componentName,
                localParticipantUserId: localParticipant.userId,
            },
        );
        removeTile(localParticipant.userId);
    };

    return (
        <div
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseLeave}
            style={overlayContainer}
        >
            <Stack styles={stackStyles} tokens={outerStackTokens}>
                {/* Lock, remove, and video on/off button with reaction emoji icons */}
                <Stack verticalAlign="start" styles={stackStyles}>
                    <Stack horizontal horizontalAlign="space-between">
                        {isHovering && (
                            <Stack.Item styles={stackItemStyles}>
                                {isLocked ? (
                                    <TooltipHost
                                        content="Unlock the video tile"
                                        calloutProps={calloutProps}
                                        styles={hostStyles}
                                    >
                                        <MuiIconButton
                                            aria-label="Unlock the video tile"
                                            onClick={(event) => toggleLock()}
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                            sx={sxProps}
                                        >
                                            <Lock
                                                sx={{
                                                    color: getParticipantTypeColor(
                                                        getParticipantType(
                                                            localParticipant,
                                                        ),
                                                    ),
                                                }}
                                            />
                                        </MuiIconButton>
                                    </TooltipHost>
                                ) : (
                                    <TooltipHost
                                        content="Lock the video tile"
                                        calloutProps={calloutProps}
                                        styles={hostStyles}
                                    >
                                        <MuiIconButton
                                            aria-label="Lock the video tile"
                                            onClick={(event) => toggleLock()}
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                            sx={sxProps}
                                        >
                                            <LockOpen
                                                sx={{
                                                    color: getParticipantTypeColor(
                                                        getParticipantType(
                                                            localParticipant,
                                                        ),
                                                    ),
                                                }}
                                            />
                                        </MuiIconButton>
                                    </TooltipHost>
                                )}
                                <TooltipHost
                                    content="Remove the video tile"
                                    calloutProps={calloutProps}
                                    styles={hostStyles}
                                >
                                    <MuiIconButton
                                        aria-label="Remove the video tile"
                                        onClick={(event) => removeIconClicked()}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        <Remove
                                            sx={{
                                                color: getParticipantTypeColor(
                                                    getParticipantType(
                                                        localParticipant,
                                                    ),
                                                ),
                                            }}
                                        />
                                    </MuiIconButton>
                                </TooltipHost>
                            </Stack.Item>
                        )}
                        <Stack.Item>
                            {handRaised && (
                                <span style={{ fontSize: 32 }}>
                                    <Emoji emoji="raised-hand" />
                                </span>
                            )}
                            {iUnderstood && (
                                <span style={{ fontSize: 32 }}>
                                    <Emoji emoji="ok-hand" />
                                </span>
                            )}
                            {liked && (
                                <span style={{ fontSize: 32 }}>
                                    <Emoji emoji="thumbs-up" />
                                </span>
                            )}
                            {clapped && (
                                <span style={{ fontSize: 32 }}>
                                    <Emoji emoji="clapping-hands" />
                                </span>
                            )}
                        </Stack.Item>
                    </Stack>
                </Stack>
            </Stack>
        </div>
    );
};

export default LocalVideoTileComponent;
