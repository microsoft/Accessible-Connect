// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    StreamMedia,
    VideoGalleryRemoteParticipant,
    VideoTile,
    VideoTileProps,
    VideoTileStylesProps,
} from "@azure/communication-react";

import { useBoolean } from "@fluentui/react-hooks";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { useState } from "react";

import {
    IStackItemStyles,
    IStackTokens,
    IStackStyles,
    ITooltipHostStyles,
    Stack,
    TooltipHost,
} from "@fluentui/react";

import { Lock, LockOpen } from "@mui/icons-material";
import { IconButton as MuiIconButton } from "@mui/material";

import { getParticipantType } from "@/utilities/getParticipantType";
import { getParticipantTypeColor } from "@/utilities/getParticipantTypeColor";
import { logger } from "@/utilities/logger";
import {
    onRenderPlaceholderDHH,
    onRenderPlaceholderHearing,
    onRenderPlaceholderInterpreter,
} from "@/utilities/onRenderPlaceholders";
import { getString } from "@/utilities/strings";

import "@/styles/App.css";

interface ScreenShareVideoTileProps {
    screenShareParticipant: VideoGalleryRemoteParticipant;
    lockTile: (participantUserId: string) => void;
}

const ScreenShareVideoTileComponent = (
    props: ScreenShareVideoTileProps,
): JSX.Element => {
    // Props
    const { screenShareParticipant, lockTile } = props;

    const [isHovering, setIsHovering] = useState(false);
    // Lock/Unlock Icon on video overlay
    const [isLocked, { toggle: toggleIsLocked }] = useBoolean(false);

    const videoTileOverLay = ScreenShareVideoTileOverlay(
        screenShareParticipant,
        setIsHovering,
        isHovering,
        // Lock/Unlock Icon
        lockTile,
        toggleIsLocked,
        isLocked,
    );

    const getVideoTile = (participant: VideoGalleryRemoteParticipant) => {
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
            root: { padding: "0px" },
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
            children: videoTileOverLay,
            displayName: `(Screen Share) ${displayName}`,
            isMuted: participant.isMuted,
            onRenderPlaceholder:
                participantType === getString("HEARING_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderHearing
                    : participantType === getString("DHH_PARTICIPANT_TYPE")
                    ? onRenderPlaceholderDHH
                    : onRenderPlaceholderInterpreter,
            renderElement: (
                <StreamMedia
                    videoStreamElement={
                        participant.screenShareStream?.renderElement ?? null
                    }
                />
            ),
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

    return getVideoTile(screenShareParticipant);
};

const ScreenShareVideoTileOverlay = (
    screenShareParticipant: VideoGalleryRemoteParticipant,
    // To display icons onHover
    setIsHovering: React.Dispatch<React.SetStateAction<boolean>>,
    isHovering: boolean,
    // Lock Icon
    lockTile: (participantUserId: string) => void,
    toggleIsLocked: () => void,
    isLocked: boolean,
): JSX.Element => {
    const appInsights = useAppInsightsContext();
    const componentName = "ScreenShareVideoTileOverlay";
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
    const outerStackTokens: IStackTokens = { padding: "5px" };

    const stackItemStyles: IStackItemStyles = {
        root: {
            alignItems: "center",
            backgroundColor: "white",
            //boxShadow: `0px 0px 10px 5px ${DefaultPalette.themeLight}`,
            boxShadow: `0px 0px 2px 1px ${getParticipantTypeColor(
                getParticipantType(screenShareParticipant),
            )}`,
            borderRadius: "20px",
            display: "flex",
            justifyContent: "center",
        },
    };

    const calloutProps = { gapSpace: 0 };
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
                screenShareParticipantUserId: screenShareParticipant.userId,
            },
        );
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        appInsights.trackEvent(
            { name: "handleMouseLeave" },
            {
                componentName: componentName,
                screenShareParticipantUserId: screenShareParticipant.userId,
            },
        );
        setIsHovering(false);
    };

    const toggleLock = (): void => {
        logger.log("toggleLock");

        lockTile("SS:" + screenShareParticipant.userId);
        appInsights.trackEvent(
            { name: "toggleLock" },
            {
                componentName: componentName,
                screenShareParticipant: screenShareParticipant.userId,
            },
        );
        toggleIsLocked();
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
                                                            screenShareParticipant,
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
                                                            screenShareParticipant,
                                                        ),
                                                    ),
                                                }}
                                            />
                                        </MuiIconButton>
                                    </TooltipHost>
                                )}
                            </Stack.Item>
                        )}
                    </Stack>
                </Stack>
            </Stack>
        </div>
    );
};

export default ScreenShareVideoTileComponent;
