import de from './de';
import en from './en';
import fr from './fr';

export const locales = { de, en, fr };

export type Language = keyof typeof locales;
