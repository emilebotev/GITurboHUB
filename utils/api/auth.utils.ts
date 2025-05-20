export const isValidEmail = (email: string) => {
  const emailValidationRegexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailValidationRegexp.test(email);
}