# Tournament Helper

A web application for tournament organizers to manage payouts and player information, with special support for Slambana tournaments.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `local-data` directory and add:
   - `token.txt` with your start.gg API token
   - `players.json` for the player database (see `example-players.json`)
4. Start the development server: `npm run dev`

## Features

- Tournament data fetching from start.gg
- Prize pool calculations and payout tracking
- Player payment information database
- Slambana tournament support:
  - First-timer tracking
  - DQ adjustments
  - $3 entry fee calculations

## Player Database

Import or manually add players with:
- Player tag
- Payment methods (Venmo, PayPal, Zelle)
- Aliases
- Notes
