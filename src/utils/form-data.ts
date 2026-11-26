/** `FormData` → plain object for zod parsing inside a Server Action. */
export function formValues(
  formData: FormData,
): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}
