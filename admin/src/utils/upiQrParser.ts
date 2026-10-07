export interface ParsedUpiResult {
  upiId: string;
  payeeName?: string;
  rawText: string;
}

/**
 * Parses scanned QR text to extract UPI ID and Payee Name (if present).
 * Supports standard `upi://pay?pa=...&pn=...` URIs as well as direct `name@bank` strings.
 */
export function parseUpiQrCode(scannedText: string): ParsedUpiResult | null {
  if (!scannedText) return null;
  const text = scannedText.trim();

  // 1. Standard upi://pay URI or strings containing pa= parameter
  if (text.toLowerCase().includes('pa=')) {
    try {
      let urlStr = text;
      if (!urlStr.includes('://')) {
        urlStr = 'http://dummy?' + urlStr;
      } else {
        urlStr = urlStr.replace(/^upi:\/\/pay/i, 'http://dummy');
      }

      const url = new URL(urlStr);
      const pa = url.searchParams.get('pa') || url.searchParams.get('PA');
      const pn = url.searchParams.get('pn') || url.searchParams.get('PN');

      if (pa && pa.trim()) {
        const cleanPa = pa.trim();
        let cleanPn: string | undefined = undefined;
        if (pn && pn.trim()) {
          cleanPn = decodeURIComponent(pn.replace(/\+/g, ' ')).trim();
        }
        return {
          upiId: cleanPa,
          payeeName: cleanPn,
          rawText: text,
        };
      }
    } catch (e) {
      // Fallback regex if URL parsing fails
    }

    const paMatch = text.match(/[?&]pa=([^&]+)/i);
    const pnMatch = text.match(/[?&]pn=([^&]+)/i);
    if (paMatch && paMatch[1]) {
      const cleanPa = decodeURIComponent(paMatch[1]).trim();
      let cleanPn: string | undefined = undefined;
      if (pnMatch && pnMatch[1]) {
        cleanPn = decodeURIComponent(pnMatch[1].replace(/\+/g, ' ')).trim();
      }
      return {
        upiId: cleanPa,
        payeeName: cleanPn,
        rawText: text,
      };
    }
  }

  // 2. Direct UPI ID regex pattern (e.g. surindersinghmakhu-5@oksbi, 9876543210@ybl)
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}/;
  const match = text.match(upiRegex);
  if (match && match[0]) {
    return {
      upiId: match[0].trim(),
      rawText: text,
    };
  }

  return null;
}
