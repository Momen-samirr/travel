# Flight Search: Amadeus Online Suite (AOS) Redirect

Flight search on this site uses a **redirect-only** integration with Amadeus Online Suite (AOS). No Amadeus API is used for flights.

## How it works

1. The user enters search criteria on the Flights page (origin, destination, dates, passengers, cabin, etc.).
2. On submit, the app validates the form and builds an AOS flight search URL.
3. The user is redirected to `https://{agency}.amadeusonlinesuite.com/flight/search?...` with the search parameters in the query string.
4. Search and booking are completed on the AOS site. No bookings or prices are synced back to this application.

## Configuration

- **`NEXT_PUBLIC_AOS_AGENCY`** – Agency subdomain for the AOS base URL (e.g. `youragency` for `https://youragency.amadeusonlinesuite.com`). Set in `.env` or `.env.local`. No Amadeus API keys are required for this flow.

## Implementation

- **URL builder:** `src/lib/aos-flight-redirect.ts` – builds the AOS flight search URL from form inputs. Parameter names may need to be aligned with AOS documentation or your agency contract.
- **Flights page:** `src/app/flights/page.tsx` – form plus redirect on submit; no backend flight search or results.

## No Amadeus API for flights

- The project does **not** use `AMADEUS_CLIENT_ID` or `AMADEUS_CLIENT_SECRET` for flight search or booking.
- Airport autocomplete uses static data served from `/api/airports` (see `src/lib/airports-data.ts`), not the Amadeus API.

## Replacing with direct API later

The AOS redirect logic is isolated in `aos-flight-redirect.ts`. If Amadeus API access is added later, you can replace the redirect flow with direct search/booking API calls without changing the rest of the app structure.
