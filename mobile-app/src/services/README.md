# Service boundary

- `authService.ts` owns Supabase Auth registration, login, logout, and recovery.
- `profileService.ts` owns profile reads and safe user-editable updates.
- Raw Supabase queries stay outside screen components.

Future services can add packages, subscription entitlements, payments, and content access without changing the shared identity model. Existing workout, subscription, and payment UI remains mock-only until those later phases.
