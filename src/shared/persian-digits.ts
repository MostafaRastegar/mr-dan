/**
 * Persian/Arabic digit normalization.
 *
 * Usernames and emails typed with a Persian keyboard are normalized to ASCII
 * before lookup. Passwords are never normalized: Persian digits are legitimate
 * password characters.
 */

const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

export function toAsciiDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      return String(code - PERSIAN_ZERO);
    }
    return String(code - ARABIC_ZERO);
  });
}
