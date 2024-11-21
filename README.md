# Tournament Helper

A comprehensive tournament management tool that integrates with start.gg to help track player information, payments, and tournament logistics.

## Key Features

### Tournament Management
- Import tournament data from start.gg API
- View event details, entrant counts, and standings
- Calculate prize pools and payouts automatically
- Support for both singles and team events

### Slambana-Specific Features
- Dedicated Slambana tournament browser
- First-time player tracking and fee adjustments
- DQ tracking and prize pool adjustments
- Automated $3 entry fee calculations

### Player Database
- Track player payment information (Venmo, PayPal, Zelle)
- Manage player tags and aliases
- Bulk import/export player data via Excel
- Search players by tag or alias
- Add notes and payment preferences

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `local-data` directory in the project root
4. Create `local-data/token.txt` with your start.gg API token
5. Create `local-data/players.json` for the player database
6. Run the development server: `npm run dev`

## Architecture

### Frontend
- Built with SvelteKit for optimal performance
- Responsive design that works on mobile and desktop
- Real-time prize calculations and updates
- Clean, modern UI with consistent styling

### Backend
- Node.js Express server
- RESTful API endpoints
- start.gg GraphQL integration
- Local JSON file storage for data persistence

## Security
- All sensitive data (API tokens, payment information) stored locally
- No cloud storage or external databases required
- Payment information never leaves your machine

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Common Issues
- **API Token Invalid**: Ensure your start.gg token is valid and has the required permissions
- **Player Import Fails**: Check that your Excel file matches the expected format
- **Missing Data Directory**: Create the `local-data` directory manually if needed

### File Permissions
The app needs write access to:
- `local-data/players.json` for the player database
- `local-data/token.txt` for the API token

## License
MIT License - See LICENSE file for details
