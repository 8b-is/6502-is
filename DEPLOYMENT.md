# Production deployment

## Current release

- Public URL: https://6502.is/
- Published on: 2026-11-01 (UTC)
- Source revision: `47001aa9596e13e11bd75e445c06383b86171412`
- Build command: `npm run build`
- Host: `ns3-hil-i1-is` (`5.78.220.57`)
- Hosting: existing `i1-is` edge, orchestrator `static_dir` registration for **6502.is only**.
- Release directory: `/var/lib/i1-is/releases/6502.is/47001aa-20261101`
- Built index SHA-256: `92d57eb83d71088cdc7b899d97441be6b2ce52e1c584e6b179a5a49cd7404567`

This is a production static build, not the Vite development server. No new long-running service is required. Git pushes do not automatically redeploy this registration. The DNS addresses, TLS provider, shared edge service, and mail services were not replaced.

## Backup and rollback

The previous homepage was the edge's default landing page; no explicit site registration existed for `6502.is`.

Backup directory on the production host:

`/var/backups/6502.is/20261101T094039Z`

Contents:

- `previous-homepage.html` — prior public homepage.
- `previous-site.json` — prior domain registration response (`ok: false`, no registered site).
- `published-site.json` — new static-site registration, with no credentials.

To restore the previous routing, use an authorized orchestrator credential to send **DELETE** to `http://127.0.0.1:5380/api/orchestrator/sites?domain=6502.is` on the production host. The edge refreshes its site cache every five seconds. This removes only the simulator's domain registration and returns the domain to its original landing-page handler. Retain the release files for reactivation.

Do not restore the entire shared orchestrator state or restart unrelated services for this rollback.

## Subsequent releases

1. Build and verify the app locally.
2. Upload only `dist/` into a new versioned directory beneath `/var/lib/i1-is/releases/6502.is/`.
3. Back up the existing `6502.is` site registration.
4. Using an authorized credential, POST the updated site registration to the host's loopback `/api/orchestrator/sites` endpoint, changing `local_dir` to the new release. Preserve the domain's existing network and TLS settings.
5. Verify https://6502.is/, asset checksums, and browser rendering before removing any old release.

Do not upload source files, credentials, or `node_modules` into the public release directory.
