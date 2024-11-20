<script>
    import { playerDatabaseVersion } from '../stores/playerStore';
    export let tournamentSlug = '';
    
    $: if ($playerDatabaseVersion) {
        loadPlayerDatabase(); // Only reload when version changes
    }
    let tournamentData = null;
    let error = null;
    let eventFees = {};  // Store fees for each event
    let playerDatabase = {};  // Will store player info keyed by tag

    async function loadPlayerDatabase() {
        try {
            const response = await fetch('/api/players');
            if (!response.ok) throw new Error('Failed to load player database');
            const players = await response.json();
            // Create a case-insensitive lookup object
            const newPlayerDatabase = players.reduce((acc, player) => {
                acc[player.tag.toLowerCase()] = player;
                // Also add aliases as keys pointing to the same player
                player.aliases.forEach(alias => {
                    acc[alias.toLowerCase()] = player;
                });
                return acc;
            }, {});
            
            // Update the playerDatabase after all processing is complete
            playerDatabase = newPlayerDatabase;
            
            // Force a re-render
            tournamentData = { ...tournamentData };
        } catch (error) {
            console.error('Failed to load player database:', error);
        }
    }

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

    function getPlayerPaymentInfo(gamerTag) {
        const player = playerDatabase[gamerTag.toLowerCase()];
        if (!player) return null;
        
        const methods = [];
        if (player.paymentMethods.venmo) methods.push(`Venmo: ${player.paymentMethods.venmo}`);
        if (player.paymentMethods.paypal) methods.push(`PayPal: ${player.paymentMethods.paypal}`);
        if (player.paymentMethods.zelle) methods.push(`Zelle: ${player.paymentMethods.zelle}`);
        
        return methods.length > 0 ? methods : null;
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
            const data = await response.json();
            tournamentData = data;  // Set tournament data first
            error = null;
            await loadPlayerDatabase();  // Then load player data
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
        <div class="event-grid">
            {#each tournamentData.tournament.events as event}
                <div class="event">
                    <div class="event-header">
                        <h3>{event.name}</h3>
                        <p class="entrants">Entrants: {getTotalParticipants(event)}</p>
                    </div>
                    
                    <div class="fee-calculator">
                        <div class="fee-input">
                            <label>
                                Entry Fee per Player:
                                <div class="input-with-symbol">
                                    <span class="dollar-symbol">$</span>
                                    <input 
                                        type="number" 
                                        bind:value={eventFees[event.name]} 
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                            </label>
                        </div>
                        {#if eventFees[event.name]}
                            <p class="prize-pool">Total Prize Pool: <span>${calculatePrizePool(event).toFixed(2)}</span></p>
                        {/if}
                    </div>
                <div class="standings">
                    <h4>Prize Winners:</h4>
                    <ul>
                        {#key $playerDatabaseVersion}
                            {#each event.standings.nodes.slice(0, getPrizeWinningPlacements(event.numEntrants)) as standing}
                                {#each standing.entrant.participants as participant}
                                    <li>
                                        <div class="standing-entry">
                                            <div class="placement-info">
                                                {standing.placement}. {participant.gamerTag} 
                                                {#if eventFees[event.name]}
                                                    - ${getPrizeForPlacement(event, standing.placement).toFixed(2)}
                                                {/if}
                                            </div>
                                            {#if eventFees[event.name]}
                                                <div class="payment-info">
                                                    {#if getPlayerPaymentInfo(participant.gamerTag)}
                                                        {#each getPlayerPaymentInfo(participant.gamerTag) as method}
                                                            <div class="payment-method">{method}</div>
                                                        {/each}
                                                    {:else}
                                                        <div class="no-payment">No payment info available</div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    </li>
                                {/each}
                            {/each}
                        {/key}
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

    .event-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        margin: 2rem 0;
    }

    .event {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        transition: transform 0.2s ease;
    }

    .event:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .event-header {
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
    }

    .event-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.4rem;
    }

    .entrants {
        margin: 0.5rem 0 0;
        color: #666;
        font-size: 0.9rem;
    }

    .fee-calculator {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 1rem;
        margin: 1rem 0;
    }

    .fee-input {
        margin-bottom: 1rem;
    }

    .input-with-symbol {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }

    .dollar-symbol {
        padding: 0.5rem;
        background: #f0f0f0;
        color: #666;
        border-right: 1px solid #ddd;
    }

    .input-with-symbol input {
        border: none;
        padding: 0.5rem;
        width: 100px;
        margin: 0;
    }

    .prize-pool {
        font-weight: 500;
        color: #2c3e50;
        margin: 0;
    }

    .prize-pool span {
        color: #2ecc71;
        font-weight: 600;
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

    .standing-entry {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 1rem;
        margin: 0.5rem 0;
        transition: background-color 0.2s ease;
    }

    .standing-entry:hover {
        background: #f0f0f0;
    }

    .placement-info {
        color: #2c3e50;
        font-size: 1.1rem;
        font-weight: 500;
    }

    .payment-info {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px dashed #ddd;
    }

    .payment-method {
        color: #666;
        font-size: 0.9rem;
        padding: 0.2rem 0;
    }

    .no-payment {
        color: #999;
        font-style: italic;
        font-size: 0.9rem;
    }

    h2 {
        color: #2c3e50;
        text-align: center;
        margin: 2rem 0;
        font-size: 2rem;
        font-weight: 600;
    }

    .search-section {
        max-width: 500px;
        margin: 2rem auto;
        display: flex;
        gap: 1rem;
    }

    .search-section input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
    }

    .search-section input:focus {
        border-color: #3498db;
        outline: none;
    }

    .search-section button {
        background: #3498db;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .search-section button:hover {
        background: #2980b9;
    }
</style>
