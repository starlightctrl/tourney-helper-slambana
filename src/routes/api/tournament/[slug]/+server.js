import { json } from '@sveltejs/kit';
import tournamentDb from '$lib/database/tournamentDb';

export async function GET({ params }) {
    const { slug } = params;
    const tournament = await tournamentDb.getTournament(slug);
    
    if (!tournament) {
        return new Response('Tournament not found', { status: 404 });
    }
    
    return json(tournament);
}
