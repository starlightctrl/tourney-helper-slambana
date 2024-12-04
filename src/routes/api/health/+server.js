import { json } from '@sveltejs/kit';
import { kv } from '@vercel/kv';

export async function GET() {
    try {
        // Test KV connection
        await kv.ping();
        
        // Check environment variables
        const envStatus = {
            KV_URL: !!process.env.KV_URL,
            KV_REST_API_URL: !!process.env.KV_REST_API_URL,
            KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
            KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
            STARTGG_API_KEY: !!process.env.STARTGG_API_KEY
        };

        return json({
            status: 'healthy',
            kvConnection: 'connected',
            environmentVariables: envStatus
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return json({
            status: 'unhealthy',
            error: error.message
        }, { status: 500 });
    }
}
import { json } from '@sveltejs/kit';

export async function GET() {
    return json({ status: 'ok' });
}
