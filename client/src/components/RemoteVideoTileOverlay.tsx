// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { VideoGalleryParticipant } from "@azure/communication-react";
import {
    IStackItemStyles,
    IStackTokens,
    IStackStyles,
    ITooltipHostStyles,
    Stack,
    TooltipHost,
} from "@fluentui/react";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import {
    Lock,
    LockOpen,
    Remove,
    Tungsten,
    Videocam,
    VideocamOff,
} from "@mui/icons-material";
import { IconButton as MuiIconButton } from "@mui/material";

import Emoji from "react-emojis";
import { Store } from "react-notifications-component";

import { ReactComponent as Attention } from "@/assets/icons/Attention.svg";
import { ReactComponent as BeInFrame } from "@/assets/icons/BeInFrame.svg";
import { ReactComponent as EasyLanguage } from "@/assets/icons/EasyLanguage.svg";
import { ReactComponent as Repeat } from "@/assets/icons/Repeat.svg";
import { ReactComponent as Slow } from "@/assets/icons/Slow.svg";

import { getParticipantName } from "@/utilities/getParticipantName";
import { getParticipantType } from "@/utilities/getParticipantType";
import { getParticipantTypeColor } from "@/utilities/getParticipantTypeColor";
import { logger } from "@/utilities/logger";
import socket from "@/utilities/socket";
import { getString } from "@/utilities/strings";

import { TranscriptionMessage } from "@/utilities/transcriptionMessage";

import { calloutProps } from "@/styles/calloutProps";
import "@/styles/App.css";

