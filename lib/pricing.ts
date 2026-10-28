export const rentalPriceNote = 'Rental price will be confirmed after enquiry.';
export function salePrice(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 10000000 && Math.abs(value * 100 - Math.round(value * 100)) < 0.00001 ? Math.round(value * 100) / 100 : null;
}
export function buyPriceLabel(value: unknown) {
  const price = salePrice(value);
  return price === null ? 'Purchase price on request' : new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2}).format(price);
}
export function enquiryPricing(intent: string, value: unknown) {
  const price = intent === 'Buy' ? salePrice(value) : null;
  return {currency:'INR', quantity:intent === 'Buy' ? 1 : null, unitPrice:price, total:price,
    pricingNote:intent === 'Rent' ? rentalPriceNote : intent === 'Buy' ? (price === null ? 'Purchase price will be confirmed after enquiry.' : 'Listed outfit price. Payment pending; delivery or alterations, if any, are confirmed separately.') : 'Price will be confirmed after consultation.'};
}
export function enquiryPriceLines(e: any): string[] {
  const price = e.intent === 'Buy' ? salePrice(e.unitPrice) : null;
  return e.intent === 'Rent' ? [rentalPriceNote] : price === null ? [e.pricingNote || 'Price to be confirmed by the atelier.'] : ['Unit price: INR '+price.toFixed(2),'Quantity: 1','Outfit total: INR '+price.toFixed(2),'Payment: Pending'];
}
