import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: vercel(),
        alias: {
            '$lib': './src/lib',
            '$components': './src/lib/components'
        }
    }
};

export default config;
