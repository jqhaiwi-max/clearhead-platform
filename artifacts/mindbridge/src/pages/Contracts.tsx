import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, Printer, Shield, Globe, Scale, AlertTriangle, BookOpen, Phone } from "lucide-react";
import { COUNTRY_LIST, COUNTRIES, type CountryPricing } from "@/lib/pricing";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

interface Clause {
  id: string;
  title: string;
  icon: React.ElementType;
  content: (c: CountryPricing) => string;
}

const CLAUSES: Clause[] = [
  {
    id: "1",
    title: "1. Parties & Definitions",
    icon: BookOpen,
    content: (c) => `This Telehealth Services Agreement ("Agreement") is entered into between MindBridge Digital Health Platform ("Platform", "we", "us"), and the individual or entity accessing the platform's services ("Patient", "User", "you"), effective as of the date of account registration.

"Provider" means a licensed mental health professional listed on the Platform operating under the laws of ${c.name}.
"Session" means a scheduled real-time clinical consultation via video, voice, or text.
"Services" means the telehealth matching, scheduling, and communication technology provided by MindBridge.
"Region" means ${c.name} and, where applicable, ${c.region}.`,
  },
  {
    id: "2",
    title: "2. Applicable Law & Jurisdiction",
    icon: Scale,
    content: (c) => `This Agreement is governed by the laws of ${c.name}. Any dispute arising out of or related to this Agreement shall be subject to the exclusive jurisdiction of the competent courts of ${c.name}.

Data protection and privacy obligations are governed by ${c.legalFramework}. MindBridge processes personal data in accordance with all applicable data protection legislation in ${c.region}.

Users in ${c.name} acknowledge that mental health services provided through the Platform are supplementary and do not replace in-person emergency psychiatric care where required by local health regulations.`,
  },
  {
    id: "3",
    title: "3. Data Protection & Privacy",
    icon: Shield,
    content: (c) => `MindBridge processes your personal health information in full compliance with ${c.legalFramework}.

3.1 Data Controller: MindBridge Digital Health Platform acts as data controller for all personal data collected during Platform use.
3.2 Lawful Basis: Processing is based on explicit consent (provided at registration) and legitimate interest in delivering clinical services.
3.3 Data Categories: We process identity data, contact details, session content (encrypted), payment information (tokenised), and clinical intake responses.
3.4 Retention: Clinical session records are retained for a minimum of 7 years from last session date in compliance with health records requirements under ${c.legalFramework}.
3.5 Cross-Border Transfers: Where data is transferred outside ${c.name}, MindBridge applies Standard Contractual Clauses (SCCs) or equivalent approved transfer mechanisms.
3.6 Your Rights: You have the right to access, rectify, erase, restrict processing, and data portability. Requests may be directed to privacy@mindbridge.health within 30 days of receipt.`,
  },
  {
    id: "4",
    title: "4. Clinical Scope & Limitations",
    icon: AlertTriangle,
    content: (c) => `4.1 The Platform provides technology to connect patients with licensed therapists and psychiatrists. MindBridge does not itself provide medical or psychiatric diagnosis, treatment, or advice.

4.2 Providers listed in ${c.name} hold valid licensure under the applicable regulatory body for ${c.region}. Users may request proof of credentials at any time.

4.3 The Platform is not suitable for acute psychiatric emergencies, active suicidal ideation with intent, psychotic episodes requiring hospitalisation, or any condition requiring immediate in-person intervention.

4.4 Emergency Services: If you are in crisis, please contact your local emergency number immediately.
${c.code === "JO" ? "Jordan Emergency: 911 / Psychiatric Emergency: 110" : c.code === "US" ? "USA Emergency: 911 / Crisis Line: 988 Suicide & Crisis Lifeline" : c.code === "GB" ? "UK Emergency: 999 / Crisis Line: Samaritans 116 123" : c.code === "SA" ? "KSA Emergency: 911 / Mental Health Helpline: 920033360" : c.code === "AE" ? "UAE Emergency: 999 / Mental Wellness: 800-HOPE (4673)" : c.code === "EG" ? "Egypt Emergency: 123 / Ministry of Health: 08008880700" : c.code === "DE" ? "Germany Emergency: 112 / Crisis Line: 0800 111 0 111" : "Contact your local emergency services or crisis line."}`,
  },
  {
    id: "5",
    title: "5. Session Conduct & Timer Policy",
    icon: FileText,
    content: (_c) => `5.1 Session Duration: Sessions are booked in fixed increments (45, 55, or 60 minutes) depending on the subscribed plan. A session timer will be displayed to both parties during the session.

5.2 Grace Period: A 5-minute warning will be issued before session expiry. Sessions may be extended by mutual agreement of Provider and Patient, subject to Provider availability, at the applicable per-minute rate.

5.3 Late Start: If a Provider is more than 10 minutes late without prior notice, the Patient is entitled to a full session rebook or credit.

5.4 No-Show Policy: Patients who miss a session without 24-hour cancellation notice forfeit that session credit. Providers who miss without 4-hour notice must reschedule at no charge and MindBridge will issue a platform credit.

5.5 Recording: Sessions shall not be recorded by either party without explicit written consent. MindBridge does not record sessions. AI-generated session notes (where opted in) are encrypted and accessible only to the Provider and Patient.`,
  },
  {
    id: "6",
    title: "6. Pricing, Fees & Taxation",
    icon: FileText,
    content: (c) => `6.1 All prices are displayed in ${c.currency} and are subject to ${c.taxRate > 0 ? `${Math.round(c.taxRate * 100)}% ${c.taxNote}` : "no applicable consumption tax"}.

6.2 The Platform charges a service fee of 15–25% of the session price as a technology and matching fee. This is deducted automatically before Provider payout.

6.3 Intermediary or referral partners operating in ${c.name} are separately contracted and receive a commission of up to 15% of the net session fee, disclosed transparently in each booking summary.

6.4 Payments are processed via certified PCI-DSS Level 1 payment processors. MindBridge does not store raw card data.

6.5 Subscription plans are billed monthly or annually in advance. Annual plans carry a 20% discount. Refunds are processed within 7–10 business days for unused sessions cancelled within 48 hours.

6.6 Currency: All transactions in ${c.name} are settled in ${c.currency}. For patients with international payment methods, currency conversion fees apply at the cardholder's bank rate.`,
  },
  {
    id: "7",
    title: "7. Provider Agreement & Revenue Share",
    icon: FileText,
    content: (c) => `7.1 Providers operating through MindBridge in ${c.name} enter into a separate Provider Services Agreement governing credentialing, insurance, and earnings.

7.2 Revenue Distribution: For each completed session, the Provider receives a minimum of 60% of the session fee after Platform deductions. The exact percentage is specified in the Provider's individual contract and the Revenue Simulator available in the Platform dashboard.

7.3 Payout Schedule: Providers are paid weekly in arrears to their registered bank account in ${c.currency}. Minimum payout threshold: ${c.symbol}${c.code === "JO" ? "20" : c.code === "EG" ? "500" : c.code === "TR" ? "2000" : c.code === "IN" ? "1000" : "50"}.

7.4 Provider Insurance: All Providers are required to hold valid professional indemnity insurance for the jurisdiction of ${c.name} as a condition of listing on the Platform.

7.5 Regulatory Compliance: Providers in ${c.name} are responsible for complying with ${c.legalFramework}, applicable clinical licensing requirements, and mandatory continuing professional education.`,
  },
  {
    id: "8",
    title: "8. Confidentiality & Therapeutic Privilege",
    icon: Shield,
    content: (c) => `8.1 All communications between Patient and Provider are strictly confidential. Neither MindBridge nor the Provider will disclose session content to any third party without Patient consent, except where:
    (a) Disclosure is required by law in ${c.name};
    (b) There is credible risk of harm to the Patient or a third party;
    (c) A court order or regulatory authority requires disclosure.

8.2 Mandatory Reporting: Providers in ${c.name} are bound by applicable mandatory reporting obligations under local health laws. Patients will be informed if a disclosure becomes legally necessary.

8.3 Research & Anonymised Data: With explicit consent, anonymised and aggregated session data may be used for clinical research and platform improvement. No personally identifiable information is used.`,
  },
  {
    id: "9",
    title: "9. Intellectual Property",
    icon: FileText,
    content: (_c) => `9.1 All proprietary technology, algorithms, matching systems, content, and branding constituting the MindBridge Platform are the exclusive intellectual property of MindBridge Digital Health Platform.

9.2 Session notes and treatment plans created by Providers remain the joint property of the Provider and Patient. Patients have the right to request a copy at any time.

9.3 Users may not copy, reproduce, modify, distribute, or create derivative works from any part of the Platform without express written permission.`,
  },
  {
    id: "10",
    title: "10. Limitation of Liability",
    icon: AlertTriangle,
    content: (c) => `10.1 To the maximum extent permitted by the laws of ${c.name}, MindBridge's total cumulative liability to any User shall not exceed the total fees paid by that User in the 12 months preceding the claim.

10.2 MindBridge is not liable for the clinical acts or omissions of independent Providers, who operate as independent contractors and not employees or agents of the Platform.

10.3 MindBridge shall not be liable for indirect, incidental, special, punitive, or consequential damages of any nature arising out of or related to this Agreement.

10.4 Certain jurisdictions in ${c.region} do not permit limitation of liability for personal injury or death caused by negligence. Nothing in this Agreement shall exclude liability where such exclusion is prohibited by applicable law.`,
  },
  {
    id: "11",
    title: "11. Termination & Account Closure",
    icon: FileText,
    content: (_c) => `11.1 Either party may terminate this Agreement at any time with 14 days written notice via the Platform or to legal@mindbridge.health.

11.2 MindBridge may immediately suspend or terminate an account for: (a) breach of this Agreement; (b) fraudulent activity; (c) misuse of the platform; (d) harm or threatened harm to a Provider.

11.3 Upon termination, Patient data is retained for the legally required minimum period under applicable law before secure deletion. Patients may request a data export within 30 days of account closure.

11.4 Any unused paid session credits will be refunded to the original payment method within 14 business days of account closure.`,
  },
  {
    id: "12",
    title: "12. Amendments & Notifications",
    icon: FileText,
    content: (_c) => `12.1 MindBridge reserves the right to amend this Agreement at any time. Material changes will be communicated by email to the registered address not less than 30 days before taking effect.

12.2 Continued use of the Platform following the effective date of any amendment constitutes acceptance of the revised terms.

12.3 All legal notices to MindBridge must be sent in writing to: legal@mindbridge.health or to the registered business address listed in the Platform's legal register.`,
  },
  {
    id: "13",
    title: "13. Dispute Resolution",
    icon: Scale,
    content: (c) => `13.1 Good Faith Resolution: Parties commit to resolving disputes in good faith through direct negotiation before initiating formal proceedings.

13.2 Mediation: Where direct negotiation fails, disputes shall be referred to formal mediation conducted under the rules of ${
      c.code === "US" ? "the American Arbitration Association (AAA)" :
      c.code === "GB" ? "the Centre for Effective Dispute Resolution (CEDR), London" :
      c.code === "DE" || c.code === "FR" ? "the European Centre for Dispute Resolution (ECDR)" :
      c.code === "AE" || c.code === "SA" || c.code === "QA" ? "the Dubai International Arbitration Centre (DIAC)" :
      c.code === "JO" ? "the Amman Chamber of Commerce Arbitration Centre" :
      "the applicable regional arbitration authority"
    }.

13.3 Governing Language: This Agreement is executed in English. In ${c.name}, a certified Arabic${c.code === "DE" ? " or German" : c.code === "FR" ? " or French" : ""} translation is available on request and shall prevail in the event of inconsistency in interpretation.

13.4 Class Action Waiver: Users waive the right to participate in class-action proceedings to the extent permitted by applicable law in ${c.name}.`,
  },
  {
    id: "14",
    title: "14. Contact & Regulatory Authorities",
    icon: Phone,
    content: (c) => `Regulatory Body in ${c.name}: ${
      c.code === "US" ? "Department of Health and Human Services (HHS) — www.hhs.gov" :
      c.code === "GB" ? "Care Quality Commission (CQC) — www.cqc.org.uk / ICO for data: www.ico.org.uk" :
      c.code === "DE" ? "Bundesärztekammer (BÄK) / Landesärztekammern / BfDI for data protection" :
      c.code === "FR" ? "Conseil National de l'Ordre des Médecins / CNIL for data protection" :
      c.code === "SA" ? "Saudi Commission for Health Specialties (SCFHS) / NDMO for data" :
      c.code === "AE" ? "Dubai Health Authority (DHA) / HAAD / UAE TDRA for data" :
      c.code === "JO" ? "Jordan Medical Association (JMA) / Ministry of Health Jordan" :
      c.code === "EG" ? "Egyptian Medical Syndicate / Egyptian Ministry of Health" :
      c.code === "TR" ? "Turkish Medical Association (TTB) / KVKK Authority" :
      c.code === "IN" ? "Medical Council of India (MCI) / MeitY for data protection" :
      c.code === "AU" ? "Australian Health Practitioner Regulation Agency (AHPRA) / OAIC for privacy" :
      c.code === "CA" ? "Provincial Colleges of Physicians / Office of the Privacy Commissioner of Canada" :
      c.code === "QA" ? "Qatar Council for Healthcare Practitioners (QCHP) / Qatar DP Authority" :
      c.code === "MA" ? "Conseil National de l'Ordre des Médecins du Maroc (CNOM) / CNDP" :
      c.code === "LB" ? "Lebanese Order of Physicians / Lebanese Ministry of Public Health" :
      "Local health regulatory authority and data protection authority"
    }

MindBridge Legal & Compliance:
  Email: legal@mindbridge.health
  Data Protection Officer: dpo@mindbridge.health
  Patient Advocacy: support@mindbridge.health
  Business Hours: Sunday–Thursday, 9:00 AM – 6:00 PM (GMT+3)

Complaints: Patients in ${c.name} may also lodge complaints directly with the ${c.name} data protection authority or health regulator listed above.`,
  },
];

