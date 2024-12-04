import { json } from '@sveltejs/kit';
import tournamentDb from '$lib/database/tournamentDb';

export async function GET() {
    const tournaments = await tournamentDb.getAllTournaments();
    return json(tournaments);
}

export async function POST({ request }) {
    const data = await request.json();
    const tournament = await tournamentDb.addTournament(data);
    return json(tournament);
}

export async function DELETE() {
    await tournamentDb.clearDatabase();
    return json({ message: 'Database cleared successfully' });
}

export async function PUT({ request }) {
    const data = await request.json();
    const result = await tournamentDb.updateTournament(data);
    return json(result);
}
