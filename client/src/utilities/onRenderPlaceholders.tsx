// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Stack } from "@fluentui/react/lib";
import { SxProps } from "@mui/material";
import { Hearing, HearingDisabled, SignLanguage } from "@mui/icons-material";
import { getString } from "@/utilities/strings";

const sx: SxProps = {
    border: 1,
    borderRadius: "150px",
    fontSize: 60,
    margin: "auto",
    padding: "10px",
    position: "absolute",

    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
};

export const onRenderPlaceholderDHH = (): JSX.Element => (
    <Stack>
        <Stack>
            <HearingDisabled
                style={{
                    color: getString("DHH_PARTICIPANT_TYPE_COLOR"),
                }}
                sx={sx}
            />
        </Stack>
    </Stack>
);

export const onRenderPlaceholderHearing = (): JSX.Element => (
    <Stack>
        <Hearing
            style={{
                color: getString("HEARING_PARTICIPANT_TYPE_COLOR"),
            }}
            sx={sx}
        />
    </Stack>
);

export const onRenderPlaceholderInterpreter = (): JSX.Element => (
    <Stack>
        <SignLanguage
            style={{
                color: getString("INTERPRETER_PARTICIPANT_TYPE_COLOR"),
            }}
            sx={sx}
        />
    </Stack>
);
