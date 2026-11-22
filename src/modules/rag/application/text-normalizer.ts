/**
 * Text normalization.
 *
 * Normalization happens BEFORE splitting and is identical for all formats.
 * Output must be byte-identical to the oracle's normalizer on the same input,
 * because downstream chunking and parity comparisons depend on it.
 *
 * Oracle reference: mr-rag/app/infrastructure/text_normalizer.py
 *
 * Steps (in order):
 *  1. Strip UTF-8 BOM (U+FEFF) — everywhere in the string
 *  2. Normalize line endings to \n (CRLF and lone CR)
 *  3. Vertical tab \x0B and form feed \x0C -> \n
 *  4. Collapse runs of 2+ horizontal whitespace (space, tab, NBSP) -> one space
 *  5. Collapse 3+ consecutive newlines to a paragraph break \n\n
 *  6. Strip leading/trailing whitespace
 *
 * Arabic/Persian letter variants are deliberately NOT unified here: that
 * mapping is for token matching (see the BM25 preprocessor), and rewriting
 * document text would alter quoted values such as part numbers.
 */

const BOM = "\uFEFF";

/**
 * Normalize raw document text.
 */
export function normalizeText(text: string): string {
  if (!text) {
    return "";
  }

  // 1. BOM everywhere (Python str.replace replaces all occurrences)
  let result = text.split(BOM).join("");

  // 2. Line endings
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 3. Vertical tab / form feed -> newline
  result = result.replace(/\x0B/g, "\n").replace(/\x0C/g, "\n");

  // 4. Runs of 2+ horizontal whitespace -> single space
  result = result.replace(/[ \t\u00A0]{2,}/g, " ");

  // 5. 3+ consecutive newlines -> one blank line (paragraph break)
  result = result.replace(/\n{3,}/g, "\n\n");

  // 6. Trim
  return result.trim();
}
