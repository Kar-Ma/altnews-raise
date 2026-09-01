import QRCode from 'qrcode';

/** Inline SVG path for a URL — no runtime image fetch, works in the poster too. */
export async function qrSvg(text, { margin = 1 } = {}) {
  return QRCode.toString(text, { type: 'svg', margin, errorCorrectionLevel: 'M' });
}

export async function qrModules(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  return { size: qr.modules.size, data: qr.modules.data };
}
