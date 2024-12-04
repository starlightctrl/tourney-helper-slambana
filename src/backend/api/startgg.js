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
            // Try server-side env first (process.env)
            this.token = process.env.STARTGG_API_KEY;
            
            // If not found, try client-side env (import.meta.env)
            if (!this.token && import.meta.env) {
                this.token = import.meta.env.VITE_STARTGG_API_KEY;
            }
            
            if (!this.token) {
                throw new Error('STARTGG_API_KEY environment variable not set');
            }
        } catch (error) {
            throw new Error('Failed to load start.gg API token: ' + error.message);
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

    async getSlambanaData(page = 1) {
        const query = `
            query SlambanaQuery($page: Int!) {
                tournaments(query: {
                    perPage: 5
                    page: $page
                    filter: {
                        name: "Slambana"
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
                    pageInfo {
                        total
                        totalPages
                        page
                        perPage
                    }
                }
            }
        `;

        return this.query(query, { page });
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
