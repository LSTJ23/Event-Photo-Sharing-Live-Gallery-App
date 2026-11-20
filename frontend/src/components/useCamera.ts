"use client";

import { useEffect, useRef, useState } from "react";

/**
 * What to ask the camera for.
 * - Laptops and desktops: a width only, so the webcam keeps its own shape
 *   (usually 16:9). Asking for a shape too would make the browser crop it.
 * - Phones: 4:3, the shape the phone's own Camera app takes photos in. It's the
 *   sensor's natural shape, so it shows the widest view, and held upright it
 *   fills the screen's width. (Phones otherwise send a narrow 9:16 video.)
 */
function cameraConstraints(facing: Facing): MediaTrackConstraints {
  const isPhone = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return isPhone
    ? { facingMode: { ideal: facing }, width: { ideal: 1920 }, aspectRatio: { ideal: 4 / 3 } }
    : { facingMode: { ideal: facing }, width: { ideal: 1920 } };
}

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
          video: cameraConstraints(facing),
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

export { captureFrame } from "@/lib/captureFrame";
