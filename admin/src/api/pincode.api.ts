export interface PincodeOffice {
  name: string;
  district: string;
  state: string;
}

export interface PincodeLookupResult {
  postOffice: string;
  district: string;
  state: string;
  offices: PincodeOffice[];
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
  const offices: PincodeOffice[] = record.PostOffice.map((o: any) => ({ name: o.Name, district: o.District, state: o.State }));
  const office = offices[0];
  return { postOffice: office.name, district: office.district, state: office.state, offices };
}
