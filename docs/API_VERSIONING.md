# API Versioning Strategy

## Overview
The HRM API follows a URI-based versioning strategy to ensure backward compatibility while allowing iterative improvements.

## Version Format
- Base path: `/api/v1` (current)
- Future versions: `/api/v2`, `/api/v3`, etc.

## Compatibility Rules
- **Non-breaking changes** (additive fields, new endpoints) stay within the current version.
- **Breaking changes** require a new major API version.
- Deprecations must be announced in release notes with timelines.

## Deprecation Policy
- Minimum 90-day notice for breaking changes
- Deprecation communicated via changelog and documentation

## Implementation Notes
- Existing routes should be aliased or mounted under `/api/v1` when versioning is introduced.
- API gateway or reverse proxy can route versioned paths to services.
