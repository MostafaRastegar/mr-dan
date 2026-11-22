/**
 * Persian-aware tokenizer for BM25.
 *
 * Port of mr-rag/app/infrastructure/hybrid_retriever.py::persian_preprocess.
 *
 * Handles details that break naive whitespace splitting on Persian text:
 *   - Zero-width non-joiner (U+200C, نیم‌فاصله) and other format chars
 *     are treated as separators, so "نیم‌فاصله" also matches "نیم فاصله".
 *   - Arabic/Persian letter variants are unified (ي→ی, ك→ک, ۀ→ه, أ→ا, إ→ا)
 *     so spelling differences do not fragment term matching.
 *   - Punctuation is stripped and tokens shorter than 2 chars dropped.
 *
 * Must stay byte-for-byte consistent with the oracle; any change here
 * alters BM25 tokenization and therefore retrieval parity.
 */

const FORMAT_CHARS = ["\u200C", "\u200F", "\u200E"]; // ZWNJ, RLM, LRM

// Arabic/Persian letter variant unification (order matters not; distinct codepoints)
const VARIANT_MAP: Record<string, string> = {
  "\u064A": "\u06CC", // ي -> ی  (Arabic yeh -> Persian yeh)
  "\u0643": "\u06A9", // ك -> ک  (Arabic kaf -> Persian kaf)
  "\u06D5": "\u0647", // ۀ -> ه  (Arabic heh goal -> heh)
  "\u0623": "\u0627", // أ -> ا  (alif with hamza above -> alif)
  "\u0625": "\u0627", // إ -> ا  (alif with hamza below -> alif)
};

/**
 * Tokenize text for BM25 with Persian-aware normalization.
 *
 * Mirrors oracle `persian_preprocess` exactly so BM25 indexes built on
 * either side produce comparable tokens.
 */
export function persianPreprocess(text: string): string[] {
  if (!text) {
    return [];
  }

  let normalized = text;

  // Format characters -> space
  for (const ch of FORMAT_CHARS) {
    normalized = normalized.split(ch).join(" ");
  }

  // Letter variant unification
  for (const [from, to] of Object.entries(VARIANT_MAP)) {
    normalized = normalized.split(from).join(to);
  }

  normalized = normalized.toLowerCase();

  // Split on anything that is not a word char or Persian/Arabic block
  const tokens = normalized.split(/[^\w\u0600-\u06FF]+/);

  return tokens.filter((t) => t.length > 1);
}
