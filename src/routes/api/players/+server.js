import { json } from '@sveltejs/kit';
import playerDb from '$lib/database/playerDb';

export async function GET() {
    const players = await playerDb.getAllPlayers();
    return json(players);
}

export async function POST({ request }) {
    const data = await request.json();
    const player = await playerDb.addPlayer(data);
    return json(player);
}

export async function DELETE() {
    await playerDb.clearDatabase();
    return json({ message: 'Database cleared successfully' });
}

export async function PUT({ request }) {
    const data = await request.json();
    const result = await playerDb.mergePlayers(data);
    return json(result);
}
