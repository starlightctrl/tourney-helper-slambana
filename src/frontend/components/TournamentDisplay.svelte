<script>
    export let tournamentSlug = '';
    let tournamentData = null;
    let error = null;

    async function fetchTournamentData() {
        try {
            const response = await fetch(`/api/tournament/${tournamentSlug}`);
            if (!response.ok) throw new Error('Failed to fetch tournament data');
            tournamentData = await response.json();
            error = null;
        } catch (e) {
            error = e.message;
            tournamentData = null;
        }
    }
</script>

<div class="tournament-display">
    <div class="search-section">
        <input 
            type="text" 
            bind:value={tournamentSlug} 
            placeholder="Enter tournament slug"
        />
        <button on:click={fetchTournamentData}>Load Tournament</button>
    </div>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if tournamentData}
        <h2>{tournamentData.tournament.name}</h2>
        {#each tournamentData.tournament.events as event}
            <div class="event">
                <h3>{event.name}</h3>
                <p>Entrants: {event.numEntrants}</p>
                <div class="standings">
                    <h4>Top 8:</h4>
                    <ul>
                        {#each event.standings.nodes as standing}
                            <li>
                                {standing.placement}. {standing.entrant.name}
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
        {/each}
    {/if}
</div>

<style>
    .tournament-display {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .search-section {
        margin-bottom: 1rem;
    }

    .event {
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }

    .error {
        color: red;
        padding: 1rem;
        border: 1px solid red;
        border-radius: 4px;
        margin: 1rem 0;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        padding: 0.5rem 0;
    }
</style>
