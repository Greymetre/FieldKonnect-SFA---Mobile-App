export const normalizeIndianMobileNumber = (value?: string | number | null) => {
  const digits = String(value ?? '').replace(/\D/g, '');

  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  return digits;
};

export const formatMobileNumberList = (value?: string | number | null) =>
  String(value ?? '')
    .split(',')
    .map(number => normalizeIndianMobileNumber(number))
    .filter(Boolean);
