# tourney-helper

A tournament management tool that integrates with start.gg to help track player information and payments.

## Features
- Import tournament data from start.gg
- Track player payment information (Venmo, PayPal, Zelle)
- Manage player tags and aliases
- View tournament event details and prize distribution
- Import/Export player database

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `local-data/token.txt` file with your start.gg API token
4. Run the development server: `npm run dev`

## Local Data
All sensitive data (API tokens, player payment information) is stored locally and ignored by git.

## Development
- Frontend: Svelte
- Backend: Node.js
- Data Storage: Local JSON files
