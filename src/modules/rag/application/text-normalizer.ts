/**
 * Text normalization.
 *
 * Normalization happens BEFORE splitting and is identical for all formats.
 * Output must be byte-identical to the oracle's normalizer on the same input,
 * because downstream chunking and parity comparisons depend on it.
 */

const BOM = "\uFEFF";
const ZWNJ = "\u200c";

/**
 * Normalize raw document text.
 *
 * Steps (in order):
 * 1. Remove BOM (U+FEFF)
 * 2. Normalize line endings: \r\n and \r -> \n
 * 3. Remove vertical tab \v and form feed \f
 * 4. Collapse runs of horizontal whitespace (space, tab, non-breaking space) into one space
 * 5. Collapse 2+ blank lines into a single blank line
 * 6. Trim leading/trailing whitespace
 */
export function normalizeText(text: string): string {
  let result = text.replace(BOM, "");

  // line endings
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // vertical tab / form feed
  result = result.replace(/\v/g, "").replace(/\f/g, "");

  // horizontal whitespace runs -> single space (but preserve newlines)
  result = result.replace(/[ \t\u00A0]+/g, " ");

  // 2+ consecutive blank lines -> one blank line
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Strip ZWNJ characters. Used by the Persian tokenizer when comparing tokens.
 */
export function stripZWNJ(text: string): string {
  return text.replace(new RegExp(ZWNJ, "g"), "");
}
