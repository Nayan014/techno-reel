# Security reports

Do not post credentials, private recordings or exploit details in public issues.

Use the repository's **Security → Report a vulnerability** form when private vulnerability
reporting is enabled. If that form is unavailable, contact the maintainer through a profile
linked in README.md to request a private reporting channel before sending sensitive details.
No dedicated security email address or response-time guarantee is provided yet.

Include the affected commit/version, impact and a minimal reproduction without real secrets.
If you exposed a key, revoke or rotate it with its provider; deleting a file from the latest
commit does not remove it from Git history.

Maintainer release checklist: enable GitHub private vulnerability reporting, secret scanning
and push protection where available; review repository history before changing visibility.
