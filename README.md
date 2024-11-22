# Tournament Helper

A web application for tournament organizers to manage payouts and player information, with special support for Slambana tournaments.

## Setup

1. Clone the repository: `git clone https://github.com/starlightctrl/tourney-helper.git`
2. Install dependencies: `npm install`
3. Create a `local-data` directory and add:
   - `token.txt` with your start.gg API token (which you can grab [here](https://start.gg/admin/profile/developer))
   - `players.json`, you can copy `example-players.json` to `local-data`, rename, and customize.
      - You can also import an Excel XLSX file with the following columns in the same order: Tag, Venmo, Paypal, Zelle
      - TODO: see if the column order actually matters or not.
4. Start the development server: `npm run dev`

## Features

- Tournament data from start.gg
- Prize pool calculations
- Player payment tracking
- Slambana tournament support with first-timer and DQ tracking

## Player Database

Import or manually add players with:
- Player tag
- Payment methods (Venmo, PayPal, Zelle)
- Aliases
- Notes
