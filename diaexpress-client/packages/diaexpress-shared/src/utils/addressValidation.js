const phoneRegex = /^\+?[0-9\s().-]{7,20}$/;
const countryRegex = /^[A-Za-z]{2,}$/;

export const validatePhone = (phone) => {
  if (!phone) return false;
  return phoneRegex.test(phone.trim());
};

export const validateCountry = (country) => {
  if (!country) return false;
  return countryRegex.test(country.trim());
};

export const normaliseCountry = (country) => country?.trim().toUpperCase() || '';
