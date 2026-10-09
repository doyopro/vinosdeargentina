// Text wordmark for the store brand. Accent on ".es".
export function Wordmark({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={className}>
      <span className={tone === "light" ? "text-white" : "text-brand-900"}>VinoArgentino</span>
      <span className="text-sky-500">.es</span>
    </span>
  );
}
