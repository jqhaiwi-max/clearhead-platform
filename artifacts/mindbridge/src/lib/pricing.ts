export type PricingTier = {
  name: string;
  description: string;
  localPrice: number;
  minutesPerSession: number;
  sessionsPerMonth: number;
  recommended: boolean;
  features: string[];
};

export type CountryPricing = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  usdRate: number;
  culturalNote: string;
  legalSystem: string;
  legalFramework: string;
  region: string;
  language: "en" | "ar" | "fr" | "de" | "tr";
  taxRate: number;
  taxNote: string;
  dialCode: string;
  tiers: PricingTier[];
};

type RawCountry = Omit<CountryPricing, "tiers">;

function makeTiers(c: RawCountry): PricingTier[] {
  const r = c.usdRate;
  return [
    {
      name: "Essential",
      description: "Ideal for getting started",
      localPrice: Math.round(45 * r),
      minutesPerSession: 45,
      sessionsPerMonth: 4,
      recommended: false,
      features: ["45-min video sessions", "Text messaging support", "Session notes", "Secure encrypted chat"],
    },
    {
      name: "Standard",
      description: "Most popular for ongoing care",
      localPrice: Math.round(65 * r),
      minutesPerSession: 60,
      sessionsPerMonth: 4,
      recommended: true,
      features: ["60-min video sessions", "Unlimited text messaging", "Session notes", "Crisis support line", "Progress tracking"],
    },
    {
      name: "Premium",
      description: "Intensive, immersive therapy",
      localPrice: Math.round(95 * r),
      minutesPerSession: 90,
      sessionsPerMonth: 4,
      recommended: false,
      features: ["90-min deep-dive sessions", "Unlimited messaging", "Priority scheduling", "Psychiatry add-on eligible", "Family session included"],
    },
  ];
}

