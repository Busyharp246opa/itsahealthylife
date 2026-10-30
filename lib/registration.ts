export const PASSWORD_LENGTH = 8;
export const validPassword = (value: string) => value.length === PASSWORD_LENGTH;
export const cleanText = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
