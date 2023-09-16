// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Results } from "@mediapipe/holistic";

export const processHolisticResults = (results: Results) => {
    var ip = new Array(1);
    ip[0] = new Array(126 + 99);

    if (results.poseLandmarks) {
        for (let idx = 0; idx < 33; idx++) {
            ip[0][idx * 3] = results.poseLandmarks[idx].x;
            ip[0][idx * 3 + 1] = results.poseLandmarks[idx].y;
            ip[0][idx * 3 + 2] = results.poseLandmarks[idx].z;
        }
    } else {
        for (let idx = 0; idx < 33; idx++) {
            ip[0][idx * 3] = 0.0;
            ip[0][idx * 3 + 1] = 0.0;
            ip[0][idx * 3 + 2] = 0.0;
        }
    }
    if (results.leftHandLandmarks) {
        for (let idx = 0; idx < 21; idx++) {
            ip[0][99 + idx * 3] = results.leftHandLandmarks[idx].x;
            ip[0][99 + idx * 3 + 1] = results.leftHandLandmarks[idx].y;
            ip[0][99 + idx * 3 + 2] = results.leftHandLandmarks[idx].z;
        }
    } else {
        for (let idx = 0; idx < 21; idx++) {
            ip[0][99 + idx * 3] = 0.0;
            ip[0][99 + idx * 3 + 1] = 0.0;
            ip[0][99 + idx * 3 + 2] = 0.0;
        }
    }
    if (results.rightHandLandmarks) {
        for (let idx = 0; idx < 21; idx++) {
            ip[0][99 + 63 + idx * 3] = results.rightHandLandmarks[idx].x;
            ip[0][99 + 63 + idx * 3 + 1] = results.rightHandLandmarks[idx].y;
            ip[0][99 + 63 + idx * 3 + 2] = results.rightHandLandmarks[idx].z;
        }
    } else {
        for (let idx = 0; idx < 21; idx++) {
            ip[0][99 + 63 + idx * 3] = 0.0;
            ip[0][99 + 63 + idx * 3 + 1] = 0.0;
            ip[0][99 + 63 + idx * 3 + 2] = 0.0;
        }
    }
    return ip;
};
