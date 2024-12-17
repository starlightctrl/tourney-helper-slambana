<script>
    import { onMount } from 'svelte';
    import { playerDatabaseVersion } from '../stores/playerStore';
    export let tournamentSlug = '';
    export let isSlambana = false;
    
    let slambanaList = null;
    let currentPage = 1;
    let pageInfo = null;
    
    $: if ($playerDatabaseVersion) {
        loadPlayerDatabase(); // Only reload when version changes
    }

    $: if (isSlambana && !slambanaList) {
        loadSlambanaList();
    }

    function nextPage() {
        if (pageInfo && currentPage < pageInfo.totalPages) {
            currentPage++;
            loadSlambanaList(currentPage);
        }
    }

    function previousPage() {
        if (currentPage > 1) {
            currentPage--;
            loadSlambanaList(currentPage);
        }
    }
    let firstTimerCounts = {};
    let dqCounts = {};
    let tournamentData = null;
    let error = null;
    let eventFees = {};  // Store fees for each event
    let playerDatabase = {};  // Will store player info keyed by tag
    let prevPool = null;
    let prevFee = null;
    
    // Make prize pools reactive
    $: prizePools = tournamentData?.tournament?.events?.reduce((acc, event) => {
        acc[event.name] = calculatePrizePool(event);
        return acc;
    }, {}) || {};

    // Make individual prizes reactive
    $: prizePlacings = tournamentData?.tournament?.events?.reduce((acc, event) => {
        const placements = event.standings.nodes.slice(0, getPrizeWinningPlacements(getTotalParticipants(event))).map(standing => ({
            placement: standing.placement,
            prize: getPrizeForPlacement(event, standing.placement)
        }));
        acc[event.name] = placements;
        return acc;
    }, {}) || {};

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
        if (isSlambana) {
            const firstTimers = event.name === "Ultimate Singles" ? (firstTimerCounts[event.name] || 0) : 0;
            const dqs = dqCounts[event.name] || 0;
            const adjustedEntrants = Math.max(0, event.numEntrants - firstTimers - dqs);
            return 3 * adjustedEntrants;
        } else {
            const fee = Number(eventFees[event.name]) || 0;
            prevFee = fee;
            prevPool = fee * getTotalParticipants(event);
            return prevPool;
        }
    }

    function getPrizeForPlacement(event, placement) {
        if ((!eventFees[event.name] || eventFees[event.name] <= 0) && !isSlambana) return 0;
        
        const prizePool = calculatePrizePool(event);
        const entrants = getTotalParticipants(event); // Use adjusted count
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
        if (isSlambana) {
            const firstTimers = event.name === "Ultimate Singles" ? (firstTimerCounts[event.name] || 0) : 0;
            const dqs = dqCounts[event.name] || 0;
            return Math.max(0, event.numEntrants - firstTimers - dqs);
        } else {
            return event.teamRosterSize ? event.numEntrants * event.teamRosterSize.maxPlayers : event.numEntrants;
        }
    }

    function getPrizeWinningPlacements(numEntrants) {
        const adjustedNum = Math.max(0, numEntrants); // Ensure non-negative
        if (adjustedNum < 9) return 2;
        if (adjustedNum < 17) return 3;
        if (adjustedNum < 29) return 4;
        if (adjustedNum < 40) return 6; // Includes two 5th places
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

    async function loadSlambanaList(page = 1) {
        try {
            const response = await fetch(`/api/tournament/slambana?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch Slambana tournaments');
            const data = await response.json();
            slambanaList = data?.data?.tournaments?.nodes || [];
            pageInfo = data?.data?.tournaments?.pageInfo;
            currentPage = pageInfo?.page || 1;
            if (!slambanaList?.length) {
                error = 'No tournaments found';
            }
        } catch (e) {
            console.error('Slambana load error:', e);
            error = e.message;
            slambanaList = [];
        }
    }

    onMount(async () => {
        if (isSlambana) {
            await loadSlambanaList();
        }
    });

    async function fetchTournamentData() {
        try {
            // Reset the counts when loading a new tournament
            firstTimerCounts = {};
            dqCounts = {};
            
            const encodedSlug = encodeURIComponent(tournamentSlug);
            console.log('Fetching tournament:', encodedSlug);
            const response = await fetch(`/api/tournament/${encodedSlug}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch tournament data: ${errorText}`);
            }
            const data = await response.json();
            tournamentData = data;
            error = null;
            await loadPlayerDatabase();
        } catch (e) {
            console.error('Fetch error:', e); // Debug log
            error = e.message;
            tournamentData = null;
        }
    }
</script>

<div class="tournament-display" class:slambana-layout={isSlambana}>
    {#if !isSlambana}
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
    {:else}
        <div class="slambana-content">
            <div class="slambana-tournaments">
                {#if slambanaList}
                    <div class="tournament-list">
                        {#each slambanaList as tournament}
                            <button 
                                class="tournament-item" 
                                on:click={() => {
                                    tournamentSlug = tournament.slug;
                                    fetchTournamentData();
                                }}
                            >
                                <h3>{tournament.name}</h3>
                                <div class="tournament-details">
                                    <span class="date">
                                        {new Date(tournament.startAt * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                            </button>
                        {/each}
                    </div>
                    <div class="pagination">
                        <button 
                            on:click={previousPage} 
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span class="page-info">
                            Page {currentPage} of {pageInfo?.totalPages || 1}
                        </span>
                        <button 
                            on:click={nextPage} 
                            disabled={!pageInfo?.totalPages || currentPage >= pageInfo.totalPages}
                        >
                            Next
                        </button>
                    </div>
                {:else}
                    <div class="loading">Loading Slambana tournaments...</div>
                {/if}
            </div>
        </div>
    {/if}

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if tournamentData}
        <div class="tournament-data">
            <h2>{tournamentData.tournament.name}</h2>
            <div class="event-grid">
            {#each tournamentData.tournament.events as event}
                {@const firstTimerCount = firstTimerCounts[event.name] || 0}
                {@const dqCount = dqCounts[event.name] || 0}
                {@const adjustedEntrants = event.numEntrants - (event.name === "Ultimate Singles" ? firstTimerCount : 0) - dqCount}
                <div class="event">
                    <div class="event-header">
                        <h3>{event.name}</h3>
                        <p class="entrants">Entrants: {getTotalParticipants(event)}</p>
                    </div>
                    
                    {#if !isSlambana}
                        <div class="fee-calculator">
                            <div class="fee-input">
                                <label>
                                    Entry Fee per Player:
                                    <div class="input-with-symbol">
                                        <span class="dollar-symbol">$</span>
                                        <input 
                                            type="number" 
                                            value={eventFees[event.name] || ''}
                                            on:input={(e) => {
                                                eventFees = {
                                                    ...eventFees,
                                                    [event.name]: e.target.value
                                                };
                                            }}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </label>
                            </div>
                            {#if eventFees[event.name]}
                                <p class="prize-pool">Total Prize Pool: <span>${prizePools[event.name]?.toFixed(2)}</span></p>
                            {/if}
                        </div>
                    {:else}
                        <div class="fee-calculator">
                            <p class="fee-display">Entry Fee: $3</p>
                            <div class="slambana-adjustments">
                                {#if event.name === "Ultimate Singles"}
                                    <div class="adjustment-input">
                                        <label>
                                            First-Time Players:
                                            <input 
                                                type="number" 
                                                bind:value={firstTimerCounts[event.name]} 
                                                min="0"
                                                max={event.numEntrants}
                                                placeholder="0"
                                            />
                                        </label>
                                    </div>
                                {/if}
                                <div class="adjustment-input" class:full-width={event.name !== "Ultimate Singles"}>
                                    <label>
                                        DQ Count:
                                        <input 
                                            type="number" 
                                            bind:value={dqCounts[event.name]} 
                                            min="0"
                                            max={event.numEntrants}
                                            placeholder="0"
                                        />
                                    </label>
                                </div>
                            </div>
                            <div class="entrant-summary">
                                <p>Total Entrants: {event.numEntrants}</p>
                                <p>Adjusted Entrants: {adjustedEntrants}</p>
                            </div>
                            <p class="prize-pool">Total Prize Pool: <span>${prizePools[event.name]?.toFixed(2)}</span></p>
                        </div>
                    {/if}
                    <div class="standings">
                        <h4>Prize Winners</h4>
                        <ul>
                            {#key eventFees[event.name]}
                                {#each event.standings.nodes.slice(0, getPrizeWinningPlacements(adjustedEntrants)) as standing}
                                    {#each standing.entrant.participants as participant}
                                        <li>
                                            <div class="standing-entry">
                                                <div class="placement-info">
                                                    {standing.placement}. {participant.gamerTag}
                                                    {#if isSlambana || eventFees[event.name]}
                                                        - ${prizePlacings[event.name]?.find(p => p.placement === standing.placement)?.prize.toFixed(2)}
                                                    {/if}
                                                </div>
                                                {#if isSlambana || eventFees[event.name]}
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
        </div>
    {/if}
</div>

<style>
    :root {
        --color-primary: #0f172a;
        --color-secondary: #3b82f6;
        --color-accent: #22c55e;
        --color-background: #f8fafc;
        --color-surface: #ffffff;
        --color-error: #ef4444;
        --color-text: #1e293b;
        --spacing-unit: 1rem;
        
        /* Font variables */
        --font-primary: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        --font-mono: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace;
    }

    .tournament-display {
        font-family: var(--font-primary);
    }

    .event-header h3 {
        font-family: var(--font-primary);
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    .prize-pool, 
    .input-with-symbol input[type="number"],
    .standing-entry .placement-info {
        font-family: var(--font-mono);
    }

    h2, h3, h4 {
        font-family: var(--font-primary);
        font-weight: 700;
        letter-spacing: -0.03em;
    }

    input, textarea {
        font-family: var(--font-primary);
        font-size: 0.95rem;
    }

    input[type="number"] {
        font-family: var(--font-mono);
    }

    button {
        font-family: var(--font-primary);
        font-weight: 600;
        letter-spacing: 0.02em;
    }

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

    .slambana-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
    }

    .slambana-content {
        position: sticky;
        top: 1rem;
        align-self: start;
        grid-column: 1;
    }

    .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        padding: 0.5rem;
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        border-radius: 3px;
    }

    .pagination button {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .pagination button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .pagination button:not(:disabled):hover {
        background: var(--color-secondary);
    }

    .page-info {
        font-size: 0.9rem;
        color: var(--color-primary);
        font-weight: 500;
    }

    .tournament-data {
        grid-column: 2;
    }

    .event-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 1.5rem 0;
    }

    .event {
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        padding: calc(var(--spacing-unit) * 1.5);
        position: relative;
        margin-bottom: var(--spacing-unit);
        box-shadow: 8px 8px 0 var(--color-primary);
        transition: all 0.2s ease;
    }

    .event:hover {
        transform: translate(-4px, -4px);
        box-shadow: 12px 12px 0 var(--color-primary);
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
        margin-bottom: 1rem;
        width: 100%;
    }

    .input-with-symbol {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        overflow: hidden;
        transition: all 0.2s ease;
        width: 100%;
    }

    .input-with-symbol:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .dollar-symbol {
        padding: 0.5rem 0.75rem;
        background: #f8fafc;
        color: #64748b;
        border-right: 1px solid #e2e8f0;
        font-weight: 500;
    }

    .input-with-symbol input {
        border: none;
        padding: 0.5rem 0.75rem;
        width: 100%;
        margin: 0;
        font-size: 0.95rem;
    }

    .prize-pool {
        color: #64748b;
        font-size: 0.95rem;
        margin: 0.5rem 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .prize-pool span {
        color: #0f766e;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .slambana-adjustments {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1rem 0;
    }

    .adjustment-input {
        width: 90%;
    }

    .adjustment-input label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #64748b;
    }

    .adjustment-input input {
        height: 2.5rem;
        padding: 0 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 0.95rem;
        width: 100%;
    }

    .adjustment-input.full-width {
        grid-column: 1 / -1;
    }

    .entrant-summary {
        background: #f8fafc;
        padding: 0.75rem;
        border-radius: 4px;
        margin: 0.5rem 0;
    }

    .entrant-summary p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: #64748b;
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
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.875rem;
        font-size: 1rem;
        transition: all 0.2s ease;
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    .search-section input:focus {
        border-color: #2563eb;
        background: white;
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-section button {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        position: relative;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.9rem;
    }

    .search-section button:hover {
        background: var(--color-secondary);
        transform: translateY(-2px);
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

    .slambana-tournaments {
        max-width: none;
        margin: 0;
    }

    .tournament-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-top: 4.8rem;
    }

    .tournament-item {
        text-align: left;
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        padding: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        box-shadow: 4px 4px 0 var(--color-primary);
    }

    .tournament-item h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        color: var(--color-primary);
    }

    .tournament-details {
        font-size: 0.85rem;
        color: #666;
    }

    .date, .location {
        display: inline-flex;
        align-items: center;
    }

    .date::before {
        content: "📅";
        margin-right: 0.5rem;
    }

    .location::before {
        content: "📍";
        margin-right: 0.5rem;
    }

    @media (max-width: 768px) {
        .slambana-layout {
            grid-template-columns: 1fr;
        }

        .slambana-content,
        .tournament-data {
            grid-column: 1;
        }

        .slambana-tournaments {
            margin-bottom: 1.5rem;
        }

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