// Turning the live camera picture into a photo that matches what was on screen.

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * The part of the camera picture that's visible in the viewfinder.
 * - "contain": the whole picture shows, so the whole picture is used.
 * - "cover": the picture fills the viewfinder and its edges are cut off; only
 *   the visible middle part is used, so the photo matches the screen.
 */
export function visibleCrop(
  videoWidth: number,
  videoHeight: number,
  boxWidth: number,
  boxHeight: number,
  fit: string
): CropRect {
  const full = { sx: 0, sy: 0, sw: videoWidth, sh: videoHeight };
  if (fit !== "cover" || !boxWidth || !boxHeight || !videoWidth || !videoHeight) return full;

  const boxAspect = boxWidth / boxHeight;
  const videoAspect = videoWidth / videoHeight;
  if (Math.abs(boxAspect - videoAspect) < 0.005) return full;

  if (videoAspect > boxAspect) {
    // Picture is wider than the viewfinder: its left and right edges are hidden.
    const sw = Math.round(videoHeight * boxAspect);
    return { sx: Math.round((videoWidth - sw) / 2), sy: 0, sw, sh: videoHeight };
  }
  // Picture is taller than the viewfinder: its top and bottom are hidden.
  const sh = Math.round(videoWidth / boxAspect);
  return { sx: 0, sy: Math.round((videoHeight - sh) / 2), sw: videoWidth, sh };
}

/**
 * Grabs the current camera frame as a JPEG at full resolution, cropped to what
 * the viewfinder shows and mirrored for the front camera, so the photo looks
 * exactly like the preview.
 */
export function captureFrame(video: HTMLVideoElement, mirror: boolean): Promise<Blob | null> {
  const fit = getComputedStyle(video).objectFit;
  const { sx, sy, sw, sh } = visibleCrop(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, fit);
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const context = canvas.getContext("2d");
  if (!context || !sw || !sh) return Promise.resolve(null);
  if (mirror) {
    context.translate(sw, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}
