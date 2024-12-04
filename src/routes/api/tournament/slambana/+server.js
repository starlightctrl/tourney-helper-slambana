import { json } from '@sveltejs/kit';
import startgg from '$lib/api/startgg';

export async function GET({ url }) {
    const page = Number(url.searchParams.get('page')) || 1;
    
    try {
        const data = await startgg.getSlambanaData(page);
        return json({ data });
    } catch (error) {
        console.error('Error fetching Slambana tournaments:', error);
        return new Response('Error fetching Slambana tournaments: ' + error.message, { 
            status: 500 
        });
    }
}
