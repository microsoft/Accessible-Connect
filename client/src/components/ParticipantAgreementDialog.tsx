// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationUserIdentifier } from "@azure/communication-common";
import {
    ChoiceGroup,
    Dialog,
    DialogType,
    DialogFooter,
    IChoiceGroupOption,
    Link,
    PrimaryButton,
    Stack,
    Text,
} from "@fluentui/react";

import { logger } from "@/utilities/logger";

import {
    participantTypes,
    AppConfig,
    ParticipantType,
    ParticipantConfig,
} from "shared/interfaces";
import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";

interface UserAgreementProps {
    show: boolean;
    toggle: () => void;
    appConfig: AppConfig;
    participantConfig: ParticipantConfig;
    setGroupId: React.Dispatch<React.SetStateAction<string>>;
    setSessionId: React.Dispatch<React.SetStateAction<string>>;
    setThreadId: React.Dispatch<React.SetStateAction<string>>;
    setModeratorUserId: React.Dispatch<
        React.SetStateAction<CommunicationUserIdentifier | undefined>
    >;
    setParticipantConfig: React.Dispatch<
        React.SetStateAction<ParticipantConfig>
    >;
}

const ParticipantAgreementDialog = (props: UserAgreementProps) => {
    // Function to handle session selection in participant configuraiton dialog.
    const appInsights = useAppInsightsContext();
    const componentName = "ParticipantAgreementDialog";
    const {
        show,
        toggle,
        appConfig,
        participantConfig,
        setGroupId,
        setSessionId,
        setThreadId,
        setModeratorUserId,
        setParticipantConfig,
    } = props;

    const onSelectSession = (
        ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
        selectedOption?: IChoiceGroupOption | undefined,
    ) => {
        logger.log("onSelectSession");

        if (selectedOption !== undefined) {
            const newSession = appConfig["sessions"].find(
                (i) => i.sessionId === selectedOption.key,
            );
            logger.log("Session Selected: ", newSession);
            appInsights.trackEvent(
                { name: "onSelectSession" },
                { componentName: componentName, sessionId: newSession },
            );

            if (newSession !== undefined) {
                logger.log(`Set groupId: ${newSession["groupId"]}`);
                logger.log(`Set sessionId: ${newSession["id"]}`);
                logger.log(`Set threadId: ${newSession["threadId"]}`);
                logger.log(
                    "Set moderatorUserId: ",
                    newSession["moderatorUserId"],
                );
                setGroupId(newSession["groupId"]);
                setSessionId(newSession["sessionId"]);
                setThreadId(newSession["threadId"]);
                setModeratorUserId(newSession["moderatorUserId"]);
                setParticipantConfig((participantConfig) => ({
                    ...participantConfig,
                    groupId: newSession["groupId"],
                    sessionId: newSession["sessionId"],
                    threadId: newSession["threadId"],
                }));
            }
        }
    };

    // Function to handle participant type selection in participant configuraiton dialog.
    const onSelectParticipantType = (
        ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
        selectedOption?: IChoiceGroupOption | undefined,
    ) => {
        logger.log("onSelectParticipantType");
        logger.log(selectedOption);
        if (selectedOption !== undefined) {
            appInsights.trackEvent(
                { name: "onSelectParticipantType" },
                {
                    componentName: componentName,
                    participantType: selectedOption.text,
                },
            );
            setParticipantConfig((participantConfig) => ({
                ...participantConfig,
                participantType: selectedOption.text as ParticipantType,
            }));
        }
    };

    return (
        <Dialog
            hidden={show}
            minWidth="600px"
            dialogContentProps={{
                type: DialogType.largeHeader,
                title: "Participation Agreement",
            }}
            modalProps={{
                isBlocking: true,
            }}
        >
            <Stack tokens={{ childrenGap: 10 }}>
                <Stack horizontal tokens={{ childrenGap: 30 }}>
                    <Stack>
                        <ChoiceGroup
                            placeholder="Select your Session"
                            options={appConfig.sessions.map((session) => {
                                return {
                                    key: session.sessionId,
                                    text: session.sessionId,
                                };
                            })}
                            onChange={onSelectSession}
                            label="Please Select your Assigned Session"
                        />
                    </Stack>

                    <Stack>
                        <ChoiceGroup
                            placeholder="Select your Participant Group"
                            options={participantTypes.map(
                                (participantType: string) => {
                                    return {
                                        key: participantType,
                                        text: participantType,
                                    };
                                },
                            )}
                            onChange={onSelectParticipantType}
                            label="Please Select your Participant Group"
                        />
                    </Stack>
                </Stack>
                <Stack>
                    <Text
                        variant="medium"
                        styles={{ root: { lineHeight: "1.5rem" } }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <Link
                                href="https://go.microsoft.com/fwlink/?LinkId=521839"
                                underline
                                target="_blank"
                            >
                                Privacy Statement
                            </Link>
                            &nbsp;&nbsp;&nbsp;
                            <Link
                                href="http://go.microsoft.com/fwlink/?LinkId=518021"
                                underline
                                target="_blank"
                            >
                                Data Privacy Notice
                            </Link>
                        </div>
                    </Text>
                </Stack>
            </Stack>
            <DialogFooter styles={{ actionsRight: { textAlign: "center" } }}>
                <PrimaryButton
                    text="Accept"
                    onClick={() => {
                        toggle();
                    }}
                    disabled={
                        participantConfig.sessionId === "" ||
                        participantConfig.participantType === undefined
                    }
                />
            </DialogFooter>
        </Dialog>
    );
};

export default ParticipantAgreementDialog;
