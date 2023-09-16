// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import io from "socket.io-client";

const socket = io(
    process.env.REACT_APP_SERVER_BASE_URL || "http://localhost:8080",
);

export default socket;
