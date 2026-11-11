// Quita el año de añada del nombre de un vino para mostrarlo al cliente
// ("Buenos Aires Malbec 2024" -> "Buenos Aires Malbec"). El dato en la base no cambia.
export const stripVintage = (name: string): string =>
  name.replace(/\s*\b(19|20)\d{2}\b/g, "").replace(/\s{2,}/g, " ").trim();
