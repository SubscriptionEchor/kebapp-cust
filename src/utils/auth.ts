export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getLangCode = (): string => {
  return localStorage.getItem('selectedLanguage') || 'en';
};