// WhatsApp sharing uses a normal wa.me link. No provider API, access token or automatic delivery.
export function whatsAppReady(){return false;}
export async function sendInvoice(o:any){return o.demo?'sample_not_sent':o.customer.consent?'ready_to_share':'not_requested';}
