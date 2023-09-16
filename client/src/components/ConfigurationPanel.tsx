// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Panel } from "@fluentui/react";
import {
    DeviceManager,
    VideoDeviceInfo,
    LocalVideoStream,
} from "@azure/communication-calling";
import { Devices } from "./Devices";

interface ConfigurationPanelProps {
    isConfigurationPanelOpen: boolean;
    dismissConfigurationPanel: () => void;
    deviceManager: DeviceManager | undefined;
    switchCamera: (newCamera: VideoDeviceInfo) => void;
    localVideoStream: LocalVideoStream | undefined;
}

export const ConfigurationPanel = (props: ConfigurationPanelProps) => {
    return (
        <Panel
            isOpen={props.isConfigurationPanelOpen}
            hasCloseButton
            onDismiss={props.dismissConfigurationPanel}
            isLightDismiss
            isHiddenOnDismiss={true}
            isFooterAtBottom={true}
        >
            <Devices
                deviceManager={props.deviceManager}
                switchCamera={props.switchCamera}
                localVideoStream={props.localVideoStream}
                callFromMainPage={false}
            />
        </Panel>
    );
};
