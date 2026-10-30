export interface PincodeLookupResult {
  postOffice: string;
  district: string;
  state: string;
}

/** India Post's free public PIN-code lookup — no key required, called directly from the client. */
export async function lookupPincode(pincode: string): Promise<PincodeLookupResult> {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!response.ok) {
    throw new Error('Could not reach PIN code lookup service.');
  }
  const body = await response.json();
  const record = Array.isArray(body) ? body[0] : null;
  if (!record || record.Status !== 'Success' || !record.PostOffice?.length) {
    throw new Error('Invalid PIN code — no matching post office found.');
  }
  const office = record.PostOffice[0];
  return { postOffice: office.Name, district: office.District, state: office.State };
}
