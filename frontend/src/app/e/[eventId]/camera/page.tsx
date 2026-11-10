"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import { useEventSession } from "@/components/EventSession";
import { AlbumIcon, FlipCameraIcon, GalleryIcon } from "@/components/icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { captureFrame, useCamera, type Facing } from "@/components/useCamera";
import styles from "@/components/flow.module.css";

export default function CameraPage() {
  const router = useRouter();
  const { event, setDraft } = useEventSession();
  const [facing, setFacing] = useState<Facing>("environment");
  const { videoRef, status, setStatus, cameraCount, frontFacing, aspect } = useCamera(facing);
  const canFlip = cameraCount > 1;
  const [capturing, setCapturing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const acceptPhoto = (blob: Blob) => {
    setDraft(blob);
    router.push(`/e/${event.id}/preview`);
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || capturing) return;
    setCapturing(true);
    const blob = await captureFrame(video, frontFacing);
    setCapturing(false);
    if (blob) acceptPhoto(blob);
  };

  const flipCamera = () => {
    setStatus("starting");
    setFacing((current) => (current === "environment" ? "user" : "environment"));
  };

  const chooseFile = () => fileInput.current?.click();
  const blocked = status === "denied" || status === "unsupported" || status === "error";

  return (
    <main
      className={`${styles.screen} ${styles.cameraScreen}`}
      style={{ "--cam-aspect": aspect ?? 16 / 9 } as CSSProperties}
    >
      <ScreenHeader
        title={event.name}
        backHref="/scan"
        right={
          <Link href={`/e/${event.id}/gallery?view=live`} className={styles.headerAction} aria-label="Live Gallery">
            <GalleryIcon size={17} /> <span className={styles.headerActionLabel}>Live Gallery</span>
          </Link>
        }
      />

      <div className={styles.cameraView}>
        <video
          ref={videoRef}
          playsInline
          muted
          className={frontFacing ? styles.mirrored : undefined}
          aria-label="Camera preview"
        />
        {blocked && (
          <div className={styles.cameraNotice}>
            <p>
              {status === "denied"
                ? "Camera access is blocked. Allow it in your browser settings, or choose a photo from your device."
                : "We couldn't open your camera. You can choose a photo from your device instead."}
            </p>
            <button type="button" className={styles.btnSecondary} onClick={chooseFile}>
              Choose a photo
            </button>
          </div>
        )}
      </div>

      <div className={styles.cameraControls}>
        <button type="button" className={styles.cameraAction} onClick={chooseFile}>
          <span className={styles.cameraActionIcon}>
            <AlbumIcon />
          </span>
          <span className={styles.cameraActionLabel}>Album</span>
        </button>
        <button
          type="button"
          className={styles.shutter}
          onClick={takePhoto}
          disabled={status !== "ready" || capturing}
          aria-label="Take photo"
        />
        {/* Always shown so the controls stay balanced; dimmed and disabled on
            devices with only one camera, like most laptops. */}
        <button
          type="button"
          className={styles.cameraAction}
          onClick={flipCamera}
          disabled={blocked || !canFlip}
          title={canFlip ? "Switch camera" : "This device has only one camera"}
        >
          <span className={styles.cameraActionIcon}>
            <FlipCameraIcon />
          </span>
          <span className={styles.cameraActionLabel}>Flip</span>
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className={styles.visuallyHidden}
        tabIndex={-1}
        onChange={(change) => {
          const file = change.target.files?.[0];
          change.target.value = "";
          if (file) acceptPhoto(file);
        }}
      />
    </main>
  );
}