const RAW: RawCountry[] = [
  { code: "JO", name: "Jordan",               flag: "🇯🇴", currency: "JOD", symbol: "JD",   usdRate: 0.71,  dialCode: "+962", culturalNote: "Arabic-speaking providers available with culturally-attuned care.", legalSystem: "Jordanian Civil Law", legalFramework: "Jordan Personal Data Protection Law 2023", region: "Middle East", language: "ar", taxRate: 0, taxNote: "No general VAT applies to health services in Jordan." },
  { code: "US", name: "United States",         flag: "🇺🇸", currency: "USD", symbol: "$",    usdRate: 1.0,   dialCode: "+1",   culturalNote: "HIPAA-compliant sessions. Insurance reimbursement may apply.", legalSystem: "US Federal Law", legalFramework: "HIPAA & State Privacy Laws", region: "North America", language: "en", taxRate: 0, taxNote: "Mental health services are generally exempt from sales tax in the US." },
  { code: "GB", name: "United Kingdom",        flag: "🇬🇧", currency: "GBP", symbol: "£",    usdRate: 0.79,  dialCode: "+44",  culturalNote: "Sessions in English, FCA regulated, NHS-complementary.", legalSystem: "English Common Law", legalFramework: "UK GDPR & Data Protection Act 2018", region: "Europe", language: "en", taxRate: 0, taxNote: "Medical and therapy services are VAT-exempt in the UK." },
  { code: "SA", name: "Saudi Arabia",          flag: "🇸🇦", currency: "SAR", symbol: "﷼",    usdRate: 3.75,  dialCode: "+966", culturalNote: "Arabic & Islamic-aware therapy. Female providers available upon request.", legalSystem: "Saudi Islamic Law", legalFramework: "Saudi Personal Data Protection Law (PDPL) 2022", region: "Middle East", language: "ar", taxRate: 0.15, taxNote: "15% VAT applies to telehealth services under Saudi VAT regulations (ZATCA)." },
  { code: "AE", name: "United Arab Emirates",  flag: "🇦🇪", currency: "AED", symbol: "د.إ",  usdRate: 3.67,  dialCode: "+971", culturalNote: "Multilingual providers available. DHA-licensed practitioners.", legalSystem: "UAE Civil Law", legalFramework: "UAE Federal Decree-Law No. 45 of 2021 (PDPL)", region: "Middle East", language: "ar", taxRate: 0.05, taxNote: "5% VAT applies under UAE Federal Decree-Law No. 8 of 2017." },
  { code: "DE", name: "Germany",               flag: "🇩🇪", currency: "EUR", symbol: "€",    usdRate: 0.92,  dialCode: "+49",  culturalNote: "BPtK-regulated. Sessions in German and English.", legalSystem: "German Civil Law (BGB)", legalFramework: "EU GDPR & Bundesdatenschutzgesetz (BDSG)", region: "Europe", language: "de", taxRate: 0, taxNote: "Psychological therapy services are exempt from German VAT (§ 4 Nr. 14 UStG)." },
  { code: "EG", name: "Egypt",                 flag: "🇪🇬", currency: "EGP", symbol: "E£",   usdRate: 30.9,  dialCode: "+20",  culturalNote: "Arabic-speaking providers, WHO affiliated, affordable rates.", legalSystem: "Egyptian Civil Law", legalFramework: "Egyptian Data Protection Law No. 151 of 2020", region: "Middle East & Africa", language: "ar", taxRate: 0.14, taxNote: "14% VAT applies to telehealth services under Egyptian Tax Authority rules." },
  { code: "FR", name: "France",                flag: "🇫🇷", currency: "EUR", symbol: "€",    usdRate: 0.92,  dialCode: "+33",  culturalNote: "French & English sessions, ADELI certified, CNIL compliant.", legalSystem: "French Civil Law", legalFramework: "EU GDPR & Loi Informatique et Libertés (CNIL)", region: "Europe", language: "fr", taxRate: 0, taxNote: "Health and psychotherapy services are VAT-exempt in France (CGI Art. 261)." },
  { code: "LB", name: "Lebanon",               flag: "🇱🇧", currency: "USD", symbol: "$",    usdRate: 1.0,   dialCode: "+961", culturalNote: "Arabic, French & English available. Humanitarian pricing available.", legalSystem: "Lebanese Civil Code", legalFramework: "Lebanese Law No. 81 on Electronic Transactions", region: "Middle East", language: "ar", taxRate: 0.11, taxNote: "11% VAT applies to telehealth services under Lebanese VAT Law 379/2001." },
  { code: "MA", name: "Morocco",               flag: "🇲🇦", currency: "MAD", symbol: "DH",   usdRate: 10.1,  dialCode: "+212", culturalNote: "Darija, French & English sessions available.", legalSystem: "Moroccan Civil Law", legalFramework: "Moroccan Law No. 09-08 on Data Protection", region: "North Africa", language: "ar", taxRate: 0.20, taxNote: "20% VAT applies to telehealth under Moroccan Code Général des Impôts." },
  { code: "IN", name: "India",                 flag: "🇮🇳", currency: "INR", symbol: "₹",    usdRate: 83.2,  dialCode: "+91",  culturalNote: "Hindi, English & regional languages. Affordable, accessible rates.", legalSystem: "Indian Common Law", legalFramework: "Digital Personal Data Protection Act 2023 (DPDP)", region: "South Asia", language: "en", taxRate: 0.18, taxNote: "18% GST may apply to telehealth services under Indian GST regulations." },
  { code: "AU", name: "Australia",             flag: "🇦🇺", currency: "AUD", symbol: "A$",   usdRate: 1.53,  dialCode: "+61",  culturalNote: "AHPRA-registered providers. Medicare rebate may apply.", legalSystem: "Australian Common Law", legalFramework: "Privacy Act 1988 & Australian Privacy Principles", region: "Oceania", language: "en", taxRate: 0, taxNote: "Mental health services are GST-exempt in Australia (GST Act 1999, Div 38)." },
  { code: "QA", name: "Qatar",                 flag: "🇶🇦", currency: "QAR", symbol: "QR",   usdRate: 3.64,  dialCode: "+974", culturalNote: "Arabic & English, MOPH and QCHP licensed practitioners.", legalSystem: "Qatari Civil Law", legalFramework: "Qatar Law No. 13 of 2016 on Personal Data Privacy", region: "Middle East", language: "ar", taxRate: 0, taxNote: "Qatar has no VAT at present. No tax applies to telehealth services." },
  { code: "TR", name: "Turkey",                flag: "🇹🇷", currency: "TRY", symbol: "₺",    usdRate: 32.0,  dialCode: "+90",  culturalNote: "Turkish & English available. TTB-licensed providers.", legalSystem: "Turkish Civil Code", legalFramework: "Turkish KVKK (PDPL Law No. 6698)", region: "Europe & Middle East", language: "tr", taxRate: 0.18, taxNote: "18% KDV (VAT) applies to telehealth under Turkish tax regulations." },
  { code: "CA", name: "Canada",                flag: "🇨🇦", currency: "CAD", symbol: "C$",   usdRate: 1.37,  dialCode: "+1",   culturalNote: "English & French, provincial licensing. Indigenous services available.", legalSystem: "Canadian Common Law", legalFramework: "PIPEDA & provincial health privacy laws", region: "North America", language: "en", taxRate: 0, taxNote: "Psychotherapy services are generally HST/GST-exempt in most Canadian provinces." },
  { code: "KW", name: "Kuwait",                flag: "🇰🇼", currency: "KWD", symbol: "KD",   usdRate: 0.308, dialCode: "+965", culturalNote: "Arabic & English, MOH regulated. Conservative therapeutic approaches available.", legalSystem: "Kuwaiti Civil Law", legalFramework: "Kuwaiti Law No. 20 of 2014 on E-Commerce", region: "Middle East", language: "ar", taxRate: 0, taxNote: "Kuwait has no VAT. No tax applies to telehealth services." },
  { code: "BH", name: "Bahrain",               flag: "🇧🇭", currency: "BHD", symbol: "BD",   usdRate: 0.376, dialCode: "+973", culturalNote: "Arabic & English sessions. NHRA licensed providers.", legalSystem: "Bahraini Civil Law", legalFramework: "Bahrain PDPL (Law No. 30 of 2018)", region: "Middle East", language: "ar", taxRate: 0.10, taxNote: "10% VAT applies to services in Bahrain under VAT Law 2018." },
  { code: "OM", name: "Oman",                  flag: "🇴🇲", currency: "OMR", symbol: "RO",   usdRate: 0.385, dialCode: "+968", culturalNote: "Arabic & English, MOH licensed. Oman Vision 2040 wellness services.", legalSystem: "Omani Civil Law", legalFramework: "Oman Personal Data Protection Law (Royal Decree 6/2022)", region: "Middle East", language: "ar", taxRate: 0.05, taxNote: "5% VAT applies in Oman under the GCC VAT framework." },
  { code: "IQ", name: "Iraq",                  flag: "🇮🇶", currency: "IQD", symbol: "IQD",  usdRate: 1310,  dialCode: "+964", culturalNote: "Arabic-speaking providers. Humanitarian and low-cost options available.", legalSystem: "Iraqi Civil Code", legalFramework: "Iraqi Communications & Media Commission regulations", region: "Middle East", language: "ar", taxRate: 0, taxNote: "Iraq does not currently have a comprehensive VAT system for services." },
  { code: "PS", name: "Palestine",             flag: "🇵🇸", currency: "ILS", symbol: "₪",    usdRate: 3.75,  dialCode: "+970", culturalNote: "Arabic & English, WHO supported. Trauma-informed care specialists.", legalSystem: "Palestinian Authority Law", legalFramework: "Palestinian Authority regulations", region: "Middle East", language: "ar", taxRate: 0.17, taxNote: "17% VAT applies under Palestinian Authority tax law." },
  { code: "SY", name: "Syria",                 flag: "🇸🇾", currency: "USD", symbol: "$",    usdRate: 1.0,   dialCode: "+963", culturalNote: "Arabic providers. Humanitarian support pricing available.", legalSystem: "Syrian Civil Code", legalFramework: "Syrian Electronic Crimes Law", region: "Middle East", language: "ar", taxRate: 0, taxNote: "Humanitarian pricing applies. Contact support for subsidised access." },
  { code: "PK", name: "Pakistan",              flag: "🇵🇰", currency: "PKR", symbol: "Rs",   usdRate: 280,   dialCode: "+92",  culturalNote: "Urdu & English, PMDC regulated. Culturally sensitive therapy.", legalSystem: "Pakistani Common Law", legalFramework: "Pakistan Personal Data Protection Bill", region: "South Asia", language: "en", taxRate: 0.17, taxNote: "17% GST may apply to telehealth services under Pakistani FBR rules." },
  { code: "NG", name: "Nigeria",               flag: "🇳🇬", currency: "NGN", symbol: "₦",    usdRate: 1540,  dialCode: "+234", culturalNote: "English sessions, MDCN regulated. Pan-African mental health network.", legalSystem: "Nigerian Common Law", legalFramework: "Nigeria Data Protection Regulation (NDPR) 2019", region: "West Africa", language: "en", taxRate: 0.075, taxNote: "7.5% VAT applies under the Nigerian Finance Act 2019." },
  { code: "ZA", name: "South Africa",          flag: "🇿🇦", currency: "ZAR", symbol: "R",    usdRate: 18.8,  dialCode: "+27",  culturalNote: "English & Afrikaans available. HPCSA registered practitioners.", legalSystem: "South African Common Law", legalFramework: "POPIA (Protection of Personal Information Act 4 of 2013)", region: "Southern Africa", language: "en", taxRate: 0.15, taxNote: "15% VAT applies to telehealth in South Africa (SARS VAT Act 89/1991)." },
  { code: "SG", name: "Singapore",             flag: "🇸🇬", currency: "SGD", symbol: "S$",   usdRate: 1.34,  dialCode: "+65",  culturalNote: "English sessions, SMC regulated. Mental Wellness Fund eligible.", legalSystem: "Singapore Common Law", legalFramework: "Personal Data Protection Act (PDPA) 2012", region: "Southeast Asia", language: "en", taxRate: 0.09, taxNote: "9% GST applies to services in Singapore (GST Act, Jan 2024 rate)." },
];

