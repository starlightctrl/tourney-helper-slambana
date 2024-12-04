import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: vercel({
            runtime: 'nodejs20.x'
        }),
        alias: {
            '$lib': './src/lib',
            '$components': './src/lib/components'
        }
    }
};

export default config;
