<script>
    import TournamentDisplay from '../frontend/components/TournamentDisplay.svelte';
    import PlayerDatabase from '../frontend/components/PlayerDatabase.svelte';
    
    let activeTab = 'general'; // or 'slambana'
</script>

<main>
    <h1>Tournament Helper</h1>
    
    <div class="tab-container">
        <button 
            class:active={activeTab === 'general'} 
            on:click={() => activeTab = 'general'}
        >
            General Tournament
        </button>
        <button 
            class:active={activeTab === 'slambana'} 
            on:click={() => activeTab = 'slambana'}
        >
            Slambana
        </button>
    </div>

    <section>
        {#if activeTab === 'general'}
            <TournamentDisplay />
        {:else}
            <TournamentDisplay isSlambana={true} />
        {/if}
    </section>
    
    <section>
        <PlayerDatabase />
    </section>
</main>

<style>
    main {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    section {
        margin-bottom: 2rem;
    }

    .tab-container {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        justify-content: center;
    }

    button {
        padding: 0.75rem 1.5rem;
        border: 2px solid var(--color-primary);
        background: white;
        color: var(--color-primary);
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    button.active {
        background: var(--color-primary);
        color: white;
    }

    button:hover {
        background: var(--color-secondary);
        color: white;
    }
</style>