function buildCountry(raw: RawCountry): CountryPricing {
  return { ...raw, tiers: makeTiers(raw) };
}

export const COUNTRIES: Record<string, CountryPricing> = Object.fromEntries(
  RAW.map((r) => [r.code, buildCountry(r)])
);

export const COUNTRY_LIST = Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));

export const SESSION_DURATIONS = [
  { label: "45 min", minutes: 45, multiplier: 1 },
  { label: "60 min", minutes: 60, multiplier: 1.3 },
  { label: "90 min", minutes: 90, multiplier: 1.8 },
];

export function getSessionPrice(baseUSD: number, minutes: number, country: CountryPricing): { usd: number; local: number } {
  const dur = SESSION_DURATIONS.find((d) => d.minutes === minutes) ?? SESSION_DURATIONS[0];
  const usd = Math.round(baseUSD * dur.multiplier);
  const local = Math.round(usd * country.usdRate);
  return { usd, local };
}

export function formatPrice(amount: number, country: CountryPricing): string {
  return `${country.symbol}${amount.toLocaleString()}`;
}

export function toUSD(localAmount: number, country: CountryPricing): number {
  return Math.round(localAmount / country.usdRate);
}

export const PROMO_CODES: Record<string, number> = {
  CLEAR20: 0.20,
  MIND15: 0.15,
  WELCOME10: 0.10,
  FIRST30: 0.30,
  HEALTH25: 0.25,
  CLEARHEAD: 0.15,
};
