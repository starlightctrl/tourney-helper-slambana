import { json } from '@sveltejs/kit';
import startgg from '$lib/api/startgg.js';

export async function GET({ params }) {
    const { slug } = params;
    console.log('Fetching tournament with slug:', slug);
    
    try {
        const data = await startgg.getTournamentData(slug);
        
        if (!data || !data.tournament) {
            console.log('Tournament not found:', slug);
            return new Response('Tournament not found', { status: 404 });
        }
        
        console.log('Tournament found:', data.tournament.name);
        return json(data);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        return new Response('Error fetching tournament: ' + error.message, { 
            status: 500 
        });
    }
}
