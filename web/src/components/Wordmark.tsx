// Text wordmark for the store brand. Accent on ".es".
export function Wordmark({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={className}>
      <span className={tone === "light" ? "text-white" : "text-wine-900"}>VinoArgentino</span>
      <span className="text-gold-500">.es</span>
    </span>
  );
}
