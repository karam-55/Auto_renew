import QRCode from 'qrcode';

export class QRGeneratorService {
  async generateQrBase64(url: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQrPng(url: string): Promise<Buffer> {
    try {
      const qrCode = await QRCode.toBuffer(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }
}
