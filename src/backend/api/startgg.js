import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class StartGGAPI {
    constructor() {
        this.endpoint = 'https://api.start.gg/gql/alpha';
        this.token = null;
    }

    async initialize() {
        try {
            this.token = await fs.readFile(path.join(__dirname, '../../../local-data/token.txt'), 'utf8');
            this.token = this.token.trim();
        } catch (error) {
            throw new Error('Failed to load start.gg API token. Ensure token.txt exists in local-data/');
        }
    }

    async query(queryString, variables = {}) {
        if (!this.token) {
            await this.initialize();
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                query: queryString,
                variables: variables,
            }),
        });

        const json = await response.json();
        if (json.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
        }

        return json.data;
    }

    async getSlambanaData() {
        const query = `
            query SlambanaQuery {
                tournaments(query: {
                    perPage: 10,
                    filter: {
                        location: {
                            distanceFrom: "40.1164,-88.2434",
                            distance: "20mi"
                        },
                        videogameIds: [1],
                        upcoming: true
                    }
                }) {
                    nodes {
                        name
                        slug
                        startAt
                        venueAddress
                        city
                        addrState
                        events {
                            name
                            numEntrants
                            teamRosterSize {
                                maxPlayers
                            }
                            type
                        }
                    }
                }
            }
        `;

        return this.query(query);
    }

    async getTournamentData(tournamentSlug) {
        const query = `
            query TournamentQuery($slug: String!) {
                tournament(slug: $slug) {
                    name
                    events {
                        name
                        numEntrants
                        teamRosterSize {
                            maxPlayers
                        }
                        type
                        standings(query: {
                            page: 1
                            perPage: 8
                        }) {
                            nodes {
                                placement
                                entrant {
                                    name
                                    participants {
                                        gamerTag
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        return this.query(query, { slug: tournamentSlug });
    }
}

export default new StartGGAPI();
