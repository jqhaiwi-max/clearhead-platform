export interface CountryPricing {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  usdRate: number;
  region: string;
  legalFramework: string;
  tiers: {
    name: string;
    label: string;
    minutesPerSession: number;
    localPrice: number;
    sessionsPerMonth: number;
    features: string[];
    recommended?: boolean;
  }[];
  culturalNote: string;
  taxNote: string;
  taxRate: number;
}

export const COUNTRIES: Record<string, CountryPricing> = {
  JO: {
    code: "JO", name: "Jordan", flag: "🇯🇴",
    currency: "JOD", symbol: "JD", usdRate: 0.71,
    region: "Middle East", legalFramework: "Jordan Data Protection Law (PDL) 2023",
    culturalNote: "Sessions available in Arabic. Therapists understand Arab culture, family dynamics, and Islamic values.",
    taxNote: "Subject to Jordanian General Sales Tax (GST) at 16%",
    taxRate: 0.16,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 18, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 29, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 48, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  US: {
    code: "US", name: "United States", flag: "🇺🇸",
    currency: "USD", symbol: "$", usdRate: 1.0,
    region: "North America", legalFramework: "HIPAA (Health Insurance Portability and Accountability Act)",
    culturalNote: "All sessions conducted in English. Providers experienced with diverse American communities.",
    taxNote: "Prices may be eligible for HSA/FSA reimbursement. No federal sales tax on medical services.",
    taxRate: 0,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 89, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 149, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 249, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  GB: {
    code: "GB", name: "United Kingdom", flag: "🇬🇧",
    currency: "GBP", symbol: "£", usdRate: 0.79,
    region: "Europe", legalFramework: "UK GDPR & Data Protection Act 2018",
    culturalNote: "BACP-aligned practice standards. Providers familiar with NHS pathways and British cultural contexts.",
    taxNote: "Mental health services are VAT-exempt under HMRC Schedule 9 Group 7.",
    taxRate: 0,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 55, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 89, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 145, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  SA: {
    code: "SA", name: "Saudi Arabia", flag: "🇸🇦",
    currency: "SAR", symbol: "﷼", usdRate: 3.75,
    region: "Middle East", legalFramework: "Saudi Personal Data Protection Law (PDPL) 2021",
    culturalNote: "Culturally sensitive sessions in Arabic and English. Providers respect Islamic values and Saudi societal norms.",
    taxNote: "Subject to Saudi VAT at 15% per ZATCA regulations.",
    taxRate: 0.15,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 249, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 399, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 699, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  AE: {
    code: "AE", name: "United Arab Emirates", flag: "🇦🇪",
    currency: "AED", symbol: "د.إ", usdRate: 3.67,
    region: "Middle East", legalFramework: "UAE Federal Law No. 45 of 2021 (PDPL)",
    culturalNote: "Multilingual providers for UAE's diverse expat and Emirati population. Arabic, English, Hindi available.",
    taxNote: "Subject to UAE VAT at 5%. Medical services may qualify for exemption.",
    taxRate: 0.05,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 299, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 499, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 849, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  DE: {
    code: "DE", name: "Germany", flag: "🇩🇪",
    currency: "EUR", symbol: "€", usdRate: 1.08,
    region: "Europe", legalFramework: "GDPR (EU Regulation 2016/679) & Bundesdatenschutzgesetz (BDSG)",
    culturalNote: "Evidence-based CBT and psychoanalytic traditions. German, English, Turkish providers available.",
    taxNote: "Heilpraktiker sessions: 19% VAT. Psychological psychotherapist sessions: VAT-exempt.",
    taxRate: 0.19,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 65, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 99, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 165, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  EG: {
    code: "EG", name: "Egypt", flag: "🇪🇬",
    currency: "EGP", symbol: "E£", usdRate: 30.9,
    region: "Middle East / North Africa", legalFramework: "Egypt Personal Data Protection Law No. 151 of 2020",
    culturalNote: "Arabic-first sessions. Providers sensitive to Egyptian social norms, family expectations, and religious identity.",
    taxNote: "Subject to Egyptian VAT at 14%.",
    taxRate: 0.14,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 550, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 950, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 1750, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  LB: {
    code: "LB", name: "Lebanon", flag: "🇱🇧",
    currency: "USD", symbol: "$", usdRate: 1.0,
    region: "Middle East", legalFramework: "Lebanese Law on Personal Data Protection (Draft 2021)",
    culturalNote: "Sessions in Arabic, French, or English. Providers understand Lebanon's unique socio-political challenges.",
    taxNote: "Priced in USD due to Lebanese pound instability. Subject to Lebanese VAT at 11%.",
    taxRate: 0.11,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 22, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 38, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 65, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  CA: {
    code: "CA", name: "Canada", flag: "🇨🇦",
    currency: "CAD", symbol: "CA$", usdRate: 1.36,
    region: "North America", legalFramework: "PIPEDA (Personal Information Protection and Electronic Documents Act)",
    culturalNote: "Bilingual (English/French) providers. Familiar with diverse Canadian multicultural contexts.",
    taxNote: "Eligible for Medical Expense Tax Credit (METC). Provincial taxes may apply.",
    taxRate: 0.05,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 119, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 199, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 329, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  TR: {
    code: "TR", name: "Turkey", flag: "🇹🇷",
    currency: "TRY", symbol: "₺", usdRate: 32.0,
    region: "Europe / Middle East", legalFramework: "Turkish Personal Data Protection Law (KVKK) No. 6698",
    culturalNote: "Turkish and English sessions available. Providers familiar with both secular and traditional Turkish values.",
    taxNote: "Subject to Turkish KDV (VAT) at 20%. Medical services may qualify for reduced rate.",
    taxRate: 0.20,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 1200, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 1900, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 3200, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  AU: {
    code: "AU", name: "Australia", flag: "🇦🇺",
    currency: "AUD", symbol: "A$", usdRate: 1.53,
    region: "Oceania", legalFramework: "Privacy Act 1988 & Australian Privacy Principles (APPs)",
    culturalNote: "AHPRA-aligned providers. Medicare rebates may partially offset session costs.",
    taxNote: "Mental health services are GST-free under Australian Tax Law.",
    taxRate: 0,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 119, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 195, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 320, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  IN: {
    code: "IN", name: "India", flag: "🇮🇳",
    currency: "INR", symbol: "₹", usdRate: 83.5,
    region: "South Asia", legalFramework: "Digital Personal Data Protection Act (DPDPA) 2023",
    culturalNote: "Hindi, English, and regional language sessions. Providers sensitive to Indian family structures and cultural stigma around mental health.",
    taxNote: "Healthcare services exempt from GST. Subject to 18% GST if classified as online information services.",
    taxRate: 0.18,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 1200, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 2200, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 3800, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  QA: {
    code: "QA", name: "Qatar", flag: "🇶🇦",
    currency: "QAR", symbol: "ر.ق", usdRate: 3.64,
    region: "Middle East", legalFramework: "Qatar Personal Data Privacy Protection Law No. 13 of 2016",
    culturalNote: "Arabic and English sessions. Confidentiality rigorously maintained given Qatar's collectivist culture.",
    taxNote: "Qatar has no VAT. No applicable consumption tax on professional services.",
    taxRate: 0,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 250, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 420, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 720, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  FR: {
    code: "FR", name: "France", flag: "🇫🇷",
    currency: "EUR", symbol: "€", usdRate: 1.08,
    region: "Europe", legalFramework: "GDPR & Loi Informatique et Libertés (French Data Protection Act)",
    culturalNote: "French and English sessions. Psychodynamic and existential approaches prevalent in French clinical tradition.",
    taxNote: "Psychotherapy by non-médecins subject to 20% TVA. Psychiatrist sessions covered by Assurance Maladie.",
    taxRate: 0.20,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 60, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 95, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 155, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
  MA: {
    code: "MA", name: "Morocco", flag: "🇲🇦",
    currency: "MAD", symbol: "DH", usdRate: 10.05,
    region: "North Africa", legalFramework: "Moroccan Law No. 09-08 on Personal Data Protection",
    culturalNote: "Darija, French, and Modern Standard Arabic sessions. Providers understand Moroccan family expectations and Islamic identity.",
    taxNote: "Subject to Moroccan TVA at 10% for professional services.",
    taxRate: 0.10,
    tiers: [
      { name: "essential", label: "Essential", minutesPerSession: 45, localPrice: 280, sessionsPerMonth: 4, recommended: false, features: ["45-min video session", "Secure messaging", "Session notes", "Crisis line access"] },
      { name: "standard", label: "Standard", minutesPerSession: 55, localPrice: 480, sessionsPerMonth: 4, recommended: true, features: ["55-min video/phone session", "Messaging between sessions", "Monthly progress report", "Homework & exercises", "Priority booking"] },
      { name: "premium", label: "Premium", minutesPerSession: 60, localPrice: 850, sessionsPerMonth: 8, recommended: false, features: ["60-min session × 2/week", "Unlimited messaging", "Psychiatrist collaboration", "Family session included", "Emergency support", "Custom treatment plan"] },
    ],
  },
};

export const COUNTRY_LIST = Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));

export function toUSD(localPrice: number, country: CountryPricing): number {
  return Math.round((localPrice / country.usdRate) * 100) / 100;
}

export function fromUSD(usdPrice: number, country: CountryPricing): number {
  return Math.round(usdPrice * country.usdRate);
}

export function formatPrice(localPrice: number, country: CountryPricing): string {
  return `${country.symbol}${localPrice.toLocaleString()}`;
}
