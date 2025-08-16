# SuperNet Mobile Core

Shared mobile SDK for device pairing and action approvals used by Android and iOS shells.
This module builds TypeScript to `dist/` and exposes stable entry points:

- `startPairing({ deviceId, userHandle, publicKeyPem? })`
- `requestApproval({ subject, reason, budget? })`

## Dev
- `npm run check`
- `npm run build`