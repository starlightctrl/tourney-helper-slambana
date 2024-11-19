<script>
    export let tournamentSlug = '';
    let tournamentData = null;
    let error = null;

    function getTotalParticipants(event) {
        // If it's a team event, multiply numEntrants by roster size
        return event.teamRosterSize ? event.numEntrants * event.teamRosterSize : event.numEntrants;
    }

    function getPrizeWinningPlacements(numEntrants) {
        if (numEntrants < 9) return 2;
        if (numEntrants < 17) return 3;
        if (numEntrants < 29) return 4;
        if (numEntrants < 40) return 6; // Includes two 5th places
        return 8; // Includes two 5th places and two 7th places
    }

    async function fetchTournamentData() {
        try {
            const encodedSlug = encodeURIComponent(tournamentSlug);
            const response = await fetch(`/api/tournament/${encodedSlug}`);
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
    <form class="search-section" on:submit|preventDefault={fetchTournamentData}>
        <input 
            type="text" 
            bind:value={tournamentSlug} 
            placeholder="Enter tournament slug"
            autocomplete="on"
            name="tournament-slug"
        />
        <button type="submit">Load Tournament</button>
    </form>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if tournamentData}
        <h2>{tournamentData.tournament.name}</h2>
        {#each tournamentData.tournament.events as event}
            <div class="event">
                <h3>{event.name}</h3>
                <p>Entrants: {getTotalParticipants(event)}</p>
                <div class="standings">
                    <h4>Prize Winners:</h4>
                    <ul>
                        {#each event.standings.nodes.slice(0, getPrizeWinningPlacements(event.numEntrants)) as standing}
                            {#each standing.entrant.participants as participant}
                                <li>
                                    {standing.placement}. {participant.gamerTag}
                                </li>
                            {/each}
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
