"use client";

import { useEffect, useRef, useState } from "react";

export type CameraStatus = "starting" | "ready" | "denied" | "unsupported" | "error";
export type Facing = "environment" | "user";

/**
 * Streams the device camera into a <video>. Browsers only allow this on
 * https:// pages or on localhost.
 */
export function useCamera(facing: Facing = "environment") {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");
  /** How many cameras the device has (known once the camera starts). */
  const [cameraCount, setCameraCount] = useState(0);
  /** Whether the camera in use faces the user, so the preview should be mirrored. */
  const [frontFacing, setFrontFacing] = useState(false);
  /** Width ÷ height of the camera feed, e.g. 1.78 for a 16:9 laptop webcam. */
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    const video = videoRef.current;
    const readShape = () => {
      if (video && video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
    };
    // "resize" also fires when a phone is rotated and the feed changes shape.
    video?.addEventListener("loadedmetadata", readShape);
    video?.addEventListener("resize", readShape);

    const start = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({
          // Ask for a width only. Giving a height too makes the browser crop the
          // feed to that shape; this way it keeps the camera's own shape
          // (wide on laptops, tall on phones held upright).
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 } },
          audio: false
        })
      : Promise.reject(Object.assign(new Error("No camera API"), { name: "NotSupportedError" }));

    start
      .then((media) => {
        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (video) {
          video.srcObject = media;
          video.play().catch(() => {});
        }
        setStatus("ready");
        return navigator.mediaDevices.enumerateDevices().then((devices) => {
          if (!active) return;
          const count = devices.filter((device) => device.kind === "videoinput").length;
          const reported = media.getVideoTracks()[0]?.getSettings().facingMode;
          setCameraCount(count);
          // Laptop webcams often don't report a direction; a lone camera is almost always the front one.
          setFrontFacing(reported ? reported === "user" : count <= 1 || facing === "user");
        });
      })
      .catch((error: { name?: string }) => {
        if (!active) return;
        if (error.name === "NotAllowedError" || error.name === "SecurityError") setStatus("denied");
        else if (error.name === "NotSupportedError" || error.name === "NotFoundError") setStatus("unsupported");
        else setStatus("error");
      });

    return () => {
      active = false;
      video?.removeEventListener("loadedmetadata", readShape);
      video?.removeEventListener("resize", readShape);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  return { videoRef, status, setStatus, cameraCount, frontFacing, aspect };
}

/** Grabs the current video frame as a JPEG. Mirrors it for the front camera. */
export function captureFrame(video: HTMLVideoElement, mirror: boolean): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context || !canvas.width) return Promise.resolve(null);
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}
