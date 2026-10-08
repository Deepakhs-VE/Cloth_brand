import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

export const isValidInternationalPhone = (value) => {
  if (!value) return true;
  const phone = parsePhoneNumberFromString(String(value).trim());
  return Boolean(phone?.isValid());
};

export const normalizePhoneNumber = (
  value,
  { required = false, fieldName = 'Phone number' } = {}
) => {
  const input = String(value || '').trim();

  if (!input) {
    if (required) {
      const error = new Error(`${fieldName} is required`);
      error.statusCode = 400;
      throw error;
    }
    return '';
  }

  if (!input.startsWith('+')) {
    const error = new Error(`${fieldName} must include a country calling code, for example +919876543210`);
    error.statusCode = 400;
    throw error;
  }

  const phone = parsePhoneNumberFromString(input);
  if (!phone?.isValid()) {
    const error = new Error(`${fieldName} is not valid for the provided country code`);
    error.statusCode = 400;
    throw error;
  }

  return phone.number;
};
