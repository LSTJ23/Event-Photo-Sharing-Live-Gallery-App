import type { Request, Response } from "express";
import { buildShareUrl } from "../qr.js";

// This interface defines the dependencies required for generating 
// a QR code for an event.
export interface EventQrDeps {
  // Returns null when the event doesn't exist.
  findEventCode(eventId: string): Promise<string | null>;
  generateQr(text: string): Promise<string>;
  shareBaseUrl: string;
}

// This function creates an Express request handler for generating a QR code for a specific event. 
// It takes dependencies as an argument, which includes methods to find the event code, 
// generate the QR code, and the base URL for sharing.
export function createEventQrHandler(deps: EventQrDeps) {
  return async (request: Request, response: Response) => {
    const eventId = String(request.params.id ?? "").trim();
    if (!eventId) {
      return response.status(400).json({ error: "Event id is required." });
    }

    try {
      const eventCode = await deps.findEventCode(eventId);
      if (!eventCode) {
        return response.status(404).json({ error: "Event not found." });
      }

      const shareUrl = buildShareUrl(deps.shareBaseUrl, eventCode);
      const qrCode = await deps.generateQr(shareUrl);

      return response.status(200).json({ eventId, shareUrl, qrCode });
    } catch {
      return response.status(500).json({ error: "Could not generate the QR code." });
    }
  };
}