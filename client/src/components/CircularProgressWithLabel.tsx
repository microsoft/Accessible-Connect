// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Box, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import CircularProgress, {
    CircularProgressProps,
} from "@mui/material/CircularProgress";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";

import Emoji from "react-emojis";

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#424242",
        color: "rgb(244, 244, 244)",
        boxShadow: theme.shadows[1],
        fontSize: 12,
        margin: 4,
        padding: 8,
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: "#424242",
        fontSize: 21,
    },
}));

export const CircularProgressWithLabel = (
    props: CircularProgressProps & {
        broadcastSignalMessage: (
            signalMessage: string,
            signalCode: number,
            _event?: React.MouseEvent<HTMLButtonElement>,
        ) => void;
        emoji: string;
        emojiSignalCode: number;
        emojiSignalMessage: string;
        title: NonNullable<React.ReactNode>;
        value: number;
    },
) => {
    const sxProps = {
        "&:hover": { backgroundColor: "#424242" },
    };

    return (
        <LightTooltip title={props.title} arrow>
            <IconButton
                aria-label={props.emojiSignalMessage}
                onClick={(event) =>
                    props.broadcastSignalMessage(
                        props.emojiSignalMessage,
                        props.emojiSignalCode,
                        event,
                    )
                }
                onMouseDown={(e) => e.preventDefault()}
                sx={sxProps}
            >
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                        color={props.color}
                        value={props.value}
                        thickness={props.thickness}
                        variant="determinate"
                    />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Emoji emoji={props.emoji} />
                    </Box>
                </Box>
            </IconButton>
        </LightTooltip>
    );
};
