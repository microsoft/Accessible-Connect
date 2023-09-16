// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    DeviceManager,
    VideoDeviceInfo,
    AudioDeviceInfo,
    VideoStreamRenderer,
    LocalVideoStream,
} from "@azure/communication-calling";
import { StreamMedia, VideoTile } from "@azure/communication-react";
import {
    Dropdown,
    Stack,
    IStackProps,
    IDropdownOption,
    Label,
} from "@fluentui/react";

import { useState, useEffect } from "react";

import { logger } from "@/utilities/logger";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
interface DevicesProps {
    deviceManager: DeviceManager | undefined;
    switchCamera: (newCamera: VideoDeviceInfo) => void;
    callFromMainPage: boolean;
    localVideoStream: LocalVideoStream | undefined;
}

export const Devices = (props: DevicesProps) => {
    const appInsights = useAppInsightsContext();
    const componentName = "Devices";
    const { deviceManager, switchCamera, callFromMainPage, localVideoStream } =
        props;

    const [cameras, setCameras] = useState<VideoDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<AudioDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<AudioDeviceInfo[]>([]);
    const [streamRenderer, setStreamRenderer] = useState<VideoStreamRenderer>();
    const [localPreviewHTML, setLocalPreviewHTML] =
        useState<HTMLElement | null>(null);
    const [previewAvailable, setPreviewAvailable] = useState(true);

    const columnProps: Partial<IStackProps> = {
        tokens: { childrenGap: 10 },
        styles: { root: { width: "auto", textAlign: "left" } },
    };

    interface DeviceTypeCommon {
        id: string;
    }

    function uniqueDevices<DeviceType extends DeviceTypeCommon>(
        deviceList: DeviceType[] | undefined,
    ): DeviceType[] {
        const deviceSet = new Set();
        let uniqueDevices: DeviceType[] = [];

        if (deviceList !== undefined) {
            deviceList.forEach((device) => {
                if (!deviceSet.has(device.id)) {
                    deviceSet.add(device.id);
                    uniqueDevices.push(device);
                }
            });
        }
        return uniqueDevices;
    }

    useEffect(() => {
        if (deviceManager !== undefined) {
            deviceManager?.on("videoDevicesUpdated", (args) => {
                const setVideoDeviceListenener = async () => {
                    logger.log("DeviceMgr: Cameras available");
                    const videoDevices = await deviceManager?.getCameras();
                    const uniqueVideoDevices = uniqueDevices(videoDevices);
                    if (uniqueVideoDevices !== undefined) {
                        setCameras(uniqueVideoDevices);
                    }
                };
                setVideoDeviceListenener();
            });

            deviceManager?.on("audioDevicesUpdated", () => {
                const setAudioDeviceListenener = async () => {
                    logger.log("DeviceMgr: Microphones available");
                    const microphoneDevices =
                        await deviceManager?.getMicrophones();
                    const uniqueMicrophoneDevices =
                        uniqueDevices(microphoneDevices);
                    logger.log(uniqueMicrophoneDevices);
                    if (uniqueMicrophoneDevices !== undefined)
                        setMicrophones(uniqueMicrophoneDevices);

                    logger.log("DeviceMgr: Speakers available");
                    const speakerDevices = await deviceManager?.getSpeakers();
                    const uniqueSpeakersDevices = uniqueDevices(speakerDevices);
                    logger.log(uniqueSpeakersDevices);
                    if (uniqueSpeakersDevices !== undefined)
                        setSpeakers(uniqueSpeakersDevices);
                };
                setAudioDeviceListenener();
            });
        }

        const fetchDevices = async () => {
            appInsights.trackEvent(
                { name: "fetchDevices" },
                { componentName: componentName },
            );
            if (deviceManager !== undefined) {
                const videoDevices = await deviceManager.getCameras();
                const uniqueVideoDevices = uniqueDevices(videoDevices);
                setCameras(uniqueVideoDevices);

                const microphoneDevices = await deviceManager.getMicrophones();
                const uniqueMicrophoneDevices =
                    uniqueDevices(microphoneDevices);
                setMicrophones(uniqueMicrophoneDevices);

                const speakerDevices = await deviceManager.getSpeakers();
                const uniqueSpeakersDevices = uniqueDevices(speakerDevices);
                setSpeakers(uniqueSpeakersDevices);
            }
        };
        fetchDevices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceManager]);

    const onSelectCamera = (
        _e: React.FormEvent<HTMLDivElement>,
        selectedOption: IDropdownOption<any> | undefined,
    ) => {
        appInsights.trackEvent(
            { name: "onSelectCamera" },
            { componentName: componentName },
        );
        if (selectedOption !== undefined) {
            const newCamera = cameras.find((i) => i.id === selectedOption.key);

            if (newCamera !== undefined) {
                switchCamera(newCamera);
                logger.log(newCamera);
            }
        }
    };

    const onSelectMicrophone = (
        _e: React.FormEvent<HTMLDivElement>,
        selectedOption: IDropdownOption<any> | undefined,
    ) => {
        appInsights.trackEvent(
            { name: "onSelectMicrophone" },
            { componentName: componentName },
        );
        if (selectedOption !== undefined) {
            const newMicrophone = microphones.find(
                (i) => i.id === selectedOption.key,
            );
            logger.log(newMicrophone);

            if (newMicrophone !== undefined) {
                deviceManager?.selectMicrophone(newMicrophone);
            }
        }
    };

    const onSelectSpeaker = (
        _e: React.FormEvent<HTMLDivElement>,
        selectedOption: IDropdownOption<any> | undefined,
    ) => {
        appInsights.trackEvent(
            { name: "onSelectSpeaker" },
            { componentName: componentName },
        );
        if (selectedOption !== undefined) {
            const newSpeaker = speakers.find(
                (i) => i.id === selectedOption.key,
            );
            logger.log(newSpeaker);

            if (newSpeaker !== undefined) {
                deviceManager?.selectSpeaker(newSpeaker);
            }
        }
    };

    useEffect(() => {
        const createLocalVideoStreamPreview = async () => {
            appInsights.trackEvent(
                { name: "createLocalVideoStreamPreview" },
                { componentName: componentName },
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
                    setPreviewAvailable(true);
                }
            } catch (error) {
                logger.log("Error Starting local video preview");
                logger.log(error);
                setPreviewAvailable(false);
            }
        };
        createLocalVideoStreamPreview();
        return () => streamRenderer?.dispose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localVideoStream]);

    return (
        <Stack {...columnProps}>
            {!callFromMainPage && (
                <div
                    style={{
                        fontSize: "1.25rem",
                        marginBottom: "1rem",
                        fontFamily: "Segoe UI",
                    }}
                >
                    Device Configuration
                </div>
            )}

            <Dropdown
                placeholder="Select a camera"
                options={cameras.map((camera) => {
                    return {
                        selected: false,
                        key: camera.id,
                        text: camera.name,
                    };
                })}
                onChange={onSelectCamera}
                label="Camera"
                required
                defaultSelectedKey={
                    localVideoStream?.source
                        ? localVideoStream.source.id
                        : undefined
                }
            />
            {previewAvailable && (
                <VideoTile
                    styles={{
                        root: {
                            width: "100%",
                            height: "10rem",
                            overflow: "auto",
                        },
                    }}
                    renderElement={
                        <StreamMedia videoStreamElement={localPreviewHTML} />
                    }
                />
            )}
            {!previewAvailable && (
                <Label
                    styles={{
                        root: { textAlign: "center", fontStyle: "italic" },
                    }}
                >
                    Camera is being used by a background app! Please disable and
                    hard refresh using Ctrl+Shift+R or Cmd + R
                </Label>
            )}
            <Dropdown
                placeholder="Select a microphone"
                options={microphones.map((microphone) => {
                    return {
                        selected: false,
                        key: microphone.id,
                        text: microphone.name,
                    };
                })}
                onChange={onSelectMicrophone}
                label="Microphone"
                defaultSelectedKey={deviceManager?.selectedMicrophone?.id}
            />
            <Dropdown
                placeholder="Select a speaker"
                options={speakers.map((speaker) => {
                    return {
                        selected: false,
                        key: speaker.id,
                        text: speaker.name,
                    };
                })}
                onChange={onSelectSpeaker}
                label="Speaker"
                defaultSelectedKey={deviceManager?.selectedSpeaker?.id}
            />
        </Stack>
    );
};
