import QRCode from "qrcode";

export async function createQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, { width: 200, margin: 1 });
  } catch {
    return "";
  }
}
