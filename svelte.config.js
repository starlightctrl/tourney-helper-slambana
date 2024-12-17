import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        alias: {
            '$lib': './src/lib',
            '$components': './src/frontend/components'
        }
    }
};

export default config;