function CountrySelect({ value, onChange }: { value: CountryPricing; onChange: (c: CountryPricing) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-primary/30 bg-card hover:border-primary/60 transition-all font-semibold text-foreground shadow-sm">
        <span className="text-2xl">{value.flag}</span>
        <div className="text-left">
          <div className="text-sm font-bold">{value.name}</div>
          <div className="text-xs text-muted-foreground">{value.legalFramework.slice(0, 40)}…</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-80 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-border">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country..." className="w-full px-3 py-2 text-sm bg-muted/40 rounded-xl outline-none" />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.code} onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left ${value.code === c.code ? "bg-primary/5 font-semibold text-primary" : "text-foreground"}`}>
                  <span className="text-lg">{c.flag}</span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.legalFramework}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Contracts() {
  const [country, setCountry] = useState<CountryPricing>(COUNTRIES.JO);
  const [activeClause, setActiveClause] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1"]));
  const contractRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setActiveClause(id);
  };

  const expandAll = () => setExpanded(new Set(CLAUSES.map((c) => c.id)));
  const collapseAll = () => setExpanded(new Set());

  const handlePrint = () => {
    expandAll();
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Scale className="w-4 h-4" /> Dynamic Legal Contracts
          </span>
          <h1 className="font-serif text-5xl font-bold text-foreground mb-4">Legal Framework</h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Country-specific terms, data protection clauses, and jurisdictional compliance — updated dynamically based on your selected country.</p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: TOC + country selector */}
          <FadeIn className="lg:col-span-1">
            <div className="sticky top-28 space-y-4">
              <CountrySelect value={country} onChange={setCountry} />

              {/* Framework badge */}
              <AnimatePresence mode="wait">
                <motion.div key={country.code} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-primary mb-0.5">Applicable Law</div>
                      <div className="text-xs text-foreground/80 leading-relaxed">{country.legalFramework}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Index */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Table of Contents</span>
                  <div className="flex gap-2">
                    <button onClick={expandAll} className="text-xs text-primary hover:underline">All</button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">None</button>
                  </div>
                </div>
                <nav className="p-2 max-h-[50vh] overflow-y-auto">
                  {CLAUSES.map((clause) => (
                    <button key={clause.id} onClick={() => { toggle(clause.id); document.getElementById(`clause-${clause.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors mb-0.5 ${activeClause === clause.id ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}>
                      {clause.title}
                    </button>
                  ))}
                </nav>
              </div>

              <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-border bg-card hover:border-primary/40 font-semibold text-sm text-foreground transition-all hover:shadow-md print:hidden">
                <Printer className="w-4 h-4" /> Print / Download PDF
              </button>
            </div>
          </FadeIn>

          {/* Main contract body */}
          <div className="lg:col-span-3" ref={contractRef}>
            <FadeIn delay={0.1}>
              {/* Contract header */}
              <AnimatePresence mode="wait">
                <motion.div key={country.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-[hsl(188,73%,8%)] to-[hsl(188,55%,18%)] text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white/50 text-xs font-medium mb-1 uppercase tracking-wide">MindBridge Digital Health Platform</div>
                      <h2 className="font-serif text-2xl font-bold mb-1">Telehealth Services Agreement</h2>
                      <div className="text-white/60 text-sm">Jurisdiction: {country.flag} {country.name} · {country.region}</div>
                    </div>
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Scale className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-xs">
                    <div><div className="text-white/40">Version</div><div className="font-semibold">v4.2 — 2025</div></div>
                    <div><div className="text-white/40">Data Law</div><div className="font-semibold">{country.legalFramework.split(" ")[0]} {country.legalFramework.split(" ")[1]}</div></div>
                    <div><div className="text-white/40">Tax Rate</div><div className="font-semibold">{country.taxRate > 0 ? `${Math.round(country.taxRate * 100)}% applicable` : "No consumption tax"}</div></div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Clauses */}
              <div className="space-y-3">
                {CLAUSES.map((clause) => {
                  const Icon = clause.icon;
                  const open = expanded.has(clause.id);
                  return (
                    <div key={clause.id} id={`clause-${clause.id}`} className={`rounded-2xl border-2 overflow-hidden transition-all ${open ? "border-primary/30 shadow-md" : "border-border"}`}>
                      <button onClick={() => toggle(clause.id)} className={`w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors ${open ? "bg-primary/5" : "bg-card hover:bg-muted/30"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${open ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`font-semibold text-sm ${open ? "text-primary" : "text-foreground"}`}>{clause.title}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                            <AnimatePresence mode="wait">
                              <motion.div key={country.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                                className="px-6 py-5 bg-white border-t border-border">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
                                  {clause.content(country)}
                                </pre>
                              </motion.div>
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-8 p-6 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-2">Legal Disclaimer</p>
                <p>This document is a dynamic representation of MindBridge's standard terms adapted to {country.name}. It does not constitute legal advice. Users are encouraged to seek independent legal counsel in {country.name} regarding their specific rights and obligations. MindBridge's full legal team review ensures this document is updated quarterly or upon material changes in {country.legalFramework}.</p>
                <p className="mt-2">Last reviewed: Q4 2025 · For {country.name} — {country.legalFramework}</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}