export const RemoteVideoTileOverlay = (
    localParticipant: VideoGalleryParticipant,
    participant: VideoGalleryParticipant,
    // To display icons onHover
    setIsHovering: React.Dispatch<React.SetStateAction<boolean>>,
    isHovering: boolean,
    // Lock Icon
    lockTile: (participantUserId: string) => void,
    toggleIsLocked: () => void,
    isLocked: boolean,
    // Remove Icon
    removeTile: (participantUserId: string) => void,
    // Video Icon
    toggleIsVideoOff: () => void,
    isVideoOff: boolean,
    // Flags to configure video tile overlay
    isRemoteParticipantTile: boolean,
    allowRemoveTile: boolean,
    allowVideoOnOff: boolean,
    setTranscription: React.Dispatch<
        React.SetStateAction<TranscriptionMessage[]>
    >,
    // Show reaction icons
    handRaised?: boolean,
    iUnderstood?: boolean,
    liked?: boolean,
    clapped?: boolean,
): JSX.Element => {
    const appInsights = useAppInsightsContext();
    const componentName = "RemoteVideoTileOverlay";
    let re = /user/gi;
    const participantFirstName = participant.displayName?.split(": ")[1];
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
                getParticipantType(participant),
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
                localUserId: localParticipant.userId,
                participantUserId: participant.userId,
            },
        );
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        appInsights.trackEvent(
            { name: "handleMouseLeave" },
            {
                componentName: componentName,
                localUserId: localParticipant.userId,
                participantUserId: participant.userId,
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
                localUserId: localParticipant.userId,
                participantUserId: participant.userId,
            },
        );
        lockTile(participant.userId);
        toggleIsLocked();
    };

    const removeIconClicked = (): void => {
        removeTile(participant.userId);
        appInsights.trackEvent(
            { name: "removeIconClicked" },
            {
                componentName: componentName,
                localUserId: localParticipant.userId,
                participantUserId: participant.userId,
            },
        );
    };

    const toggleVideo = (): void => {
        logger.log("toggleVideo");
        appInsights.trackEvent(
            { name: "toggleVideo" },
            {
                componentName: componentName,
                localUserId: localParticipant.userId,
                participantUserId: participant.userId,
            },
        );
        toggleIsVideoOff();
    };

    const sendRemoteParticipantSignal = (
        _event: React.MouseEvent<HTMLButtonElement>,
        signalMessage: string,
    ): void => {
        logger.log("sendRemoteParticipantSignal");

        logger.log(
            `From ${localParticipant.displayName} to ${participant.displayName}`,
        );

        let message = {
            fromUserId: localParticipant.userId,
            fromUserName: localParticipant.displayName,
            toUserId: participant.userId,
            signalMessage: signalMessage,
        };
        appInsights.trackEvent(
            { name: "sendRemoteParticipantSignal" },
            {
                componentName: componentName,
                ...message,
            },
        );
        socket.emit("sendMessageToParticipant", message);
        appInsights.trackEvent(
            { name: "socketEmitSendMessageToParticipant" },
            {
                componentName: componentName,
                ...message,
            },
        );
        const transcriptionMessage: TranscriptionMessage = {
            speakerDisplayName: `${
                localParticipant.displayName?.split(" ")[1]
            } (you) to ${participant.displayName?.split(" ")[1]}`,
            speakerParticipantType: localParticipant.displayName?.split(
                ":",
            )[0] as string,
            timestamp: new Date(),
            comments: [
                <span key={1}>[ </span>,
                <span key={2} style={{ fontStyle: "italic" }}>
                    {signalMessage}
                </span>,
                <span key={3}> ]</span>,
            ],
            signalMessage: true,
        };
        setTranscription((oldArray) => [...oldArray, transcriptionMessage]);
        Store.addNotification({
            title: signalMessage,
            message: `Sent to ${participant.displayName?.split(" ")[1]}`,
            type: "info",
            insert: "bottom",
            container: "top-center",
            dismiss: {
                duration: 5000,
                click: true,
                showIcon: true,
            },
        });
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
                                                            participant,
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
                                                            participant,
                                                        ),
                                                    ),
                                                }}
                                            />
                                        </MuiIconButton>
                                    </TooltipHost>
                                )}
                                {allowRemoveTile && (
                                    <TooltipHost
                                        content="Remove the video tile"
                                        calloutProps={calloutProps}
                                        styles={hostStyles}
                                    >
                                        <MuiIconButton
                                            aria-label="Remove the video tile"
                                            onClick={(event) =>
                                                removeIconClicked()
                                            }
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            <Remove
                                                sx={{
                                                    color: getParticipantTypeColor(
                                                        getParticipantType(
                                                            participant,
                                                        ),
                                                    ),
                                                }}
                                            />
                                        </MuiIconButton>
                                    </TooltipHost>
                                )}
                                {allowVideoOnOff &&
                                    (isVideoOff ? (
                                        <TooltipHost
                                            content="Turn on the video"
                                            calloutProps={calloutProps}
                                            styles={hostStyles}
                                        >
                                            <MuiIconButton
                                                aria-label="Turn on the video"
                                                onClick={(event) =>
                                                    toggleVideo()
                                                }
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                sx={sxProps}
                                            >
                                                <VideocamOff
                                                    sx={{
                                                        color: getParticipantTypeColor(
                                                            getParticipantType(
                                                                participant,
                                                            ),
                                                        ),
                                                    }}
                                                />
                                            </MuiIconButton>
                                        </TooltipHost>
                                    ) : (
                                        <TooltipHost
                                            content="Turn off the video"
                                            calloutProps={calloutProps}
                                            styles={hostStyles}
                                        >
                                            <MuiIconButton
                                                aria-label="Turn off the video"
                                                onClick={(event) =>
                                                    toggleVideo()
                                                }
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                sx={sxProps}
                                            >
                                                <Videocam
                                                    sx={{
                                                        color: getParticipantTypeColor(
                                                            getParticipantType(
                                                                participant,
                                                            ),
                                                        ),
                                                    }}
                                                />
                                            </MuiIconButton>
                                        </TooltipHost>
                                    ))}
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

                {/* Horizontal Buttons */}
                {isHovering && isRemoteParticipantTile && (
                    <Stack verticalAlign="end" styles={stackStyles}>
                        <Stack.Item align="end" styles={stackItemStyles}>
                            <TooltipHost
                                content={getString(
                                    "FEEDBACK_ATTENTION",
                                ).replace(re, participantFirstName as string)}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_ATTENTION",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_ATTENTION_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <Attention
                                        fill={getParticipantTypeColor(
                                            getParticipantType(participant),
                                        )}
                                        style={{
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                            <TooltipHost
                                content={getString(
                                    "FEEDBACK_WITHIN_FRAME",
                                ).replace(re, participantFirstName as string)}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_WITHIN_FRAME",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_WITHIN_FRAME_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <BeInFrame
                                        fill={getParticipantTypeColor(
                                            getParticipantType(participant),
                                        )}
                                        style={{
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                            <TooltipHost
                                content={getString(
                                    "FEEDBACK_BACKGROUND",
                                ).replace(re, participantFirstName as string)}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_BACKGROUND",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_BACKGROUND_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <Tungsten
                                        sx={{
                                            color: getParticipantTypeColor(
                                                getParticipantType(participant),
                                            ),
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                            <TooltipHost
                                content={getString(
                                    "FEEDBACK_SPEAK_SLOWLY",
                                ).replace(re, participantFirstName as string)}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_SPEAK_SLOWLY",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_SPEAK_SLOWLY_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <Slow
                                        fill={getParticipantTypeColor(
                                            getParticipantType(participant),
                                        )}
                                        style={{
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                            <TooltipHost
                                content={getString(
                                    "FEEDBACK_EASIER_LANGUAGE",
                                ).replace(re, participantFirstName as string)}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_EASIER_LANGUAGE",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_EASIER_LANGUAGE_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <EasyLanguage
                                        fill={getParticipantTypeColor(
                                            getParticipantType(participant),
                                        )}
                                        style={{
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                            <TooltipHost
                                content={getString("FEEDBACK_REPEAT").replace(
                                    re,
                                    participantFirstName as string,
                                )}
                                calloutProps={calloutProps}
                                styles={hostStyles}
                            >
                                <MuiIconButton
                                    aria-label={getString(
                                        "FEEDBACK_REPEAT",
                                    ).replace(
                                        re,
                                        participantFirstName as string,
                                    )}
                                    onClick={(event) =>
                                        sendRemoteParticipantSignal(
                                            event,
                                            getString(
                                                "FEEDBACK_REPEAT_MESSAGE",
                                            ),
                                        )
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                    sx={sxProps}
                                >
                                    <Repeat
                                        fill={getParticipantTypeColor(
                                            getParticipantType(participant),
                                        )}
                                        style={{
                                            fontSize: "20px",
                                        }}
                                    />
                                </MuiIconButton>
                            </TooltipHost>
                        </Stack.Item>
                    </Stack>
                )}
            </Stack>
        </div>
    );
};
