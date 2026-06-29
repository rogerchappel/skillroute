# Security Policy

## Supported Versions

`skillroute` is a pre-1.0 local-first CLI. Security fixes are accepted for the current `main` branch and the latest npm pre-release line.

## Reporting a Vulnerability

Please report vulnerabilities through GitHub private vulnerability reporting when available, or open a minimal public issue that asks for a private contact path without including sensitive details.

Include:

- The affected command or library API.
- A minimal local fixture that reproduces the issue.
- Whether private skill catalogs, task prompts, or approval notes were exposed.

Do not include secrets, proprietary skill catalogs, private prompts, or organization-specific approval policies in public issues.

## Scope

`skillroute` does not install, apply, or execute skills. Reports about route scoring, unsafe recommendation text, package contents, and local file handling are in scope. Requests to publish, approve, or enable live skills are outside this package and should use the hosting system's security process.
