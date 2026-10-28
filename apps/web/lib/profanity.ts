// Turkish profanity filter for student text (reports, suggestions). The same lists live in the database
// (private.has_profanity) so a direct API call cannot bypass it; keep both in step.

// Roots that are offensive wherever a word starts with them.
const ROOTS = [
  "orospu", "amcık", "amcik", "amına", "amina", "yarrak", "yarak", "siktir", "sikik", "sikiş", "sikis",
  "sikerim", "sikeyim", "sikim", "sikti", "pezevenk", "kahpe", "kaltak", "piç", "ibne", "şerefsiz",
  "serefsiz", "gavat", "puşt", "pust", "yavşak", "yavsak", "gerizekalı", "gerizekali", "dangalak",
  "salak", "aptal", "ananı", "anani", "götveren", "gotveren",
];
// Short words that are only offensive on their own ("göt" but not "götürmek", "mal" is not listed: "malzeme").
const WORDS = ["amk", "aq", "oç", "oc", "mk", "göt", "got", "sik", "sg", "piç", "pic", "ibne"];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

export function normalize(text: string): string[] {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
    .map((w) => w.replace(/(\p{L})\1{2,}/gu, "$1$1")); // "siiiktir" -> "siiktir" -> still caught below
}

export function hasProfanity(text: string): boolean {
  for (const raw of normalize(text)) {
    const word = raw.replace(/(\p{L})\1+/gu, "$1");
    for (const w of new Set([raw, word])) {
      if (WORDS.includes(w)) return true;
      if (ROOTS.some((r) => w.startsWith(r))) return true;
    }
  }
  return false;
}

export const PROFANITY_MESSAGE = "Metinde uygunsuz bir ifade var. Lütfen sorunu kibar bir dille anlat.";
