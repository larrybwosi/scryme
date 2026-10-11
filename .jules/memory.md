## Memory Updates

- In `entrypoint.sh` and `deploy.sh`, automatic database and Sanity seeding logic was removed from deployment routines. Manual seed commands remain available via package scripts (`pnpm db:seed` and `pnpm sanity:seed`).
- In `apps/site` (`globals.css`, `PlatformShowcase`, `TrustBar`), design tokens were updated with modern OKLCH CSS variables for adaptive light and dark theme switching with smooth transitions and high contrast legibility.
- In `apps/site/components/home/`, `TrustBar` and `PlatformShowcase` were redesigned with interactive metric badges, brand logo carousels, Framer Motion transitions, and responsive dark/light adaptive surfaces.
