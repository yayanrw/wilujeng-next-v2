import { useUiStore } from '../stores/uiStore';
import en from './en.json';
import id from './id.json';

const translations = {
  en,
  id,
};

export function useTranslation() {
  const language = useUiStore((state) => state.language);
  const t = translations[language] || translations.en;
  
  return { t, language };
}