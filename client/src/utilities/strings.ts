// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const _strings = {
    SYSTEM_NAME: "Accessible Connect",
    // Feedback and Reactions
    FEEDBACK_ATTENTION: "Request user to look at you",
    FEEDBACK_ATTENTION_MESSAGE: "Please look at me",
    FEEDBACK_WITHIN_FRAME: "Request user to keep their upper body visible",
    FEEDBACK_WITHIN_FRAME_MESSAGE: "Please keep your upper body visible",
    FEEDBACK_BACKGROUND: "Request user to turn on lights",
    FEEDBACK_BACKGROUND_MESSAGE: "Please turn on some lights",
    FEEDBACK_SPEAK_SLOWLY: "Request user to speak slowly",
    FEEDBACK_SPEAK_SLOWLY_MESSAGE: "Please speak slower",
    FEEDBACK_EASIER_LANGUAGE: "Request user to use easier language",
    FEEDBACK_EASIER_LANGUAGE_MESSAGE: "Please use easier language",
    FEEDBACK_REPEAT: "Request user to repeat what they said",
    FEEDBACK_REPEAT_MESSAGE: "Please repeat what you said",
    // Participant Types
    ADMIN_PARTICIPANT_TYPE: "Admin",
    DHH_PARTICIPANT_TYPE: "Deaf",
    HEARING_PARTICIPANT_TYPE: "Hearing",
    INTERPRETER_PARTICIPANT_TYPE: "Interpreter",
    // Participant Type Color
    DHH_PARTICIPANT_TYPE_COLOR: "#2B8530",
    HEARING_PARTICIPANT_TYPE_COLOR: "#1976d2",
    INTERPRETER_PARTICIPANT_TYPE_COLOR: "#DC2E45",
};

type Strings = typeof _strings;

export type StringId = keyof Strings;

export const getString = (key: StringId) => {
    const found = _strings[key];
    if (!found) {
        return "MISSING STRING";
    } else {
        return found;
    }
};
