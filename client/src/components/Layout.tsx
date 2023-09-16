// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    CaptionsInfo,
    DeviceManager,
    Features,
    LocalVideoStream,
    VideoDeviceInfo,
    VideoStreamRenderer,
} from "@azure/communication-calling";
import {
    usePropsFor,
    useCall,
    useChatClient,
    useChatThreadClient,
    CameraButton,
    EndCallButton,
    MessageThread,
    MessageThreadStyles,
    MicrophoneButton,
    ParticipantItem,
    ParticipantItemProps,
    SendBox,
    ScreenShareButton,
    VideoGallery,
    VideoGalleryLocalParticipant,
    VideoGalleryRemoteParticipant,
    VideoStreamOptions,
    VideoGalleryParticipant,
} from "@azure/communication-react";
import delay from "delay";
import {
    mergeStyles,
    IStackTokens,
    IStackItemStyles,
    IStackStyles,
    ITooltipHostStyles,
    Stack,
    TooltipHost,
} from "@fluentui/react";
import _ from "lodash";
import * as cam from "@mediapipe/camera_utils";
import { Holistic, Results } from "@mediapipe/holistic";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import {
    AdminPanelSettings,
    Hearing,
    HearingDisabled,
    Settings,
    SignLanguage,
    Videocam,
    VideocamOff,
    Wifi,
    WifiOff,
} from "@mui/icons-material";

import AddIcon from "@mui/icons-material/Add";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import MicOffIcon from "@mui/icons-material/MicOff";
import PanToolIcon from "@mui/icons-material/PanTool";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";

