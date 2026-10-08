// De Altura Wines is our supplier/partner (not the store brand).
// TODO: no partner logo exists in the repo yet. Drop the file at
// web/public/partners/de-altura-wines.png and swap the styled text below for
// <Image src="/partners/de-altura-wines.png" alt="De Altura Wines" ... />.
export const PARTNER_URL = "https://dealturawines.com/es/";

export function PartnerLogo({ className = "" }: { className?: string }) {
  return (
    <a
      href={PARTNER_URL}
      target="_blank"
      rel="noopener"
      aria-label="De Altura Wines"
      className={`font-serif tracking-wide hover:text-gold-500 transition-colors ${className}`}
    >
      De Altura Wines
    </a>
  );
}
