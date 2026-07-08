const RESEND_API_URL = "https://api.resend.com/emails";

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "Clearhead <onboarding@resend.dev>";
}

function getAdminPortalUrl(): string {
  const configured = process.env.ADMIN_PORTAL_URL;
  if (configured) return configured.replace(/\/$/, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain ? `https://${domain}/admin` : "your Clearhead admin portal";
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not configured — skipping email to ${opts.to}: "${opts.subject}"`);
    return;
  }
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend API error (${res.status}) sending "${opts.subject}" to ${opts.to}: ${body}`);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${opts.subject}" to ${opts.to}:`, err);
  }
}

type AppointmentLike = {
  id: number;
  patientName: string;
  patientEmail: string;
  patientPhone?: string | null;
  providerName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string | null;
  paymentMethod?: string | null;
  careType?: string | null;
  diagnosisSummary?: string | null;
};

type ProviderLike = {
  name: string;
  email?: string | null;
  specialty?: string | null;
  doxyLink?: string | null;
};

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;white-space:nowrap;">${label}</td><td style="padding:4px 0;font-size:13px;color:#0f172a;font-weight:600;">${value}</td></tr>`;
}

export async function sendApprovalRequestEmail(appointment: AppointmentLike, provider: ProviderLike | undefined, adminEmail: string): Promise<void> {
  const portalUrl = getAdminPortalUrl();
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0f172a;">New Booking Awaiting Approval</h2>
      <p style="color:#475569;font-size:14px;">A patient has submitted a booking on Clearhead. Please review and approve or decline in the admin portal.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
        ${row("Booking ID", `#${appointment.id}`)}
        ${row("Patient", appointment.patientName)}
        ${row("Email", appointment.patientEmail)}
        ${row("Phone", appointment.patientPhone)}
        ${row("Provider", `${appointment.providerName}${provider?.specialty ? ` (${provider.specialty})` : ""}`)}
        ${row("Date", appointment.date)}
        ${row("Time", appointment.time)}
        ${row("Session Type", appointment.type)}
        ${row("Care Type", appointment.careType)}
        ${row("Payment Method", appointment.paymentMethod)}
        ${row("Notes", appointment.notes)}
      </table>
      ${appointment.diagnosisSummary ? `
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Screening / Diagnosis Summary</p>
        <p style="margin:0;font-size:13px;color:#78350f;white-space:pre-wrap;">${appointment.diagnosisSummary}</p>
      </div>` : ""}
      <a href="${portalUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">Review in Admin Portal</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Clearhead — Psychiatric Care Platform</p>
    </div>
  `;
  await sendEmail({ to: adminEmail, subject: `New Booking #${appointment.id} — Awaiting Approval`, html });
}

export async function sendDoctorAssignmentEmail(appointment: AppointmentLike, provider: ProviderLike | undefined): Promise<void> {
  if (!provider?.email) {
    console.warn(`[email] No email on file for provider "${appointment.providerName}" — skipping doctor notification for appointment #${appointment.id}`);
    return;
  }
  const sessionLink = provider.doxyLink || "https://doxy.me";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0f172a;">You Have a Confirmed Session</h2>
      <p style="color:#475569;font-size:14px;">A booking has been approved and assigned to you on Clearhead.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
        ${row("Booking ID", `#${appointment.id}`)}
        ${row("Patient", appointment.patientName)}
        ${row("Email", appointment.patientEmail)}
        ${row("Phone", appointment.patientPhone)}
        ${row("Date", appointment.date)}
        ${row("Time", appointment.time)}
        ${row("Session Type", appointment.type)}
        ${row("Care Type", appointment.careType)}
      </table>
      ${appointment.diagnosisSummary ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.05em;">Patient Screening Summary</p>
        <p style="margin:0;font-size:13px;color:#1e3a8a;white-space:pre-wrap;">${appointment.diagnosisSummary}</p>
      </div>` : ""}
      <a href="${sessionLink}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">Join Session Link</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Clearhead — Psychiatric Care Platform</p>
    </div>
  `;
  await sendEmail({ to: provider.email, subject: `Confirmed Session — Booking #${appointment.id}`, html });
}