import {
    Badge,
    Box,
    Button,
    IconButton,
    Switch,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import Emoji from "react-emojis";
import { Store } from "react-notifications-component";
import { Rnd } from "react-rnd";
import useState from "react-usestateref";
import softmax from "softmax-fn";
import * as tf from "@tensorflow/tfjs";

// Components
import { CallEnded } from "@/components/CallEnded";
import { CircularProgressWithLabel } from "@/components/CircularProgressWithLabel";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import LocalVideoTileComponent from "@/components/LocalVideoTileComponent";
import RemoteVideoTileComponent from "@/components/RemoteVideoTileComponent";
import ScreenShareVideoTileComponent from "@/components/ScreenShareVideoTileComponent";

// Utilities
import { logger } from "@/utilities/logger";
import { processHolisticResults } from "@/utilities/processHolisticResults";
import { renderSubtitle } from "@/utilities/renderSubtitle";
import { renderTranscription } from "@/utilities/renderTranscription";
import socket from "@/utilities/socket";
import { getString } from "@/utilities/strings";
import { TranscriptionMessage } from "@/utilities/transcriptionMessage";

import { ParticipantConfig } from "shared/interfaces";

import { calloutProps } from "@/styles/calloutProps";
import "@/styles/react-grid-layout/styles.css";
import "@/styles/react-resizable/styles.css";
import "@/styles/App.css";
import { getParticipantType } from "@/utilities/getParticipantType";

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface LayoutProps {
    participantConfig: ParticipantConfig;
    // Navigation Bar
    deviceManager: DeviceManager | undefined;
    switchCamera: (newCamera: VideoDeviceInfo) => void;
    isConfigurationPanelOpen: boolean;
    showConfigurationPanel: () => void;
    dismissConfigurationPanel: () => void;

    localVideoStream: LocalVideoStream | undefined;
    socketConnectionStatus: string;
}

const Layout = (props: LayoutProps): JSX.Element => {
    const appInsights = useAppInsightsContext();
    const componentName = "Layout";
    // Props
    const {
        participantConfig,
        deviceManager,
        switchCamera,
        isConfigurationPanelOpen,
        showConfigurationPanel,
        dismissConfigurationPanel,
        localVideoStream,
        socketConnectionStatus,
    } = props;

    const [tabStackItemHeight, setTabStackItemHeight] = useState<
        number | undefined
    >();

    const [tabValue, setTabValue] = React.useState(0);
    const [chatBadgeInvisible, setChatBadgeInvisible] = React.useState(true);
    useEffect(() => {
        logger.log(
            "tabStackItem height: ",
            document.getElementById("tabStackItem")?.clientHeight,
        );
        setTabStackItemHeight(
            document.getElementById("tabStackItem")?.clientHeight,
        );
    }, []);

    const handleTabChange = (
        event: React.SyntheticEvent,
        newTabValue: number,
    ) => {
        logger.log(
            { name: "handleTabChange" },
            {
                tabValue: newTabValue,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        appInsights.trackEvent(
            { name: "handleTabChange" },
            {
                tabValue: newTabValue,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        setTabValue(newTabValue);
        // If clicked on "Chat"
        if (newTabValue === 1) {
            setChatBadgeInvisible((v) => true);
        } else if (newTabValue === 2) {
            setTimeout(() => scrollTranscriptionsToBottom(), 1000);
        }
    };

    // ACS Props
    const call = useCall();

    // This hook will get stateful client you created
    const chatThreadClient = useChatThreadClient();
    const chatClient = useChatClient();

    useEffect(() => {
        if (chatClient !== undefined) {
            chatClient.on("chatMessageReceived", (e) => {
                logger.log("Notification chatMessageReceived!");
                setChatBadgeInvisible((v) => false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const videoGalleryProps = usePropsFor(VideoGallery);
    const localParticipant: VideoGalleryLocalParticipant =
        videoGalleryProps.localParticipant;
    const remoteParticipants: VideoGalleryRemoteParticipant[] =
        videoGalleryProps.remoteParticipants;

    // Fit remote video streams
    videoGalleryProps.remoteParticipants.forEach((participant) => {
        videoGalleryProps.onCreateRemoteStreamView(participant.userId, {
            scalingMode: "Fit",
        });
    });

    useEffect(() => {
        if (call !== undefined) {
            call.on("remoteParticipantsUpdated", (e) => {
                logger.log(e.added);
                logger.log(e.removed);
                e.removed.forEach((remoteParticipant) => {
                    appInsights.trackEvent(
                        { name: "remoteParticipantLeft" },
                        {
                            userId: remoteParticipant.identifier[
                                "communicationUserId"
                            ],
                            componentName: componentName,
                            sessionId: participantConfig.sessionId,
                        },
                    );
                    videoGalleryProps.onDisposeRemoteStreamView(
                        remoteParticipant.identifier["communicationUserId"],
                    );
                });
            });
        }
    }, []);

    const microphoneProps = usePropsFor(MicrophoneButton);
    const screenShareProps = usePropsFor(ScreenShareButton);
    const endCallProps = usePropsFor(EndCallButton);
    const cameraProps = usePropsFor(CameraButton);

    const messageThreadProps = usePropsFor(MessageThread);
    //logger.log(messageThreadProps);
    const sendBoxProps = usePropsFor(SendBox);

    // States
    // Initialize gridItems with localParticipant
    const [gridItems, setGridItems, gridItemsRef] = useState<any[]>([
        {
            ...localParticipant,
            x: 0,
            y: Infinity,
            w: 3,
            h: 5,
            minH: 5,
            minW: 3,
            i: localParticipant.userId,
            static: false,
        },
    ]);
    const [removedGridItems, setRemovedGridItems, removedGridItemsRef] =
        useState<any>([]);

    const [callEnded, setCallEnded] = useState(false);
    const [localPreviewHTML, setLocalPreviewHTML] =
        useState<HTMLElement | null>(null);
    // Video is kept on when the call starts.
    const [streamRenderer, setStreamRenderer] = useState<VideoStreamRenderer>();
    const [videoOn, setVideoOn, videoOnRef] = useState(false);

    // Styles
    const tabSxProps = {
        "&:hover": { backgroundColor: "#424242" },
        color: "#c8c8c8",
        padding: "15px",
    };

    // Tokens definition
    const outerStackTokens: IStackTokens = { childrenGap: 0 };

    const stackStyles: IStackStyles = {
        root: [
            {
                height: "100vh",
                marginLeft: 5,
                marginRight: 5,
            },
        ],
    };

    // The TooltipHost root uses display: inline by default.
    // If that's causing sizing issues or tooltip positioning issues, try overriding to inline-block.
    const hostStyles: Partial<ITooltipHostStyles> = {
        root: {
            display: "inline-block",
        },
    };

    const messageThreadStyles: MessageThreadStyles = {
        chatContainer: {
            marginTop: "0px",
        },
        chatMessageContainer: {
            marginTop: "0px",
        },
        systemMessageContainer: {
            marginTop: "0px",
        },
    };

    const navBarStackItemStyles: IStackItemStyles = {
        root: {
            alignItems: "center",
        },
    };

    const navBarStackItemStylesLeft: IStackItemStyles = {
        root: {
            alignItems: "center",
            borderLeft: "1px solid #383735",
            borderRight: "1px solid #383735",
            paddingRight: "10px",
            paddingLeft: "10px",
        },
    };

    useEffect(() => {
        logger.log("useEffect: `remoteParticipants.length` changed");
        const numberRemoteParticipants = remoteParticipants.length;

        const addedParticipants = _.differenceBy(
            remoteParticipants,
            gridItemsRef.current,
            "userId",
        );

        appInsights.trackEvent(
            { name: "remoteParticipantsLengthChanged" },
            {
                length: numberRemoteParticipants,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        for (let participant of addedParticipants) {
            logger.log(participant);

            // Add participant to gridItems
            setGridItems((current) => [
                ...current,
                {
                    ...participant,
                    x: (numberRemoteParticipants * 3) % 12,
                    y: Infinity,
                    w: 3,
                    h: 5,
                    minH: 5,
                    minW: 3,
                    i: participant.userId,
                    static: false,
                },
            ]);
        }
        // We don't need to explicitly remove the participant here because setGridItems is called in onLayoutChange, which implicitly removes the participants that left.

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remoteParticipants.length]);

    useEffect(() => {
        logger.log(
            "useEffect: `videoGalleryProps.screenShareParticipant` changed",
        );
        if (videoGalleryProps.screenShareParticipant !== undefined) {
            logger.log("screeenshare on");
            appInsights.trackEvent(
                { name: "screenShareOn" },
                {
                    userId: videoGalleryProps.screenShareParticipant?.userId,
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
            // Add participant to gridItems
            setGridItems((current) => [
                ...current,
                {
                    ...videoGalleryProps.screenShareParticipant,
                    userId:
                        "SS:" +
                        videoGalleryProps.screenShareParticipant?.userId,
                    //x: (remoteParticipants.length * 3) % 12,
                    x: 0,
                    y: Infinity,
                    //y: 0,
                    w: 4,
                    h: 6,
                    minH: 5,
                    minW: 3,
                    i: "SS:" + videoGalleryProps.screenShareParticipant?.userId,
                    static: false,
                },
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoGalleryProps.screenShareParticipant]);

    /*
		Captions
	*/
    const transcriptionsEndRef = useRef<null | HTMLDivElement>(null);
    const subtitlesEndRef = useRef<null | HTMLDivElement>(null);
    const [transcriptions, setTranscription] = useState<TranscriptionMessage[]>(
        [],
    );
    const scrollTranscriptionsToBottom = () => {
        transcriptionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const scrollSubtitlesToBottom = () => {
        subtitlesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollSubtitlesToBottom();
    }, [transcriptions]);
    useEffect(() => {
        scrollTranscriptionsToBottom();
    }, [transcriptions]);

    const captionsHandler = (data: CaptionsInfo) => {
        if (data.resultType === 1) {
            logger.log("Captions Handler Called");
            const transcriptionMessage: TranscriptionMessage = {
                speakerDisplayName: data.speaker.displayName?.split(
                    " ",
                )[1] as string,
                speakerParticipantType: data.speaker.displayName?.split(
                    ":",
                )[0] as string,
                timestamp: data.timestamp,
                comments: data.text,
                signalMessage: false,
            };
            appInsights.trackEvent(
                { name: "captionsHandler" },
                {
                    ...transcriptionMessage,
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
            setTranscription((oldArray) => [...oldArray, transcriptionMessage]);
        }
    };
    const startCaptions = async () => {
        const callCaptionsFeature = call?.feature(Features.Captions);
        callCaptionsFeature?.on("captionsReceived", captionsHandler);
        await callCaptionsFeature?.startCaptions({ language: "en-us" });
    };
    useEffect(() => {
        logger.log("Start Captions");
        startCaptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Change these carefully. "Other" code depends on this.
    const classifications: string[] = ["Hand Raise", "Ok", "Like", "Clap"];
    const signalCodeToEmoji = {
        0: <Emoji emoji="raised-hand" />,
        1: <Emoji emoji="ok-hand" sx={{ fontSize: 25 }} />,
        2: <Emoji emoji="thumbs-up" />,
        3: <Emoji emoji="clapping-hands" />,
        4: <Emoji emoji="raised-hand" />, // For lower hand
    };

    const signalCodeToMessage = {
        0: "Raise Hand",
        1: "Ok",
        2: "Like",
        3: "Clap",
        4: "Lower Hand",
    };

    // handRaised: (1) To make sure we are not classifying frames when hand is raised, and (2) display `Lower Hand` button
    const [handRaised, setHandRaised] = useState(false);
    const [handRaisedParticipantQ, setHandRaisedParticipantQ] = useState<any>(
        [],
    );
    const [iUnderstoodParticipantQ, setIUnderstoodParticipantQ] = useState<any>(
        [],
    );
    const [likedParticipantQ, setLikedParticipantQ] = useState<any>([]);
    const [clappedParticipantQ, setClappedParticipantQ] = useState<any>([]);
    const [speakingParticipantQ, setSpeakingParticipantQ] = useState<any>([]);

    /*
		Socket Connections
	*/
    useEffect(() => {
        socket.on("messageReceivedFromParticipant", (arg) => {
            logger.log("Socket: Message received from Participant.");
            appInsights.trackEvent(
                { name: "socketMessageReceivedFromParticipant" },
                {
                    ...arg,
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );

            const transcriptionMessage: TranscriptionMessage = {
                speakerDisplayName: `${arg.fromUserName.split(" ")[1]} to You`,
                speakerParticipantType: arg.fromUserName.split(
                    ":",
                )[0] as string,
                timestamp: new Date(),
                comments: [
                    <span key={1}>[ </span>,
                    <span key={2} style={{ fontStyle: "italic" }}>
                        {arg.signalMessage}
                    </span>,
                    <span key={3}> ]</span>,
                ],
                signalMessage: true,
            };

            setTranscription((oldArray) => [...oldArray, transcriptionMessage]);
            Store.addNotification({
                title: arg.signalMessage,
                message: `From ${arg.fromUserName.split(" ")[1]}`,
                type: "info",
                insert: "bottom",
                container: "top-center",
                dismiss: {
                    duration: 0,
                    click: true,
                    pauseOnHover: true,
                    showIcon: true,
                },
            });
        });

        socket.on("broadcastMessageServer", (arg) => {
            logger.log("Socket: Broadcast Message received from Server.");
            const dt = new Date();
            appInsights.trackEvent(
                { name: "socketBroadcastMessageServer" },
                {
                    ...arg,
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );

            // If arg.signalCode is 0, then add participant to handRaisedParticipantQ
            if (arg.signalCode === 0) {
                setHandRaisedParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: arg.fromUserId,
                        timeStamp: dt,
                    },
                ]);
            }
            // Ok, originally "I Understand"
            else if (arg.signalCode === 1) {
                setIUnderstoodParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: arg.fromUserId,
                        timeStamp: dt,
                    },
                ]);
                // Remove participant icon from video tile after 10 seconds
                setTimeout(
                    () =>
                        setIUnderstoodParticipantQ((current) =>
                            current.filter((obj) => {
                                return obj.participantUserId !== arg.fromUserId;
                            }),
                        ),
                    timeBuffer * 1000,
                );
            }
            // Like
            else if (arg.signalCode === 2) {
                setLikedParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: arg.fromUserId,
                        timeStamp: dt,
                    },
                ]);
                // Remove participant icon from video tile after 10 seconds
                setTimeout(
                    () =>
                        setLikedParticipantQ((current) =>
                            current.filter((obj) => {
                                return obj.participantUserId !== arg.fromUserId;
                            }),
                        ),
                    timeBuffer * 1000,
                );
            }
            // Clap
            else if (arg.signalCode === 3) {
                setClappedParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: arg.fromUserId,
                        timeStamp: dt,
                    },
                ]);
                // Remove participant icon from video tile after 10 seconds
                setTimeout(
                    () =>
                        setClappedParticipantQ((current) =>
                            current.filter((obj) => {
                                return obj.participantUserId !== arg.fromUserId;
                            }),
                        ),
                    timeBuffer * 1000,
                );
            }
            // If arg.signalCode is 4, then remove participant from handRaisedParticipantQ
            else if (arg.signalCode === 4) {
                setHandRaisedParticipantQ((current) =>
                    current.filter((obj) => {
                        return obj.participantUserId !== arg.fromUserId;
                    }),
                );
            }

            const transcriptionMessage: TranscriptionMessage = {
                speakerDisplayName: arg.fromUserName.split(" ")[1],
                speakerParticipantType: arg.fromUserName.split(
                    ":",
                )[0] as string,
                timestamp: dt,
                comments: [
                    <span key={1}>[ </span>,
                    <span key={2} style={{ fontStyle: "italic" }}>
                        {signalCodeToMessage[arg.signalCode]}{" "}
                    </span>,
                    <span key={3} style={{ fontSize: "18px" }}>
                        {signalCodeToEmoji[arg.signalCode]}
                    </span>,
                    <span key={4}> ]</span>,
                ],
                signalMessage: true,
            };
            setTranscription((oldArray) => [...oldArray, transcriptionMessage]);
        });
        socket.on("broadcastSpeakingMessageServer", (arg) => {
            logger.log(
                "Socket: Broadcast Speaking Message received from Server.",
            );
            appInsights.trackEvent(
                { name: "broadcastSpeakingMessageServer" },
                {
                    ...arg,
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
            logger.log(arg);
            const dt = new Date();
            if (arg.speaking === true) {
                setSpeakingParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: arg.speakingUserId,
                    },
                ]);

                const transcriptionMessage: TranscriptionMessage = {
                    speakerDisplayName: arg.speakingDisplayName.split(" ")[1],
                    speakerParticipantType: arg.speakingDisplayName.split(
                        ":",
                    )[0] as string,
                    timestamp: dt,
                    comments: [
                        <span key={1}>[ </span>,
                        <span key={2} style={{ fontStyle: "italic" }}>
                            Started signing
                        </span>,
                        <span key={3}> ]</span>,
                    ],
                    signalMessage: true,
                };
                setTranscription((oldArray) => [
                    ...oldArray,
                    transcriptionMessage,
                ]);
            } else if (arg.speaking === false) {
                setSpeakingParticipantQ((current) =>
                    current.filter((obj) => {
                        return obj.participantUserId !== arg.speakingUserId;
                    }),
                );
                const transcriptionMessage: TranscriptionMessage = {
                    speakerDisplayName: arg.speakingDisplayName.split(" ")[1],
                    speakerParticipantType: arg.speakingDisplayName.split(
                        ":",
                    )[0] as string,
                    timestamp: dt,
                    comments: [
                        <span key={1}>[ </span>,
                        <span key={2} style={{ fontStyle: "italic" }}>
                            Stopped signing
                        </span>,
                        <span key={3}> ]</span>,
                    ],
                    signalMessage: true,
                };
                setTranscription((oldArray) => [
                    ...oldArray,
                    transcriptionMessage,
                ]);
            }
        });
    }, []);

    const broadcastSignalMessage = (
        signalMessage: string,
        signalCode: number,
        _event?: React.MouseEvent<HTMLButtonElement>,
    ): void => {
        logger.log("Socket: broadcastSignalMessage");
        logger.log(`${signalMessage}`);
        appInsights.trackEvent(
            { name: "socketBroadcastSignalMessage" },
            {
                signalMessage: signalMessage,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        const dt = new Date();
        // If arg.signalCode is 0, then add local participant to handRaisedParticipantQ
        if (signalCode === 0) {
            setHandRaised((v) => true);
            setHandRaisedParticipantQ((current) => [
                ...current,
                {
                    participantUserId: localParticipant.userId,
                    timeStamp: dt,
                },
            ]);
        }
        // Ok, originally I Understand
        else if (signalCode === 1) {
            setIUnderstoodParticipantQ((current) => [
                ...current,
                {
                    participantUserId: localParticipant.userId,
                    timeStamp: dt,
                },
            ]);
            // Remove participant icon from video tile after 10 seconds
            setTimeout(
                () =>
                    setIUnderstoodParticipantQ((current) =>
                        current.filter((obj) => {
                            return (
                                obj.participantUserId !==
                                localParticipant.userId
                            );
                        }),
                    ),
                timeBuffer * 1000,
            );
        }
        // Like
        else if (signalCode === 2) {
            setLikedParticipantQ((current) => [
                ...current,
                {
                    participantUserId: localParticipant.userId,
                    timeStamp: dt,
                },
            ]);
            // Remove participant icon from video tile after 10 seconds
            setTimeout(
                () =>
                    setLikedParticipantQ((current) =>
                        current.filter((obj) => {
                            return (
                                obj.participantUserId !==
                                localParticipant.userId
                            );
                        }),
                    ),
                timeBuffer * 1000,
            );
        }
        // Clap
        else if (signalCode === 3) {
            setClappedParticipantQ((current) => [
                ...current,
                {
                    participantUserId: localParticipant.userId,
                    timeStamp: dt,
                },
            ]);
            // Remove participant icon from video tile after 10 seconds
            setTimeout(
                () =>
                    setClappedParticipantQ((current) =>
                        current.filter((obj) => {
                            return (
                                obj.participantUserId !==
                                localParticipant.userId
                            );
                        }),
                    ),
                timeBuffer * 1000,
            );
        }
        // If arg.signalCode is 4, then remove local participant from handRaisedParticipantQ and lower hand raise
        else if (signalCode === 4) {
            setHandRaised((v) => false);
            setHandRaisedParticipantQ((current) =>
                current.filter((obj) => {
                    return obj.participantUserId !== localParticipant.userId;
                }),
            );
        }

        let message = {
            fromUserId: localParticipant.userId,
            fromUserName: localParticipant.displayName,
            sessionId: participantConfig.sessionId,
            signalMessage: signalMessage,
            signalCode: signalCode,
        };
        socket.emit("broadcastMessage", message);
        appInsights.trackEvent(
            { name: "socketEmitBroadcastMessage" },
            {
                ...message,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        const transcriptionMessage: TranscriptionMessage = {
            speakerDisplayName: `${
                localParticipant.displayName?.split(" ")[1]
            } (you)`,
            speakerParticipantType: participantConfig.participantType as string,
            timestamp: dt,
            comments: [
                <span key={1}>[ </span>,
                <span key={2} style={{ fontStyle: "italic" }}>
                    {signalCodeToMessage[signalCode]}{" "}
                </span>,
                <span key={3} style={{ fontSize: "18px" }}>
                    {signalCodeToEmoji[signalCode]}
                </span>,
                <span key={4}> ]</span>,
            ],
            signalMessage: true,
        };
        setTranscription((oldArray) => [...oldArray, transcriptionMessage]);
    };

    /* 
		AI Gesture Recognition
	*/
    // gestureRecognizer is used to disable AI recognition for a specific timeout.
    const [gestureRecognizier, setGestureRecognizer, gestureRecognizierRef] =
        useState(true);
    const [enableAIGesture, setEnableAIGesture, enableAIGestureRef] =
        useState(false);
    useEffect(() => {
        logger.log(
            { name: "toggleAIGesture" },
            {
                enableAIGesture: enableAIGestureRef.current,
                componentName: componentName,
            },
        );
        appInsights.trackEvent(
            { name: "toggleAIGesture" },
            {
                enableAIGesture: enableAIGestureRef.current,
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
    }, [enableAIGesture]);
    const [handRaiseClassification, setHandRaiseClassification] =
        useState<number>(0);
    const [iUnderstandClassification, setIUnderstandClassification] =
        useState<number>(0);
    const [likeClassification, setLikeClassification] = useState<number>(0);
    const [clapClassification, setClapClassification] = useState<number>(0);
    const [noClassification, setNoClassification] = useState<number>(0);

    const classificationBuffer: number = 100;
    // Number of seconds AI gesture recognition will stop for after releasing the signal
    const timeBuffer: number = 10;
    const MIN = 0;
    const MAX = 3;
    // If no classification increases this number, we will bring green progress bars to 0.
    const noClassificationNumber: number = 1;
    // Scale `value` between 0-100 and then transform it to closest mutliple of 10.
    const normalise = (value) =>
        Math.floor(Math.floor(((value - MIN) * 100) / (MAX - MIN)) / 10) * 10;

    useEffect(() => {
        const createLocalVideoStreamPreview = async () => {
            appInsights.trackEvent(
                { name: "createLocalVideoStreamPreview" },
                {
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
            try {
                if (localVideoStream) {
                    const streamRenderer = new VideoStreamRenderer(
                        localVideoStream,
                    );
                    setStreamRenderer(streamRenderer);
                    const htmlView = (
                        await streamRenderer.createView({ scalingMode: "Fit" })
                    ).target;
                    setLocalPreviewHTML(htmlView);
                }
            } catch (error) {
                logger.error("ACS: Error Starting local video preview");
                logger.error(error);
            }
        };
        createLocalVideoStreamPreview();
        return () => streamRenderer?.dispose();
    }, [localVideoStream]);

    useEffect(() => {
        if (localPreviewHTML !== null) {
            // NOTE: Only run if people join Yes-AI session and local participant is not Interpreter,
            if (
                !participantConfig.sessionId.includes("No-AI") &&
                participantConfig.participantType !==
                    getString("INTERPRETER_PARTICIPANT_TYPE")
            ) {
                logger.log("AI GESTURE RECOGNITION: Set holistic model.");

                const holistic = new Holistic({
                    locateFile: (file) => {
                        logger.log(file);
                        //return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`; // Uncomment this to load the model from cdn.
                        //return process.env.PUBLIC_URL + `holistic/${file}`;
                        //return `assets/models/holistic/${file}`;
                        return `./holistic/${file}`;
                    },
                });
                appInsights.trackEvent(
                    { name: "setHolisticModel" },
                    {
                        componentName: componentName,
                        sessionId: participantConfig.sessionId,
                    },
                );

                holistic.setOptions({
                    modelComplexity: 0,
                    smoothLandmarks: true,
                    enableSegmentation: true,
                    smoothSegmentation: true,
                    refineFaceLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                holistic.onResults(onResults);

                const camera = new cam.Camera(
                    localPreviewHTML.children[0] as HTMLVideoElement,
                    {
                        onFrame: async () => {
                            // Send frame every 1 second
                            await delay(1000);
                            await holistic.send({
                                // @ts-ignore
                                image: localPreviewHTML.children[0],
                            });
                        },
                        width: 320,
                        height: 240,
                    },
                );
                camera.start();
            }
        }
    }, [localPreviewHTML]);

    const onResults = (results: Results) => {
        // appInsights.trackEvent(
        //     { name: "onResults" },
        //     { componentName: componentName },
        // );
        let ip = processHolisticResults(results);
        // @ts-ignore
        ip = tf.tensor(ip);

        // step-3: pass input to NN classifier
        const model = tf.loadLayersModel(
            process.env.PUBLIC_URL + "fcnet_v3_tfjs/model.json",
        );

        //const pred;
        model.then(async function (res) {
            // @ts-ignore
            const pred = await res.predict(ip).array();
            const predSoftmax = softmax(pred[0]); // Sum of predSoftmax is 1
            //logger.log(predSoftmax);
            const predictionThreshold: number = 0.3;

            if (
                videoOnRef.current &&
                gestureRecognizierRef.current &&
                enableAIGestureRef.current
            ) {
                if (predSoftmax[0] > predictionThreshold) {
                    logger.log("Classification: Hand Raise");
                    setHandRaiseClassification(
                        (handRaiseClassification) =>
                            handRaiseClassification + 1,
                    );
                } else if (predSoftmax[1] > predictionThreshold) {
                    logger.log("Classification: Ok");
                    setIUnderstandClassification(
                        (iUnderstandClassification) =>
                            iUnderstandClassification + 1,
                    );
                } else if (predSoftmax[2] > predictionThreshold) {
                    logger.log("Classification: Like");
                    setLikeClassification(
                        (likeClassification) => likeClassification + 1,
                    );
                } else if (predSoftmax[3] > predictionThreshold) {
                    logger.log("Classification: Clap");
                    setClapClassification(
                        (clapClassification) => clapClassification + 1,
                    );
                } else if (predSoftmax[4] > 0.1) {
                    logger.log("No classification");
                    setNoClassification(
                        (noClassification) => noClassification + 1,
                    );
                }
            }
        });
    };

    const flushFrameClassificationArrays = () => {
        appInsights.trackEvent(
            { name: "flushFrameClassificationArrays" },
            {
                componentName: componentName,
                sessionId: participantConfig.sessionId,
            },
        );
        setHandRaiseClassification(0);
        setIUnderstandClassification(0);
        setLikeClassification(0);
        setClapClassification(0);
    };

    const releaseGestureSignal = (predLabel: number) => {
        appInsights.trackEvent(
            { name: "releaseGestureSignal" },
            {
                componentName: componentName,
                predLabel: predLabel,
                sessionId: participantConfig.sessionId,
            },
        );
        logger.log("Signal: ", classifications[predLabel]);
        setGestureRecognizer((v) => !v);
        // Disable gesture recognizer for timeBuffer/2 seconds
        setTimeout(
            () => setGestureRecognizer((v) => !v),
            (timeBuffer / 2) * 1000,
        );
        broadcastSignalMessage(classifications[predLabel], predLabel);
        flushFrameClassificationArrays();
    };

    useEffect(() => {
        // Don't do anything if hand is already raised. NOTE: Maybe this can be moved to onResults itself.
        if (!handRaised) {
            // If circular progress value has crossed 100
            if (normalise(handRaiseClassification) > classificationBuffer) {
                releaseGestureSignal(0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handRaiseClassification]);

    useEffect(() => {
        // If circular progress value has crossed 100
        if (normalise(iUnderstandClassification) > classificationBuffer) {
            releaseGestureSignal(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iUnderstandClassification]);

    useEffect(() => {
        // If circular progress value has crossed 100
        if (normalise(likeClassification) > classificationBuffer) {
            releaseGestureSignal(2);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [likeClassification]);

    useEffect(() => {
        // If circular progress value has crossed 100
        if (normalise(clapClassification) > classificationBuffer) {
            releaseGestureSignal(3);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clapClassification]);

    useEffect(() => {
        if (noClassification > noClassificationNumber) {
            flushFrameClassificationArrays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noClassification]);

    const onToggleCamera = useCallback(
        async (options?: VideoStreamOptions): Promise<void> => {
            logger.log("onToggleCamera");

            await cameraProps.onToggleCamera({
                ...options,
                scalingMode: "Fit",
            });
            if (!videoOnRef.current) {
                await videoGalleryProps.onDisposeLocalStreamView();
            } else {
                await videoGalleryProps.onCreateLocalStreamView();
            }
            // Reinitialize circular progress bars to 0.
            flushFrameClassificationArrays();
            setVideoOn((v) => !v);
            appInsights.trackEvent(
                { name: "onToggleCamera" },
                {
                    componentName: componentName,
                    videoOn: videoOnRef.current,
                    sessionId: participantConfig.sessionId,
                },
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cameraProps],
    );

    const onToggleMicrophone = useCallback(
        async (): Promise<void> => {
            logger.log("onToggleMicrophone");

            await microphoneProps.onToggleMicrophone();
            appInsights.trackEvent(
                { name: "onToggleMicrophone" },
                {
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [microphoneProps],
    );

    const onToggleScreenShare = useCallback(
        async (): Promise<void> => {
            logger.log("onToggleScreenShare");

            await screenShareProps.onToggleScreenShare();
            appInsights.trackEvent(
                { name: "onToggleScreenShare" },
                {
                    componentName: componentName,
                    sessionId: participantConfig.sessionId,
                },
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cameraProps],
    );

    const onHangup = useCallback(async (): Promise<void> => {
        appInsights.trackEvent(
            { name: "onHangUp" },
            {
                componentName: componentName,
                userId: participantConfig.userId,
                sessionId: participantConfig.sessionId,
            },
        );
        await endCallProps.onHangUp();
        setCallEnded(true);
        socket.disconnect();
        // Remove participant from chat.
        await chatThreadClient.removeParticipant({
            communicationUserId: participantConfig.userId,
        });
        Store.removeAllNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatThreadClient, endCallProps, participantConfig.userId]);

    if (callEnded) {
        return <CallEnded />;
    }

    const getLocalVideoTile = () => {
        return (
            <div key={localParticipant.userId}>
                <LocalVideoTileComponent
                    localParticipant={localParticipant}
                    lockTile={lockTile}
                    removeTile={removeTile}
                    localPreviewHTML={localPreviewHTML}
                    videoOn={videoOn}
                    // For Reaction Icon Overlays
                    handRaised={handRaisedParticipantQ.some(
                        (el) =>
                            el.participantUserId === localParticipant.userId,
                    )}
                    iUnderstood={iUnderstoodParticipantQ.some(
                        (el) =>
                            el.participantUserId === localParticipant.userId,
                    )}
                    liked={likedParticipantQ.some(
                        (el) =>
                            el.participantUserId === localParticipant.userId,
                    )}
                    clapped={clappedParticipantQ.some(
                        (el) =>
                            el.participantUserId === localParticipant.userId,
                    )}
                    speaking={speakingParticipantQ.some(
                        (el) =>
                            el.participantUserId === localParticipant.userId,
                    )}
                />
            </div>
        );
    };

    const getScreenShareTile = () => {
        const screenShareParticipant = videoGalleryProps.screenShareParticipant;
        if (screenShareParticipant !== undefined) {
            return (
                <div key={"SS:" + screenShareParticipant.userId}>
                    <ScreenShareVideoTileComponent
                        screenShareParticipant={screenShareParticipant}
                        lockTile={lockTile}
                    />
                </div>
            );
        }
    };

    const lockTile = (participantUserId: string) => {
        logger.log("lockTile", participantUserId);
        appInsights.trackEvent(
            { name: "lockTile" },
            {
                componentName: componentName,
                localUserId: participantConfig.userId,
                participantUserId: participantUserId,
                sessionId: participantConfig.sessionId,
            },
        );
        setGridItems((current) =>
            current.map((obj) => {
                if (obj.userId === participantUserId) {
                    return {
                        ...obj,
                        static: !obj.static,
                    };
                }
                return obj;
            }),
        );
    };

    const removeTile = (participantUserId: string) => {
        logger.log("removeTile", participantUserId);
        logger.log(
            gridItemsRef.current.find((i) => i.userId === participantUserId),
        );
        appInsights.trackEvent(
            { name: "removeTile" },
            {
                componentName: componentName,
                localUserId: participantConfig.userId,
                participantUserId: participantUserId,
                sessionId: participantConfig.sessionId,
            },
        );
        setRemovedGridItems((current) => [
            ...current,
            {
                participantUserId: participantUserId,
                timeStamp: new Date(),
            },
        ]);
        setGridItems((current) =>
            current.filter((obj) => {
                return obj.userId !== participantUserId;
            }),
        );
    };

    const addTile = (
        participantUserId: string | undefined,
        isLocalParticipant: boolean | undefined,
    ) => {
        logger.log("addTile");
        logger.log(participantUserId);
        appInsights.trackEvent(
            { name: "addTile" },
            {
                componentName: componentName,
                localUserId: participantConfig.userId,
                isLocalParticipant: isLocalParticipant,
                participantUserId: participantUserId,
                sessionId: participantConfig.sessionId,
            },
        );

        if (isLocalParticipant) {
            const addGridItem = {
                ...localParticipant,
                x: 9,
                y: Infinity,
                w: 3,
                h: 5,
                minH: 5,
                minW: 3,
                i: participantUserId,
                static: false,
            };
            setGridItems((current) => [...current, addGridItem]);
        } else {
            const addGridItem = {
                ...remoteParticipants.find(
                    (i) => i.userId === participantUserId,
                ),
                x: 9,
                y: Infinity,
                w: 3,
                h: 5,
                minH: 5,
                minW: 3,
                i: participantUserId,
                static: false,
            };
            setGridItems((current) => [...current, addGridItem]);
        }

        setRemovedGridItems((current) =>
            current.filter((obj) => {
                return obj.participantUserId !== participantUserId;
            }),
        );
    };

    const gridLayoutScreen = () => {
        const defaultProps = {
            className: "layout",
            rowHeight: 30,
            onLayoutChange: function () {},
            breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
            cols: { lg: 12, md: 12, sm: 6, xs: 6, xxs: 3 },
            resizeHandles: ["sw", "nw", "se", "ne"],
            measureBeforeMount: true,
            isBounded: true, // Disables ablility to drag an item outside the bounding box.
            isDroppable: false, // Keep this false until you fix removeTile.
            useCSSTransforms: true,
        };

        const generateGridItemsLayout = () => {
            // logger.log("generateGridItemsLayout");
            // logger.log(gridItems);
            return gridItemsRef.current.map((gridItem, gridItemIndex) => {
                return {
                    x: gridItem.x,
                    y: gridItem.y,
                    w: gridItem.w,
                    h: gridItem.h,
                    minH: gridItem.minH,
                    minW: gridItem.minW,
                    i: gridItem.userId,
                    static: gridItem.static,
                };
            });
        };

        const generateGridItemsDOM = () => {
            // logger.log("generateGridItemsDOM");
            // logger.log(remoteParticipants);

            let gridItemsDom: any = [];

            const removedParticipantUserIds = _.differenceBy(
                [localParticipant, ...remoteParticipants],
                gridItemsRef.current,
                "userId",
            ).map((p) => {
                return p.userId;
            });

            // Add local participant to DOM if 2 conditions are met:
            // - If they were not removed
            // - If they are not admin.
            if (
                !removedParticipantUserIds.includes(localParticipant.userId) &&
                !localParticipant.displayName?.includes("Admin")
            ) {
                gridItemsDom.push(getLocalVideoTile());
            }

            const screenShareTile = getScreenShareTile();
            const remoteParticipantDom = remoteParticipants
                // Filter from remote participants if 2 conditions are met:
                // - If they were removed
                // - If they are admin.
                .filter((p) =>
                    localParticipant.displayName?.includes(
                        getString("ADMIN_PARTICIPANT_TYPE"),
                    )
                        ? !p.displayName?.includes(
                              getString("HEARING_PARTICIPANT_TYPE"),
                          )
                        : !removedParticipantUserIds.includes(p.userId) &&
                          !p.displayName?.includes("Admin"),
                )
                .map((remoteParticipant, participantIndex) => {
                    return (
                        <div key={remoteParticipant.userId}>
                            <RemoteVideoTileComponent
                                localParticipant={localParticipant}
                                participant={remoteParticipant}
                                // Callbacks to control video tile
                                lockTile={lockTile}
                                removeTile={removeTile}
                                // To control what gets displayed onMouseOver
                                isRemoteParticipantTile={true}
                                allowRemoveTile={true}
                                allowVideoOnOff={true}
                                setTranscription={setTranscription}
                                // For Reaction Icon Overlays
                                handRaised={handRaisedParticipantQ.some(
                                    (el) =>
                                        el.participantUserId ===
                                        remoteParticipant.userId,
                                )}
                                iUnderstood={iUnderstoodParticipantQ.some(
                                    (el) =>
                                        el.participantUserId ===
                                        remoteParticipant.userId,
                                )}
                                liked={likedParticipantQ.some(
                                    (el) =>
                                        el.participantUserId ===
                                        remoteParticipant.userId,
                                )}
                                clapped={clappedParticipantQ.some(
                                    (el) =>
                                        el.participantUserId ===
                                        remoteParticipant.userId,
                                )}
                                speaking={speakingParticipantQ.some(
                                    (el) =>
                                        el.participantUserId ===
                                        remoteParticipant.userId,
                                )}
                            />
                        </div>
                    );
                });
            if (screenShareTile !== undefined) {
                return [
                    screenShareTile,
                    ...gridItemsDom,
                    ...remoteParticipantDom,
                ];
            } else {
                return [...gridItemsDom, ...remoteParticipantDom];
            }
        };

        // Update participant layout config on layout chagne.
        const onLayoutChange = (layout, layouts) => {
            logger.log("onLayoutChange");
            // layout contains all the elements you send in generateGridItemsDOM
            logger.log(layout);
            // logger.log(gridItems);
            appInsights.trackEvent(
                { name: "onLayoutChange" },
                {
                    componentName: componentName,
                    layout: layout,
                    localUserId: participantConfig.userId,
                    sessionId: participantConfig.sessionId,
                },
            );
            setGridItems(
                layout.map((layoutItem, _layoutItemIndex) => {
                    return {
                        ...gridItemsRef.current.find(
                            (gridItem) => gridItem.userId === layoutItem.i,
                        ),
                        x: layoutItem.x,
                        y: layoutItem.y,
                        w: layoutItem.w,
                        h: layoutItem.h,
                        minH: layoutItem.minH,
                        minW: layoutItem.minW,
                        i: layoutItem.i,
                        static: layoutItem.static,
                    };
                }),
            );
        };

        const onResizeStart = (
            layout,
            oldItem,
            newItem,
            placeholder,
            e,
            element,
        ) => {
            logger.log("onResizeStart");
            logger.log(layout);
            appInsights.trackEvent(
                { name: "onResizeStart" },
                {
                    componentName: componentName,
                    layout: layout,
                    sessionId: participantConfig.sessionId,
                },
            );
        };
        const onDragStart = (
            layout,
            oldItem,
            newItem,
            placeholder,
            e,
            element,
        ) => {
            logger.log("onDragStart");
            logger.log(layout);
            appInsights.trackEvent(
                { name: "onDragStart" },
                {
                    componentName: componentName,
                    layout: layout,
                    sessionId: participantConfig.sessionId,
                },
            );
        };

        return (
            <ResponsiveReactGridLayout
                {...defaultProps}
                layouts={{ lg: generateGridItemsLayout() }}
                onLayoutChange={(layout, layouts) =>
                    onLayoutChange(layout, layouts)
                }
                onResizeStart={onResizeStart}
                onDragStart={onDragStart}
            >
                {generateGridItemsDOM()}
            </ResponsiveReactGridLayout>
        );
    };

    const onRenderParticipantItemAvatar = (userId, options): JSX.Element => {
        const iconSx = {
            border: 1,
            fontSize: 25,
            borderRadius: "25px",
            padding: "2px",
        };
        const getCoin = () => {
            const participantType = options.text.split(":")[0];
            if (participantType === getString("INTERPRETER_PARTICIPANT_TYPE")) {
                return (
                    <SignLanguage
                        style={{
                            color: getString(
                                "INTERPRETER_PARTICIPANT_TYPE_COLOR",
                            ),
                        }}
                        sx={iconSx}
                    />
                );
            } else if (
                participantType === getString("HEARING_PARTICIPANT_TYPE")
            ) {
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
            } else if (participantType === "Admin") {
                return <AdminPanelSettings sx={iconSx} />;
            }
        };

        const horizontalGapStackTokens: IStackTokens = {
            childrenGap: 10,
            padding: 5,
        };

        return (
            <React.Fragment>
                {userId !== undefined && options.text !== undefined && (
                    <Stack horizontal tokens={horizontalGapStackTokens}>
                        <Stack.Item align="center">{getCoin()} </Stack.Item>
                        <Stack.Item
                            align="center"
                            styles={{ root: { fontSize: "1rem" } }}
                        >
                            {options.text.split(": ")[1]}
                        </Stack.Item>
                    </Stack>
                )}
            </React.Fragment>
        );
    };

    const onRenderMessageThreadAvatar = (userId): JSX.Element => {
        // Find participant information using userId
        const participant =
            userId === localParticipant.userId
                ? localParticipant
                : _.find(remoteParticipants, {
                      userId: userId,
                  });
        const iconSx = {
            border: 1,
            fontSize: 32,
            borderRadius: "25px",
            padding: "2px",
        };
        const getCoin = () => {
            const participantType = getParticipantType(
                participant as VideoGalleryParticipant,
            );
            if (participantType === getString("INTERPRETER_PARTICIPANT_TYPE")) {
                return (
                    <SignLanguage
                        style={{
                            color: getString(
                                "INTERPRETER_PARTICIPANT_TYPE_COLOR",
                            ),
                        }}
                        sx={iconSx}
                    />
                );
            } else if (
                participantType === getString("HEARING_PARTICIPANT_TYPE")
            ) {
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
            } else if (
                participantType === getString("ADMIN_PARTICIPANT_TYPE")
            ) {
                return <AdminPanelSettings sx={iconSx} />;
            }
        };

        return (
            <React.Fragment>{userId !== undefined && getCoin()}</React.Fragment>
        );
    };

    const onSpeakingSwitchChange = (
        ev: React.ChangeEvent<HTMLInputElement>,
        speakingUserId: string,
        speakingDisplayName: string,
    ) => {
        logger.log("onSpeakingSwitchChange", ev.target.checked);
        let message = {
            speakingUserId: speakingUserId,
            speakingDisplayName: speakingDisplayName,
            speaking: ev.target.checked,
            sessionId: participantConfig.sessionId,
        };
        appInsights.trackEvent(
            { name: "onSpeakingSwitchChange" },
            {
                componentName: componentName,
                message: message,
                sessionId: participantConfig.sessionId,
            },
        );
        socket.emit("broadcastSpeakingMessage", message);
        // For admin participant, show background colors for better understanding
        if (localParticipant.displayName?.includes("Admin")) {
            if (ev.target.checked) {
                setSpeakingParticipantQ((current) => [
                    ...current,
                    {
                        participantUserId: speakingUserId,
                    },
                ]);
            } else {
                setSpeakingParticipantQ((current) =>
                    current.filter((obj) => {
                        return obj.participantUserId !== speakingUserId;
                    }),
                );
            }
        }
    };

    const onRenderParticipantItemIcon = (
        props?: ParticipantItemProps,
    ): JSX.Element | null => {
        const horizontalGapStackTokens: IStackTokens = {
            childrenGap: 8,
        };

        // Find participant information using userId
        const participant =
            props?.userId === localParticipant.userId
                ? localParticipant
                : _.find(remoteParticipants, {
                      userId: props?.userId,
                  });

        return (
            <Stack horizontal tokens={horizontalGapStackTokens}>
                {/* Add a switch when (1) local participant is "Admin", (2) participant is not "Admin", and (3) participant is not a "Hearing" participant */}
                {!participant?.displayName?.includes(
                    getString("ADMIN_PARTICIPANT_TYPE"),
                ) &&
                    !participant?.displayName?.includes(
                        getString("HEARING_PARTICIPANT_TYPE"),
                    ) &&
                    localParticipant?.displayName?.includes(
                        getString("ADMIN_PARTICIPANT_TYPE"),
                    ) && (
                        <Switch
                            inputProps={{
                                "aria-label": "Switch for signing and speaking",
                            }}
                            color="success"
                            onChange={(event) =>
                                onSpeakingSwitchChange(
                                    event,
                                    participant?.userId as string,
                                    participant?.displayName as string,
                                )
                            }
                        />
                    )}
                {participant?.isMuted ? (
                    <Stack.Item align="center">
                        <MicOffIcon fontSize="small" />
                    </Stack.Item>
                ) : (
                    <Stack.Item align="center">
                        <KeyboardVoiceIcon fontSize="small" />
                    </Stack.Item>
                )}
                {participant?.videoStream?.isAvailable ? (
                    <Stack.Item align="center">
                        <Videocam fontSize="small" />
                    </Stack.Item>
                ) : (
                    <Stack.Item align="center">
                        <VideocamOff fontSize="small" />
                    </Stack.Item>
                )}
                {participant?.isScreenSharingOn && (
                    <Stack.Item align="center">
                        <PresentToAllIcon fontSize="small" />
                    </Stack.Item>
                )}
                {handRaisedParticipantQ.some(
                    (el) => el.participantUserId === props?.userId,
                ) && (
                    <Stack.Item align="center">
                        <span style={{ fontSize: 20 }}>
                            <Emoji emoji="raised-hand" />
                        </span>
                    </Stack.Item>
                )}
                {iUnderstoodParticipantQ.some(
                    (el) => el.participantUserId === props?.userId,
                ) && (
                    <Stack.Item align="center">
                        <span style={{ fontSize: 20 }}>
                            <Emoji emoji="ok-hand" />
                        </span>
                    </Stack.Item>
                )}
                {likedParticipantQ.some(
                    (el) => el.participantUserId === props?.userId,
                ) && (
                    <Stack.Item align="center">
                        <span style={{ fontSize: 20 }}>
                            <Emoji emoji="thumbs-up" />
                        </span>
                    </Stack.Item>
                )}
                {clappedParticipantQ.some(
                    (el) => el.participantUserId === props?.userId,
                ) && (
                    <Stack.Item align="center">
                        <span style={{ fontSize: 20 }}>
                            <Emoji emoji="clapping-hands" />
                        </span>
                    </Stack.Item>
                )}
                {removedGridItemsRef.current.some(
                    (el) => el.participantUserId === props?.userId,
                ) && (
                    <Stack.Item align="center">
                        <Button
                            aria-label="Add Participant to Grid"
                            onClick={(_ev) => addTile(props?.userId, props?.me)}
                            onMouseDown={(e) => e.preventDefault()}
                            variant="contained"
                            color="success"
                            endIcon={<AddIcon />}
                            size="small"
                        >
                            Add
                        </Button>
                    </Stack.Item>
                )}
            </Stack>
        );
    };

    return (
        <Stack styles={stackStyles}>
            {/* Top Bar */}
            <Stack>
                <Stack horizontal horizontalAlign="space-between">
                    {/* <Stack
                        horizontal
                        tokens={{ childrenGap: 30, padding: "10px" }}
                    >
                        <Stack.Item
                            align="center"
                            styles={navBarStackItemStyles}
                        >
                            <Typography variant="h5" align="center">
                                {getString("SYSTEM_NAME")}
                            </Typography>
                        </Stack.Item>
                        <Stack.Item align="center">
                            {socketConnectionStatus === "Connected" && (
                                <Stack horizontal tokens={{ childrenGap: 2 }}>
                                    <Stack.Item align="center">
                                        <Wifi
                                            style={{
                                                color: "#FFFFFF",
                                            }}
                                        />
                                    </Stack.Item>
                                    <Stack.Item align="center">
                                        <Typography
                                            variant="subtitle1"
                                            align="center"
                                            sx={{
                                                color: "#4caf50",
                                            }}
                                        >
                                            Server Connected!
                                        </Typography>
                                    </Stack.Item>
                                </Stack>
                            )}
                            {socketConnectionStatus === "Disconnected" && (
                                <Stack horizontal tokens={{ childrenGap: 2 }}>
                                    <Stack.Item align="center">
                                        <WifiOff
                                            style={{
                                                color: "#c8c8c8",
                                            }}
                                        />
                                    </Stack.Item>
                                    <Stack.Item align="center">
                                        <Typography
                                            variant="subtitle1"
                                            align="center"
                                            sx={{
                                                color: "#ff4952",
                                            }}
                                        >
                                            Server Connection Lost!
                                        </Typography>
                                    </Stack.Item>
                                </Stack>
                            )}
                        </Stack.Item>
                    </Stack> */}
                    <Stack
                        horizontal
                        tokens={{ childrenGap: 30, padding: "10px" }}
                    >
                        <Stack.Item align="center">
                            <Typography variant="h6" align="center">
                                {/* {participantConfig.sessionId} */}
                            </Typography>
                        </Stack.Item>
                    </Stack>

                    {/* Only display end call button if participant is Admin */}
                    {localParticipant.displayName?.includes(
                        getString("ADMIN_PARTICIPANT_TYPE"),
                    ) ? (
                        <Stack horizontal tokens={{ childrenGap: 10 }}>
                            <Stack.Item align="center">
                                <Typography variant="h5" align="center">
                                    Admin
                                </Typography>
                            </Stack.Item>
                            <Stack.Item align="center">
                                {endCallProps && (
                                    <EndCallButton
                                        {...endCallProps}
                                        onHangUp={onHangup}
                                    />
                                )}
                            </Stack.Item>
                        </Stack>
                    ) : (
                        <Stack horizontal tokens={{ childrenGap: 10 }}>
                            <Stack.Item align="center">
                                {enableAIGesture ? (
                                    <Stack
                                        horizontal
                                        tokens={{ childrenGap: 2 }}
                                    >
                                        <Stack.Item align="center">
                                            <Button
                                                variant="contained"
                                                onClick={() =>
                                                    setEnableAIGesture(
                                                        (v) => false,
                                                    )
                                                }
                                            >
                                                Disable Gestures
                                            </Button>
                                        </Stack.Item>
                                    </Stack>
                                ) : (
                                    <Stack
                                        horizontal
                                        tokens={{ childrenGap: 2 }}
                                    >
                                        <Stack.Item align="center">
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() =>
                                                    setEnableAIGesture(
                                                        (v) => true,
                                                    )
                                                }
                                            >
                                                Enable Gestures
                                            </Button>
                                        </Stack.Item>
                                    </Stack>
                                )}
                            </Stack.Item>
                            {/* Reactions */}
                            <Stack.Item
                                align="center"
                                styles={navBarStackItemStyles}
                            >
                                {handRaised ? (
                                    <Button
                                        color="warning"
                                        endIcon={<PanToolIcon />}
                                        variant="contained"
                                        onClick={(event) =>
                                            broadcastSignalMessage(
                                                "Lower Hand",
                                                4,
                                                event,
                                            )
                                        }
                                    >
                                        Lower Hand
                                    </Button>
                                ) : (
                                    <CircularProgressWithLabel
                                        broadcastSignalMessage={
                                            broadcastSignalMessage
                                        }
                                        value={normalise(
                                            handRaiseClassification,
                                        )}
                                        color="success"
                                        thickness={5}
                                        title={classifications[0]}
                                        emojiSignalCode={0}
                                        emojiSignalMessage={classifications[0]}
                                        emoji="raised-hand"
                                    />
                                )}
                                <CircularProgressWithLabel
                                    broadcastSignalMessage={
                                        broadcastSignalMessage
                                    }
                                    value={normalise(iUnderstandClassification)}
                                    color="success"
                                    thickness={5}
                                    title={classifications[1]}
                                    emojiSignalCode={1}
                                    emojiSignalMessage={classifications[1]}
                                    emoji="ok-hand"
                                />
                                <CircularProgressWithLabel
                                    broadcastSignalMessage={
                                        broadcastSignalMessage
                                    }
                                    value={normalise(likeClassification)}
                                    color="success"
                                    thickness={5}
                                    title={classifications[2]}
                                    emojiSignalCode={2}
                                    emojiSignalMessage={classifications[2]}
                                    emoji="thumbs-up"
                                />
                                <CircularProgressWithLabel
                                    broadcastSignalMessage={
                                        broadcastSignalMessage
                                    }
                                    value={normalise(clapClassification)}
                                    color="success"
                                    thickness={5}
                                    title={classifications[3]}
                                    emojiSignalCode={3}
                                    emojiSignalMessage={classifications[3]}
                                    emoji="clapping-hands"
                                />
                            </Stack.Item>
                            <Stack.Item
                                align="center"
                                styles={navBarStackItemStylesLeft}
                            >
                                <TooltipHost
                                    content="Settings"
                                    calloutProps={calloutProps}
                                    styles={hostStyles}
                                    closeDelay={500}
                                >
                                    <IconButton
                                        aria-label="Settings"
                                        onClick={showConfigurationPanel}
                                        onMouseDown={(e) => e.preventDefault()}
                                        sx={tabSxProps}
                                    >
                                        <Settings />
                                    </IconButton>
                                </TooltipHost>
                            </Stack.Item>
                            <Stack.Item align="center">
                                {cameraProps && (
                                    <CameraButton
                                        {...cameraProps}
                                        onToggleCamera={onToggleCamera}
                                        localVideoViewOptions={{
                                            scalingMode: "Fit",
                                        }}
                                    />
                                )}
                                {microphoneProps && (
                                    <MicrophoneButton
                                        {...microphoneProps}
                                        onToggleMicrophone={onToggleMicrophone}
                                    />
                                )}
                                {screenShareProps &&
                                    localParticipant.displayName?.includes(
                                        "Researcher",
                                    ) && (
                                        <ScreenShareButton
                                            {...screenShareProps}
                                            onToggleScreenShare={
                                                onToggleScreenShare
                                            }
                                        />
                                    )}
                                {endCallProps && (
                                    <EndCallButton
                                        {...endCallProps}
                                        onHangUp={onHangup}
                                    />
                                )}

                                <ConfigurationPanel
                                    isConfigurationPanelOpen={
                                        isConfigurationPanelOpen
                                    }
                                    dismissConfigurationPanel={
                                        dismissConfigurationPanel
                                    }
                                    deviceManager={deviceManager}
                                    switchCamera={switchCamera}
                                    localVideoStream={localVideoStream}
                                />
                            </Stack.Item>
                        </Stack>
                    )}
                </Stack>
            </Stack>

            <Stack
                horizontal
                disableShrink
                tokens={{
                    childrenGap: 5,
                    padding: 0,
                }}
                verticalFill={true}
            >
                {/* Video Gallery */}
                <Stack.Item
                    disableShrink
                    styles={{
                        root: {
                            width: "80%",
                            maxHeight: "99%",
                            //overflow: "scroll",
                            overflowX: "hidden",
                            overflowY: "scroll",
                            border: "1px solid #383735",
                        },
                    }}
                >
                    {videoGalleryProps && gridLayoutScreen()}
                </Stack.Item>
                {/* People, chat, and, transcription. */}
                <Stack.Item
                    //grow
                    disableShrink
                    styles={{
                        root: {
                            width: "20%",
                            height: "100%",
                            borderTop: "1px solid #383735",
                        },
                    }}
                >
                    <Stack
                        disableShrink
                        className={mergeStyles({ height: "100%" })}
                        verticalFill={true}
                    >
                        <Stack.Item disableShrink>
                            <Box
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    aria-label="Participants, Chat, and Transcription Tabs"
                                    variant="fullWidth"
                                    indicatorColor="primary"
                                    //variant="scrollable"
                                    //scrollButtons="auto"
                                    textColor="inherit"
                                >
                                    <Tab
                                        label="People"
                                        {...a11yProps(0)}
                                        wrapped={true}
                                        sx={{
                                            fontSize: "1rem",
                                            textTransform: "capitalize",
                                        }}
                                    />
                                    <Tab
                                        label={
                                            <Badge
                                                color="success"
                                                //variant="dot"
                                                invisible={chatBadgeInvisible}
                                                badgeContent=" "
                                            >
                                                Chat
                                            </Badge>
                                        }
                                        {...a11yProps(1)}
                                        wrapped={true}
                                        sx={{
                                            fontSize: "1rem",
                                            textTransform: "capitalize",
                                        }}
                                    />
                                    <Tab
                                        label="Transcription"
                                        {...a11yProps(2)}
                                        wrapped={true}
                                        sx={{
                                            fontSize: "1rem",
                                            textTransform: "capitalize",
                                        }}
                                    />
                                </Tabs>
                            </Box>
                        </Stack.Item>

                        <Stack.Item disableShrink grow id="tabStackItem">
                            {tabValue === 0 && (
                                <Stack disableShrink grow>
                                    <Stack.Item
                                        grow
                                        styles={{
                                            root: {
                                                height: "100%",
                                                width: "100%",
                                            },
                                        }}
                                    >
                                        <ParticipantItem
                                            key={"PI" + localParticipant.userId}
                                            userId={localParticipant.userId}
                                            displayName={
                                                localParticipant.displayName
                                            }
                                            me={true}
                                            onRenderAvatar={
                                                onRenderParticipantItemAvatar
                                            }
                                            onRenderIcon={
                                                onRenderParticipantItemIcon
                                            }
                                        />
                                        {remoteParticipants
                                            // Do not show "Admin" participant in People list
                                            .filter(
                                                (p) =>
                                                    !p.displayName?.includes(
                                                        "Admin",
                                                    ),
                                            )
                                            .map((participant, _index) => {
                                                return (
                                                    <ParticipantItem
                                                        key={
                                                            "PI" +
                                                            participant.userId
                                                        }
                                                        userId={
                                                            participant.userId
                                                        }
                                                        displayName={
                                                            participant.displayName
                                                        }
                                                        onRenderAvatar={
                                                            onRenderParticipantItemAvatar
                                                        }
                                                        onRenderIcon={
                                                            onRenderParticipantItemIcon
                                                        }
                                                    />
                                                );
                                            })}
                                    </Stack.Item>
                                </Stack>
                            )}
                            {tabValue === 1 &&
                                tabStackItemHeight !== undefined && (
                                    <Stack disableShrink grow>
                                        <Stack
                                            grow
                                            styles={{
                                                root: {
                                                    //height: "30vh",
                                                    height:
                                                        tabStackItemHeight - 50,
                                                    width: "100%",
                                                },
                                            }}
                                        >
                                            {messageThreadProps && (
                                                <MessageThread
                                                    {...messageThreadProps}
                                                    showMessageDate={false}
                                                    showMessageStatus={false}
                                                    styles={messageThreadStyles}
                                                    onRenderAvatar={
                                                        onRenderMessageThreadAvatar
                                                    }
                                                />
                                            )}
                                        </Stack>
                                        <Stack verticalAlign="end">
                                            {sendBoxProps && (
                                                <SendBox {...sendBoxProps} />
                                            )}
                                        </Stack>
                                    </Stack>
                                )}

                            {tabValue === 2 &&
                                tabStackItemHeight !== undefined && (
                                    <Stack disableShrink grow>
                                        <Stack
                                            grow
                                            styles={{
                                                root: {
                                                    //height: "30vh",
                                                    height:
                                                        tabStackItemHeight - 10,
                                                    width: "100%",
                                                    maxHeight: "100%",
                                                    overflow: "scroll",
                                                    scrollbarColor: "inherit",
                                                },
                                            }}
                                        >
                                            {transcriptions !== undefined &&
                                                transcriptions.map(
                                                    (transcription, index) => {
                                                        return renderTranscription(
                                                            transcription,
                                                            index,
                                                        );
                                                    },
                                                )}
                                            <div ref={transcriptionsEndRef} />
                                        </Stack>
                                    </Stack>
                                )}
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
            </Stack>
            <React.Fragment>
                <Rnd
                    default={{
                        x: 0,
                        y: (window.innerHeight - 150) as number,
                        width: "35%",
                        height: "100px",
                    }}
                    style={{
                        backgroundColor: "#383735",
                        borderRadius: "8px",
                        bottom: 0,
                        boxShadow:
                            "0px 3px 12px rgba(255, 255, 255, 0.2), 0px -3px 12px rgba(255, 255, 255, 0.2)",
                        left: "40%",
                        transform: "translateX(-50%)",
                        paddingTop: "10px",
                        zIndex: 1,
                    }}
                    minWidth="25%"
                    maxWidth="90%"
                    minHeight="100px"
                >
                    {transcriptions.length === 0 ? (
                        <Typography
                            variant="h5"
                            align="center"
                            alignItems="center"
                        >
                            The captions will appear here. You can drag and
                            resize this box.
                        </Typography>
                    ) : (
                        transcriptions.slice(-3).map((transcription, index) => {
                            return renderSubtitle(transcription, index);
                        })
                    )}
                </Rnd>
            </React.Fragment>
        </Stack>
    );
};

export default Layout;
