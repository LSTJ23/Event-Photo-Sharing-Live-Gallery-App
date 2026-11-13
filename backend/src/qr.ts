import QRCode from "qrcode"; 

// Share link guests open after scanning the QR code.export function buildShareUrl(baseUrl: string, eventCode: string): string {
export function buildShareUrl(baseUrl: string, eventCode: string): string {
    return `${baseUrl.replace(/\/+$/, "")}/event/${encodeURIComponent(eventCode)}`;
}

// This function generates a QR code data URL for the given text using the 'qrcode' library. It sets the error correction level to "M", margin to 2, and width to 512 pixels.
export function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 2, width: 512 });
}