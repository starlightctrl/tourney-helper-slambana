import { json } from '@sveltejs/kit';
import playerDb from '$lib/database/playerDb';

export async function PUT({ params, request }) {
    const data = await request.json();
    const player = await playerDb.updatePlayer(params.tag, data);
    return json(player);
}

export async function DELETE({ params }) {
    await playerDb.deletePlayer(params.tag);
    return json({ success: true });
}
