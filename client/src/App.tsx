// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Load External Libraries
import {
    Call,
    CallAgent,
    DeviceManager,
    Features,
    LocalVideoStream,
    VideoDeviceInfo,
} from "@azure/communication-calling";
import { ChatThreadClient } from "@azure/communication-chat";
import {
    AzureCommunicationTokenCredential,
    CommunicationUserIdentifier,
} from "@azure/communication-common";
import {
    createStatefulCallClient,
    createStatefulChatClient,
    darkTheme,
    CallAgentProvider,
    CallClientProvider,
    CallProvider,
    ChatClientProvider,
    ChatThreadClientProvider,
    FluentThemeProvider,
    StatefulCallClient,
    StatefulChatClient,
    DEFAULT_COMPONENT_ICONS,
} from "@azure/communication-react";
import {
    initializeIcons,
    registerIcons,
    Dialog,
    DialogType,
    PrimaryButton,
    Stack,
    TextField,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { useEffect, useMemo } from "react";
import { ReactNotifications, Store } from "react-notifications-component";
import useState from "react-usestateref";

import { getAppConfig } from "@/apis/getAppConfig";
import { Devices } from "@/components/Devices";
import Layout from "@/components/Layout";
import ParticipantAgreementDialog from "@/components/ParticipantAgreementDialog";
import { createAcsParticipant } from "@/utilities/createAcsParticipant";
import { createAutoRefreshingCredential } from "@/utilities/credential";
import { joinChatThread } from "@/utilities/joinChatThread";
import { logger } from "@/utilities/logger";
import { setUserAndTokenAndModeratorToken } from "@/utilities/setUserAndTokenAndModeratorToken";
import socket from "@/utilities/socket";

import { AppConfig, ParticipantConfig } from "shared/interfaces";

// Load Styles
import "react-notifications-component/dist/theme.css";
import "@/styles/App.css";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { setLogLevel, AzureLogger } from "@azure/logger";

// Alert if the database connection fails in the socket middleware.
const ALERT_TEXT_TRY_AGAIN =
    "Server Connection Lost! \n\nOption 1: If you are in the call and you don't see 'Server Connected!' in green color within 60 seconds, please refresh the page and join the call again.\n\nOption 2: If you have NOT joined the call yet, refresh the page and try joining the call again.";

setLogLevel("warning");
// redirect log output
AzureLogger.log = (...args) => {
    logger.log(...args); // to console, file, buffer, REST API..
};

registerIcons({ icons: DEFAULT_COMPONENT_ICONS });
initializeIcons();

function App(): JSX.Element {
    const appInsights = useAppInsightsContext();
    const componentName = "App";

    // Accessible Connect States
    const [appState, setAppState] = useState("OFFLINE");
    const [displayName, setDisplayName] = useState("");
    const [socketConnectionStatus, setSocketConnectionStatus] =
        useState("Connected");
    const [participantConfig, setParticipantConfig, participantConfigRef] =
        useState<ParticipantConfig>({
            firstName: "",
            lastName: "",
            displayName: "",
            userId: "",
            groupId: "",
            threadId: "",
            sessionId: "",
            socketId: "",
            participantType: undefined,
        });

    const [appConfig, setAppConfig] = useState<AppConfig>({
        acsResourceConnectionString: "",
        acsEndpointUrl: "",
        applicationInsightsConnectionString: "",
        sessions: [],
    });

    const [deviceManager, setDeviceManager] = useState<DeviceManager>();
    const [localVideoStream, setLocalVideoStream] =
        useState<LocalVideoStream>();

    const [activeCameraId, setActiveCameraId] = useState<string>("");

    // UI States
    const [
        isParticipantAgreementAccepted,
        {
            // Call hideUserAgreementDialog to make isUserAgreementAccepted true
            setTrue: hideParticipantAgreementDialog,
        },
    ] = useBoolean(false);
    const [
        isParticipantConfigHidden,
        {
            setTrue: hideParticipantConfigDialog,
            setFalse: showParticipantConfigDialog,
        },
    ] = useBoolean(false);

    const [
        isConfigurationPanelOpen,
        {
            setTrue: showConfigurationPanel,
            setFalse: dismissConfigurationPanel,
        },
    ] = useBoolean(false);

    // ACS States
    const [statefulCallClient, setStatefulCallClient] =
        useState<StatefulCallClient>();
    const [statefulChatClient, setStatefulChatClient] =
        useState<StatefulChatClient>();
    const [chatThreadClient, setChatThreadClient] =
        useState<ChatThreadClient>();
    const [callAgent, setCallAgent] = useState<CallAgent>();
    const [call, setCall] = useState<Call>();

    // ACS Identity, token, group-id, session-id, and credential
    const [groupId, setGroupId] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");
    // For chat
    const [threadId, setThreadId] = useState<string>("");
    const [token, setToken] = useState<string>();
    const [moderatorToken, setModeratorToken] = useState<string>();
    const [userId, setUserId] = useState<CommunicationUserIdentifier>();
    const [moderatorUserId, setModeratorUserId] =
        useState<CommunicationUserIdentifier>();

    const tokenCredential = useMemo(() => {
        if (token !== undefined && userId !== undefined) {
            return createAutoRefreshingCredential(
                appConfig.acsResourceConnectionString,
                userId.communicationUserId,
                token,
            );
        }
    }, [appConfig.acsResourceConnectionString, token, userId]);

    // const tokenCredential = useMemo(() => {
    //     if (token !== undefined) {
    //         return new AzureCommunicationTokenCredential(token);
    //     }
    // }, [token]);

    const moderatorTokenCredential = useMemo(() => {
        if (moderatorToken !== undefined && moderatorUserId !== undefined) {
            return createAutoRefreshingCredential(
                appConfig.acsResourceConnectionString,
                moderatorUserId.communicationUserId,
                moderatorToken,
            );
        }
    }, [
        appConfig.acsResourceConnectionString,
        moderatorToken,
        moderatorUserId,
    ]);

    // const moderatorTokenCredential = useMemo(() => {
    //     if (moderatorToken) {
    //         return new AzureCommunicationTokenCredential(moderatorToken);
    //     }
    // }, [moderatorToken]);

    // Clear session storage on component load.
    useEffect(() => {
        appInsights.trackEvent(
            { name: "clearSessionStorage" },
            { componentName: componentName },
        );
        sessionStorage.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Socket
    useEffect(() => {
        // client-side
        socket.on("connect", () => {
            logger.log("Socket connect:", socket.id);
            appInsights.trackEvent(
                { name: "socketConnection" },
                { socketId: socket.id, componentName: componentName },
            );
            const newSocketId = socket.id;
            /*
				If the socket.id is different than previous one: 
				(1) update the participant config's socketId in react
				(2) update the participant config's socketId in mongo db, 
				(3) add them to the socket room by emitting addParticipantToRoom
			*/
            if (
                newSocketId !== participantConfig.socketId &&
                sessionStorage.getItem("socketId") !== null // To make sure we don't enter the `if` logic on 1st time the client's socket connects with server.
            ) {
                logger.log("THIS IS A NEW SOCKET CONNECTION");
                appInsights.trackEvent(
                    { name: "socketNewConnection" },
                    { socketId: newSocketId, componentName: componentName },
                );

                // (1)
                setParticipantConfig((participantConfig) => ({
                    ...participantConfig,
                    socketId: newSocketId,
                }));
                // (2)
                // logger.log(participantConfigRef.current);
                // logger.log({
                //     ...participantConfigRef.current,
                //     socketId: newSocketId,
                // });
                // NOTE: Not a huge concern, but this is getting called more than once.
                createAcsParticipant({
                    ...participantConfigRef.current,
                    socketId: newSocketId,
                });
                appInsights.trackEvent(
                    { name: "updateAcsParticipant" },
                    {
                        ...participantConfigRef.current,
                        componentName: componentName,
                    },
                );
                // Put new socketId in sessionStorage
                sessionStorage.setItem("socketId", newSocketId);
                // (3)
                socket.emit("addParticipantToRoom", {
                    sessionId: participantConfigRef.current.sessionId,
                });
                appInsights.trackEvent(
                    { name: "socketEmitAddParticipantToRoom" },
                    {
                        sessionId: participantConfigRef.current.sessionId,
                        componentName: componentName,
                    },
                );
            }
            setSocketConnectionStatus("Connected");
        });

        socket.on("disconnect", (reason) => {
            logger.warn("Socket disconnect:", reason);
            appInsights.trackEvent(
                { name: "socketDisconnection" },
                { reason: reason, componentName: componentName },
            );
            // Reason is "transport close" if local server is stopped
            // Reason is "io client disconnect" if participant ends the call
            // System won't disconnect even on turning off internet on localhost.
            // For more details, https://socket.io/docs/v3/client-socket-instance/
            setSocketConnectionStatus("Disconnected");
        });

        socket.on("connect_error", (err) => {
            appInsights.trackEvent(
                { name: "socketConnectError" },
                { message: err.message, componentName: componentName },
            );
            /*
                This event is fired when:
                (1) the low-level connection cannot be established
                (2) the connection is denied by the server in a middleware function
            */
            logger.warn("Socket connect_error:", err.message);
            if (err.message === "DB CONNECTION ERROR") {
                alert(ALERT_TEXT_TRY_AGAIN);
            }
            setTimeout(() => {
                socket.connect();
            }, 1000);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get and Set App Config Data on component mount.
    useEffect(() => {
        const getAppConfigData = async () => {
            const appConfig = await getAppConfig();
            logger.log("Fetched Application Config", appConfig);
            appInsights.trackEvent(
                { name: "getAppConfigData" },
                { componentName: componentName },
            );
            setAppConfig(appConfig);
        };
        getAppConfigData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (
            appConfig.acsResourceConnectionString !== "" &&
            moderatorUserId !== undefined
        ) {
            logger.log("setUserAndTokenAndModeratorToken");
            appInsights.trackEvent(
                {
                    name: "setUserAndTokenAndModeratorToken",
                },
                { componentName: componentName },
            );

            setUserAndTokenAndModeratorToken(
                appConfig.acsResourceConnectionString,
                moderatorUserId,
                setUserId,
                setToken,
                setModeratorToken,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appConfig.acsResourceConnectionString, moderatorUserId]);

    // Set userId in participantConfig
    useEffect(() => {
        if (userId !== undefined) {
            setParticipantConfig((participantConfig) => ({
                ...participantConfig,
                userId: userId.communicationUserId,
            }));
            setStatefulCallClient(createStatefulCallClient({ userId: userId }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        if (
            appConfig.acsEndpointUrl !== "" &&
            displayName !== "" &&
            threadId !== "" &&
            moderatorTokenCredential !== undefined &&
            userId !== undefined
        ) {
            // Add participant to the session's threadId.
            logger.log("Accessible Connect: Join Chat Thread");
            appInsights.trackEvent(
                {
                    name: "joinChatThread",
                },
                {
                    displayName: displayName,
                    threadId: threadId,
                    userId: userId,
                    componentName: componentName,
                },
            );
            joinChatThread(
                appConfig.acsEndpointUrl,
                displayName.split(": ")[1],
                threadId,
                moderatorTokenCredential,
                userId,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        appConfig.acsEndpointUrl,
        displayName,
        threadId,
        moderatorTokenCredential,
        userId,
    ]);

    useEffect(() => {
        if (
            appConfig.acsEndpointUrl !== "" &&
            displayName !== "" &&
            tokenCredential !== undefined &&
            userId !== undefined
        ) {
            logger.log("Accessible Connect: Set Stateful Chat Client.");
            appInsights.trackEvent(
                {
                    name: "setStatefulChatClient",
                },
                {
                    userId: userId,
                    displayName: displayName.split(": ")[1],
                    componentName: componentName,
                },
            );
            setStatefulChatClient(
                createStatefulChatClient({
                    userId: userId,
                    displayName: displayName.split(": ")[1],
                    endpoint: appConfig.acsEndpointUrl,
                    credential: tokenCredential,
                }),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appConfig.acsEndpointUrl, displayName, tokenCredential, userId]);

    useEffect(() => {
        if (
            chatThreadClient === undefined &&
            statefulChatClient &&
            threadId !== undefined
        ) {
            logger.log(
                "Accessible Connect: Create and Set Stateful Chat Thread Client using `threadId`.",
            );
            // Listen to notifications
            statefulChatClient.startRealtimeNotifications();
            appInsights.trackEvent(
                {
                    name: "setChatThreadClient",
                },
                {
                    threadId: threadId,
                    componentName: componentName,
                },
            );
            setChatThreadClient(
                statefulChatClient.getChatThreadClient(threadId),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatThreadClient, statefulChatClient, threadId]);

    useEffect(() => {
        if (
            callAgent === undefined &&
            statefulCallClient &&
            tokenCredential &&
            displayName !== ""
        ) {
            const createCallAgentAsync = async (): Promise<void> => {
                logger.log("Accessible Connect: Create and Set Call Agent.");
                appInsights.trackEvent(
                    {
                        name: "setCallAgent",
                    },
                    {
                        displayName: displayName,
                        componentName: componentName,
                    },
                );
                setCallAgent(
                    await statefulCallClient.createCallAgent(tokenCredential, {
                        displayName: displayName,
                    }),
                );
            };
            createCallAgentAsync();
        }
        return () => {
            callAgent?.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callAgent, statefulCallClient, tokenCredential, displayName]);

    useEffect(() => {
        if (
            callAgent !== undefined &&
            groupId !== undefined &&
            localVideoStream !== undefined
        ) {
            logger.log("Accessible Connect: Join Call `groupId`.");
            appInsights.trackEvent(
                {
                    name: "joinCall",
                },
                {
                    groupId: groupId,
                    componentName: componentName,
                },
            );
            const call = callAgent.join(
                { groupId },
                {
                    //videoOptions: { localVideoStreams: [localVideoStream] },
                    audioOptions: { muted: true },
                },
            );
            logger.log("Call ID: ", call.id);

            setCall(call);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callAgent, groupId, localVideoStream]);

    useEffect(() => {
        if (deviceManager === undefined && statefulCallClient) {
            const loadDeviceManagerAsync = async () => {
                logger.log("Fetching Device Manager from call client");
                const deviceManager =
                    await statefulCallClient.getDeviceManager();

                const videoDevices = await deviceManager.getCameras();
                if (videoDevices.length === 0) {
                    Store.addNotification({
                        message: "No video input devices found!",
                        type: "warning",
                        insert: "bottom",
                        container: "top-center",
                        dismiss: {
                            duration: 5000,
                            onScreen: true,
                            click: true,
                            showIcon: true,
                        },
                    });
                    showParticipantConfigDialog();
                } else {
                    setLocalVideoStream(new LocalVideoStream(videoDevices[0]));
                    setActiveCameraId(videoDevices[0].id);
                    setDeviceManager(deviceManager);
                    deviceManager.askDevicePermission({
                        audio: true,
                        video: true,
                    });
                }
            };
            loadDeviceManagerAsync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statefulCallClient, deviceManager]);

    // NOTE: Ideally, this below code should have worked, but we keep getting CallError: CallClient.createCallAgent: Failed to create call agent, call agent for this ACS Id already exists
    // For Call Diagnostics.
    useEffect(() => {
        if (statefulCallClient) {
            const callDiagnostics = async () => {
                logger.warn("Fetching Environment Info");

                const environmentInfo = await statefulCallClient
                    .feature(Features.DebugInfo)
                    .getEnvironmentInfo();
                logger.warn("EnvironmentInfo", environmentInfo);

                // const preCallDiagnostics = await statefulCallClient
                //     .feature(Features.PreCallDiagnostics)
                //     .startTest(new AzureCommunicationTokenCredential(token));

                // const deviceAccess = await preCallDiagnostics.deviceAccess;
                // logger.warn("deviceAccess:", deviceAccess);

                // const deviceEnumeration =
                //     await preCallDiagnostics.deviceEnumeration;
                // logger.warn("deviceEnumeration:", deviceEnumeration);

                // const browserSupport = await preCallDiagnostics.browserSupport;
                // logger.warn("browserSupport:", browserSupport);

                // const inCallDiagnostics =
                //     await preCallDiagnostics.inCallDiagnostics;
                // logger.warn("inCallDiagnostics: ", inCallDiagnostics);
            };
            callDiagnostics();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statefulCallClient]);

    useEffect(() => {
        if (
            participantConfig.firstName !== "" &&
            participantConfig.lastName !== "" &&
            participantConfig.displayName !== "" &&
            participantConfig.userId !== "" &&
            participantConfig.groupId !== "" &&
            participantConfig.threadId !== "" &&
            participantConfig.sessionId !== "" &&
            participantConfig.participantType !== undefined &&
            participantConfig.socketId !== ""
        ) {
            createAcsParticipant(participantConfig);
            appInsights.trackEvent(
                { name: "createAcsParticipant" },
                { ...participantConfig, componentName: componentName },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participantConfig]);

    // Called when participant clicks "Save" on final modal.
    const startApp = () => {
        appInsights.trackEvent(
            { name: "startApp" },
            { componentName: componentName },
        );
        let displayName = `${participantConfig.participantType}: ${participantConfig.firstName} ${participantConfig.lastName}`;
        setDisplayName(displayName);
        setParticipantConfig((participantConfig) => ({
            ...participantConfig,
            displayName: displayName,
            socketId: socket.id,
        }));

        // Put socketId in sessionStorage
        sessionStorage.setItem("socketId", socket.id);

        setAppState("ONLINE");
        hideParticipantConfigDialog();

        Store.addNotification({
            message: "Connecting you to the call...",
            type: "info",
            insert: "bottom",
            container: "top-center",
            dismiss: {
                duration: 5000,
                click: true,
                showIcon: true,
            },
        });

        // Add participant to their respective session socket room
        socket.emit("addParticipantToRoom", { sessionId: sessionId });
    };

    const switchCamera = (newCamera: VideoDeviceInfo) => {
        try {
            if (localVideoStream && activeCameraId !== newCamera.id) {
                logger.log("Switching Camera");
                appInsights.trackEvent(
                    { name: "switchCamera" },
                    { componentName: componentName },
                );
                localVideoStream?.switchSource(newCamera);
                setActiveCameraId(newCamera.id);
                Store.addNotification({
                    message: "Changed video input device",
                    type: "success",
                    insert: "bottom",
                    container: "top-right",
                    dismiss: {
                        duration: 5000,
                        onScreen: true,
                        click: true,
                        showIcon: true,
                    },
                });
            }
        } catch (error) {
            logger.log(`Error while switching cameras`);
        }
    };

    return (
        <>
            {/* Decides where notification messages will go. */}
            <ReactNotifications />
            <FluentThemeProvider fluentTheme={darkTheme}>
                {/* Open ParticipantAgreementDialog once appConfig is loaded. NOTE: Comment below code when prototyping. */}
                {appConfig["sessions"].length !== 0 && (
                    <ParticipantAgreementDialog
                        show={isParticipantAgreementAccepted}
                        toggle={hideParticipantAgreementDialog}
                        appConfig={appConfig}
                        participantConfig={participantConfig}
                        setGroupId={setGroupId}
                        setSessionId={setSessionId}
                        setThreadId={setThreadId}
                        setModeratorUserId={setModeratorUserId}
                        setParticipantConfig={setParticipantConfig}
                    />
                )}
                {/* Participant Configuration Dialog */}
                <Dialog
                    hidden={
                        isParticipantConfigHidden ||
                        !isParticipantAgreementAccepted
                    }
                    dialogContentProps={{
                        type: DialogType.largeHeader,
                        styles: {
                            title: { padding: "1rem 1.5rem 0.5rem 1.5rem" },
                        },
                        title: (
                            <Stack horizontal horizontalAlign="space-between">
                                <span>Participant Details</span>
                                <PrimaryButton
                                    onClick={startApp}
                                    text="Save"
                                    disabled={
                                        participantConfig.firstName === "" ||
                                        participantConfig.lastName === ""
                                    }
                                />
                            </Stack>
                        ),
                    }}
                    modalProps={{
                        isBlocking: true,
                        styles: { main: { maxWidth: 500 } },
                    }}
                >
                    <Stack
                        tokens={{ childrenGap: 7 }}
                        styles={{ root: { textAlign: "left" } }}
                    >
                        <Stack horizontal tokens={{ childrenGap: 10 }}>
                            <TextField
                                placeholder="Enter First Name"
                                onChange={(e) =>
                                    setParticipantConfig(
                                        (participantConfig) => ({
                                            ...participantConfig,
                                            firstName: (
                                                e.target as HTMLInputElement
                                            ).value.trim(),
                                        }),
                                    )
                                }
                                required
                            />
                            <TextField
                                placeholder="Enter Last Name"
                                onChange={(e) =>
                                    setParticipantConfig(
                                        (participantConfig) => ({
                                            ...participantConfig,
                                            lastName: (
                                                e.target as HTMLInputElement
                                            ).value.trim(),
                                        }),
                                    )
                                }
                                required
                            />
                        </Stack>
                        <Devices
                            deviceManager={deviceManager}
                            switchCamera={switchCamera}
                            localVideoStream={localVideoStream}
                            callFromMainPage={true}
                        />
                    </Stack>
                </Dialog>

                {appState === "ONLINE" && statefulCallClient && (
                    <CallClientProvider callClient={statefulCallClient}>
                        {callAgent && (
                            <CallAgentProvider callAgent={callAgent}>
                                {call && (
                                    <CallProvider call={call}>
                                        {statefulChatClient && (
                                            <ChatClientProvider
                                                chatClient={statefulChatClient}
                                            >
                                                {chatThreadClient && (
                                                    <ChatThreadClientProvider
                                                        chatThreadClient={
                                                            chatThreadClient
                                                        }
                                                    >
                                                        <Layout
                                                            participantConfig={
                                                                participantConfig
                                                            }
                                                            localVideoStream={
                                                                localVideoStream
                                                            }
                                                            deviceManager={
                                                                deviceManager
                                                            }
                                                            switchCamera={
                                                                switchCamera
                                                            }
                                                            isConfigurationPanelOpen={
                                                                isConfigurationPanelOpen
                                                            }
                                                            showConfigurationPanel={
                                                                showConfigurationPanel
                                                            }
                                                            dismissConfigurationPanel={
                                                                dismissConfigurationPanel
                                                            }
                                                            socketConnectionStatus={
                                                                socketConnectionStatus
                                                            }
                                                        />
                                                    </ChatThreadClientProvider>
                                                )}
                                            </ChatClientProvider>
                                        )}
                                    </CallProvider>
                                )}
                            </CallAgentProvider>
                        )}
                    </CallClientProvider>
                )}
            </FluentThemeProvider>
        </>
    );
}

export default App;
