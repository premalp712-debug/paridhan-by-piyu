import {downloadEnquiry} from './enquiry-pdf';
import {enquiryPriceLines} from './pricing';

const ownerPhone = '919106815205';
export function enquiryWhatsAppUrl(e: any) {
  const lines = [
    'PARIDHAN BY PIYU', `${e.intent} enquiry`, `Reference: ${e.id}`,
    `Customer: ${e.name}`, `WhatsApp: +91 ${e.phone}`,
    `Outfit: ${e.outfit || 'Personal outfit'}`, 'Size: Free Size',
    ...(e.intent === 'Rent' ? [`Pickup: ${e.start}`, `Return: ${e.end}`, `Duration: ${e.days} days`] : []),
    '', ...enquiryPriceLines(e),
    ...(e.description ? ['', `Details: ${e.description}`] : []),
    ...(e.message ? ['', `Special requests: ${e.message}`] : []),
    '', 'Enquiry only. Availability is subject to confirmation.',
  ];
  // Only include a publicly reachable photo URL. A localhost URL cannot be
  // opened by the owner on another phone. Never include private customer links.
  if (e.image && typeof window !== 'undefined') {
    try { const photo = new URL(e.image, window.location.origin);
    if (photo.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(photo.hostname)) {
      lines.push(`Outfit photo: ${photo.href}`);
    } } catch { /* An invalid image must not prevent the chat opening. */ }
  }
  return `https://wa.me/${ownerPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

// Run synchronously from submit, before fetch, while browser user activation
// is still available. No customer data is transmitted until the save succeeds.
export function prepareWhatsAppWindow(): Window | null {
  try {
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.title = 'Preparing your enquiry';
      popup.document.body.textContent = 'Saving your enquiry. WhatsApp will open shortly…';
    }
    return popup;
  } catch { return null; }
}

export async function finishWhatsAppEnquiry(e: any, popup: Window | null) {
  const url = enquiryWhatsAppUrl(e);
  let opened = false;
  if (popup && !popup.closed) {
    try { popup.location.replace(url); opened = true; } catch { /* use current tab below */ }
  }
  if (!opened) {
    // A blocked popup or a slow PDF image must never keep the user in a share menu.
    // The saved enquiry remains available in Admin if a download is needed later.
    window.location.assign(url);
    return {downloaded: false};
  }
  // Best effort only: PDF generation does not delay WhatsApp navigation or lock the form.
  void downloadEnquiry(e).catch(() => {});
  return {downloaded: false};
}
