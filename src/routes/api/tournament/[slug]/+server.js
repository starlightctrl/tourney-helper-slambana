import { json } from '@sveltejs/kit';
import tournamentDb from '$lib/database/tournamentDb';

export async function GET({ params }) {
    const { slug } = params;
    console.log('Fetching tournament with slug:', slug); // Debug log
    
    try {
        const tournament = await tournamentDb.getTournament(slug);
        
        if (!tournament) {
            console.log('Tournament not found:', slug); // Debug log
            return new Response('Tournament not found', { status: 404 });
        }
        
        console.log('Tournament found:', tournament.name); // Debug log
        return json(tournament);
    } catch (error) {
        console.error('Error fetching tournament:', error); // Debug log
        return new Response('Error fetching tournament: ' + error.message, { 
            status: 500 
        });
    }
}
