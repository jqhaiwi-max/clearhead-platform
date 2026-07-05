import { createContext, useContext, useState, type ReactNode } from "react";
import { COUNTRIES, COUNTRY_LIST, type CountryPricing } from "@/lib/pricing";

function detectDefault(): CountryPricing {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const lang = navigator.language ?? "";
    if (tz.includes("Amman") || tz.includes("Baghdad") && lang.startsWith("ar")) return COUNTRIES.JO;
    if (tz.includes("Riyadh")) return COUNTRIES.SA;
    if (tz.includes("Dubai") || tz.includes("Abu_Dhabi")) return COUNTRIES.AE;
    if (tz.includes("Cairo")) return COUNTRIES.EG;
    if (tz.includes("Beirut")) return COUNTRIES.LB;
    if (tz.includes("Qatar") || tz.includes("Doha")) return COUNTRIES.QA;
    if (tz.includes("Casablanca") || tz.includes("Rabat")) return COUNTRIES.MA;
    if (tz.includes("Istanbul") || tz.includes("Ankara")) return COUNTRIES.TR;
    if (tz.includes("Berlin") || tz.includes("Vienna") || tz.includes("Zurich")) return COUNTRIES.DE;
    if (tz.includes("Paris") || tz.includes("Lyon")) return COUNTRIES.FR;
    if (tz.includes("London")) return COUNTRIES.GB;
    if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles")) return COUNTRIES.US;
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal")) return COUNTRIES.CA;
    if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane")) return COUNTRIES.AU;
    if (tz.includes("Kolkata") || tz.includes("Mumbai") || tz.includes("Delhi")) return COUNTRIES.IN;
  } catch {}
  return COUNTRIES.JO;
}

type CountryCtx = {
  country: CountryPricing;
  setCountry: (c: CountryPricing) => void;
  countryList: CountryPricing[];
};

const CountryContext = createContext<CountryCtx>({
  country: COUNTRIES.JO,
  setCountry: () => {},
  countryList: COUNTRY_LIST,
});

const COUNTRY_STORAGE_KEY = "clearhead_country";

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryPricing>(() => {
    try {
      const saved = localStorage.getItem(COUNTRY_STORAGE_KEY);
      if (saved) {
        const found = COUNTRY_LIST.find(c => c.code === saved);
        if (found) return found;
      }
    } catch {}
    return detectDefault();
  });

  const setCountry = (c: CountryPricing) => {
    setCountryState(c);
    try { localStorage.setItem(COUNTRY_STORAGE_KEY, c.code); } catch {}
  };

  return (
    <CountryContext.Provider value={{ country, setCountry, countryList: COUNTRY_LIST }}>
      {children}
    </CountryContext.Provider>
  );
}

export const useCountry = () => useContext(CountryContext);
