"use client";

import { useTranslations } from "next-intl";

interface Section {
  h: string;
  p: string[];
}

export type LegalDoc = "aviso" | "privacidad" | "cookies" | "condiciones" | "envios";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const t = useTranslations("legal");
  const sections = t.raw(`${doc}.sections`) as Section[];
  return (
    <div className="bg-stone-50">
      <div className="max-w-3xl mx-auto px-5 py-10 md:py-16">
        <p
          role="note"
          className="inline-block mb-6 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-600"
        >
          {t("draftNotice")}
        </p>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-wine-900">{t(`${doc}.title`)}</h1>
        <p className="mt-3 text-xs text-stone-400">{t("updated")}</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-serif font-bold text-wine-900 mb-3">{s.h}</h2>
              <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                {s.p.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
