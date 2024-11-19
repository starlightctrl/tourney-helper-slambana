<script>
    export let tournamentSlug = '';
    let tournamentData = null;
    let error = null;
    let eventFees = {};  // Store fees for each event

    function calculatePrizePool(event) {
        const fee = eventFees[event.name] || 0;
        const totalParticipants = getTotalParticipants(event);
        return fee * totalParticipants;
    }

    function getPrizeForPlacement(event, placement) {
        if (!eventFees[event.name]) return 0;
        
        const prizePool = calculatePrizePool(event);
        const entrants = event.numEntrants;
        const teamSize = event.teamRosterSize ? event.teamRosterSize.maxPlayers : 1;
        
        // Prize splits based on number of entrants
        let percentage = 0;
        
        if (entrants <= 8) {
            if (placement === 1) percentage = 0.70;
            else if (placement === 2) percentage = 0.30;
        }
        else if (entrants <= 16) {
            if (placement === 1) percentage = 0.60;
            else if (placement === 2) percentage = 0.30;
            else if (placement === 3) percentage = 0.10;
        }
        else if (entrants <= 28) {
            if (placement === 1) percentage = 0.50;
            else if (placement === 2) percentage = 0.25;
            else if (placement === 3) percentage = 0.15;
            else if (placement === 4) percentage = 0.10;
        }
        else if (entrants <= 39) {
            if (placement === 1) percentage = 0.40;
            else if (placement === 2) percentage = 0.25;
            else if (placement === 3) percentage = 0.15;
            else if (placement === 4) percentage = 0.10;
            else if (placement === 5) percentage = 0.05;
        }
        else {
            if (placement === 1) percentage = 0.40;
            else if (placement === 2) percentage = 0.20;
            else if (placement === 3) percentage = 0.15;
            else if (placement === 4) percentage = 0.10;
            else if (placement === 5) percentage = 0.05;
            else if (placement === 7) percentage = 0.025;
        }
        
        // Calculate prize and divide by team size
        return (prizePool * percentage) / teamSize;
    }

    function getTotalParticipants(event) {
        // If it's a team event, multiply numEntrants by roster size
        return event.teamRosterSize ? event.numEntrants * event.teamRosterSize.maxPlayers : event.numEntrants;
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
            console.log('Fetching tournament:', encodedSlug); // Debug log
            const response = await fetch(`/api/tournament/${encodedSlug}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch tournament data: ${errorText}`);
            }
            tournamentData = await response.json();
            error = null;
        } catch (e) {
            console.error('Fetch error:', e); // Debug log
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
                <div class="fee-calculator">
                    <label>
                        Entry Fee per Player: $
                        <input 
                            type="number" 
                            bind:value={eventFees[event.name]} 
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </label>
                    {#if eventFees[event.name]}
                        <p>Total Prize Pool: ${calculatePrizePool(event).toFixed(2)}</p>
                    {/if}
                </div>
                <div class="standings">
                    <h4>Prize Winners:</h4>
                    <ul>
                        {#each event.standings.nodes.slice(0, getPrizeWinningPlacements(event.numEntrants)) as standing}
                            {#each standing.entrant.participants as participant}
                                <li>
                                    {standing.placement}. {participant.gamerTag} 
                                    {#if eventFees[event.name]}
                                        - ${getPrizeForPlacement(event, standing.placement).toFixed(2)}
                                    {/if}
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

    .fee-calculator {
        margin: 1rem 0;
        padding: 0.5rem;
        background-color: #f5f5f5;
        border-radius: 4px;
    }

    .fee-calculator input {
        width: 80px;
        margin-left: 0.5rem;
        padding: 0.25rem;
    }

    .fee-calculator p {
        margin: 0.5rem 0;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        padding: 0.5rem 0;
    }
</style>
