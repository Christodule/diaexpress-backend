const flattenClassValue = (value) => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenClassValue);
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([key]) => key);
  }

  return [];
};

export function cn(...inputs) {
  return inputs.flatMap(flattenClassValue).filter(Boolean).join(' ');
}
