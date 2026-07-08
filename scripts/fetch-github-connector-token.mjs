// Fetches a fresh OAuth access token for the "GitHub" Replit connection.
//
// Used by scripts/sync-github.sh as a fallback when no GITHUB_PAT secret is set.
// Prints the token to stdout on success, or prints nothing (exit 1) on failure so
// the caller can fall back gracefully.
const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;

const xReplitToken = process.env.REPL_IDENTITY
  ? `repl ${process.env.REPL_IDENTITY}`
  : process.env.WEB_REPL_RENEWAL
    ? `depl ${process.env.WEB_REPL_RENEWAL}`
    : null;

if (!hostname || !xReplitToken) {
  process.exit(1);
}

try {
  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    },
  );

  if (!response.ok) {
    process.exit(1);
  }

  const data = await response.json();
  const token = data?.items?.[0]?.settings?.access_token;

  if (!token) {
    process.exit(1);
  }

  process.stdout.write(token);
} catch {
  process.exit(1);
}
