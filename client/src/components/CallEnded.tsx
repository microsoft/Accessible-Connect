// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IStackTokens, IStackStyles, Stack } from "@fluentui/react";

export function CallEnded(): JSX.Element {
    const outerStackTokens: IStackTokens = { childrenGap: 5 };

    const stackStyles: IStackStyles = {
        root: [
            {
                height: "100vh",
                marginLeft: 10,
                marginRight: 10,
            },
        ],
    };

    return (
        <Stack tokens={outerStackTokens} styles={stackStyles}>
            <Stack.Item align="center">
                <h1>You have ended the call.</h1>
                <h2>Thank You for your participation.</h2>
            </Stack.Item>
        </Stack>
    );
}
