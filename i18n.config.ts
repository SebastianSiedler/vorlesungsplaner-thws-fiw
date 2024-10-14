import en from "./locales/en.json";
import de from "./locales/de.json";
import * as vuetifyLocales from "vuetify/locale";

const getBrowserLocale = (supportedLocales: string[] = []) => {
  if (navigator.languages !== undefined) {
    // Loop through each language and return the first one that is usable
    for (const locale of navigator.languages) {
      const strippedLocale = locale.split("-")[0]; // Get the primary language code
      if (supportedLocales.includes(strippedLocale)) {
        return locale;
      }
    }
  }
  // Fallback to navigator.language if no usable locale is found
  return navigator.language;
};

export default defineI18nConfig(() => ({
  legacy: false,
  locale: getBrowserLocale() || "en",
  fallbackLocale: "en",
  messages: {
    de: { ...de, $vuetify: vuetifyLocales.de },
    en: { ...en, $vuetify: vuetifyLocales.en },
  },
}));
