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
                        <h4>Prize Winners</h4>
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
        </div>
    {/if}
</div>

<style>
    /* Remove spinner arrows from number inputs */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] {
        -moz-appearance: textfield;
    }

    .tournament-display {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .event-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 1.5rem 0;
    }

    .event {
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
        padding: 1.5rem;
        transition: all 0.2s ease;
    }

    .event:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .event-header {
        border-bottom: 2px solid #f5f5f5;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
    }

    .event-header h3 {
        color: #2d3748;
        font-size: 1.4rem;
        font-weight: 600;
        margin: 0;
    }

    .entrants {
        margin: 0.25rem 0 0;
        color: #546e7a;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .fee-calculator {
        background: linear-gradient(to right, #f8f9fa, #ffffff);
        border-radius: 8px;
        padding: 0.75rem;
        margin: 0.75rem 0;
    }

    .fee-input {
        margin-bottom: 0.75rem;
        width: 100%;
    }

    .input-with-symbol {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #ced4da;
        border-radius: 6px;
        overflow: hidden;
        transition: all 0.2s ease;
        width: 100%;
    }

    .input-with-symbol:focus-within {
        border-color: #4a90e2;
        box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
    }

    .dollar-symbol {
        padding: 0.5rem;
        background: #f1f3f5;
        color: #495057;
        border-right: 1px solid #ced4da;
        font-weight: 600;
    }

    .input-with-symbol input {
        border: none;
        padding: 0.5rem;
        width: 100%;
        margin: 0;
        font-size: 0.95rem;
    }

    .prize-pool {
        font-weight: 500;
        color: #2c3e50;
        margin: 0;
        font-size: 0.95rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .prize-pool span {
        color: #00796b;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .standings {
        margin-top: 1rem;
    }

    .standings h4 {
        color: #37474f;
        font-size: 1rem;
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e9ecef;
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    li {
        padding: 0.25rem 0;
    }

    .standing-entry {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.875rem;
        margin: 0.5rem 0;
        transition: all 0.2s ease;
    }

    .standing-entry:hover {
        background: #f8fafc;
        transform: translateX(2px);
    }

    .placement-info {
        color: #2c3e50;
        font-size: 1rem;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .payment-info {
        margin-top: 0.4rem;
        padding-top: 0.4rem;
        border-top: 1px dashed #e9ecef;
    }

    .payment-method {
        color: #546e7a;
        font-size: 0.85rem;
        padding: 0.15rem 0;
        display: flex;
        align-items: center;
    }

    .payment-method::before {
        content: "•";
        margin-right: 0.5rem;
        color: #4a90e2;
    }

    .no-payment {
        color: #9e9e9e;
        font-style: italic;
        font-size: 0.85rem;
        padding: 0.15rem 0;
    }

    h2 {
        color: #1a237e;
        text-align: center;
        margin: 1.5rem 0;
        font-size: 1.8rem;
        font-weight: 700;
        letter-spacing: -0.5px;
    }

    .search-section {
        max-width: 500px;
        margin: 1.5rem auto;
        display: flex;
        gap: 0.75rem;
    }

    .search-section input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
        background: #f8f9fa;
    }

    .search-section input:focus {
        border-color: #4a90e2;
        background: white;
        outline: none;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
    }

    .search-section button {
        background: linear-gradient(to right, #4a90e2, #357abd);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2);
    }

    .search-section button:hover {
        background: linear-gradient(to right, #357abd, #2861a1);
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);
    }

    .error {
        color: #dc3545;
        padding: 1rem;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        margin: 1rem 0;
        background: #fff5f5;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .error::before {
        content: "⚠️";
        margin-right: 0.5rem;
    }

    @media (max-width: 768px) {
        .event-grid {
            grid-template-columns: 1fr;
        }

        .search-section {
            flex-direction: column;
        }

        .search-section button {
            width: 100%;
        }
    }
</style>
