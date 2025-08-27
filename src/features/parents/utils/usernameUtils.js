// src/features/parents/utils/usernameUtils.js
export function generateUsername(fullName) {
  // Take letters only, lowercase, first 6 letters, prefix 'yor' and suffix 2501 as example
  const lettersOnly = fullName.toLowerCase().replace(/[^a-z]/g, "");
  const base = lettersOnly.slice(0, 6);
  return `yor${base}2501`;
}
