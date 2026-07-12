import axios from 'axios';

// OTS digest endpoint expects 32-byte binary SHA-256 digest
const OTS_CALENDAR_URLS = [
  'https://alice.btc.calendar.opentimestamps.org/digest',
  'https://bob.btc.calendar.opentimestamps.org/digest',
  'https://finney.calendar.uol.com.br/digest',
];

export async function submitToOTS(hashHex: string): Promise<string | null> {
  // Convert hex hash to Buffer/Uint8Array
  if (!hashHex || hashHex.length !== 64) {
    throw new Error('Invalid SHA-256 hex string. Must be 64 characters.');
  }

  const binaryHash = new Uint8Array(
    hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Try calendars until one works
  for (const url of OTS_CALENDAR_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: binaryHash,
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString('base64');
      }
    } catch (error) {
      console.warn(`Failed to submit hash to OTS calendar ${url}:`, error);
    }
  }

  return null;
}
