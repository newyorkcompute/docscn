# Security Policy

## Supported versions

docscn is under active development. Security fixes are applied to the latest
`main` branch.

| Version              | Supported   |
| -------------------- | ----------- |
| latest `main`        | yes         |
| older commits / tags | best effort |

## Reporting a vulnerability

If you believe you have found a security issue, please report it privately
instead of opening a public GitHub issue.

Preferred contact:

- GitHub Security Advisories:
  https://github.com/newyorkcompute/docscn/security/advisories/new
- Or email the maintainers through the contact method listed on the repository

Please include:

- A clear description of the issue
- Steps to reproduce
- Impact assessment, if known
- Any suggested fix or mitigation

We will acknowledge receipt as quickly as we can and work on a fix or mitigation
plan. Please allow reasonable time before public disclosure.

## Scope

In scope:

- Authentication, session handling, and API key flows
- Artifact access control and visibility rules
- Sandbox escape or unsafe rendering of uploaded HTML
- Injection or privilege escalation in API routes
- Secrets exposure in logs, responses, or client bundles

Out of scope:

- Denial of service through large artifact uploads without a demonstrated
  practical exploit path
- Issues requiring compromised local developer machines
- Third-party services not operated by docscn deployments

## Safe defaults

Self-hosted operators should:

- Set a strong `BETTER_AUTH_SECRET`
- Keep Postgres and object storage credentials private
- Treat API keys like passwords and rotate them when compromised
- Run docscn behind HTTPS in production
