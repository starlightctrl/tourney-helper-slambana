<script>
    import { onMount } from 'svelte';
    
    let players = [];
    let searchQuery = '';
    let fileInput;
    let importError = '';
    let successMessage = '';
    let loading = false;
    
    let newPlayer = {
        tag: '',
        aliases: [],
        paymentMethods: {
            venmo: '',
            paypal: '',
            zelle: ''
        },
        notes: ''
    };

    onMount(async () => {
        await loadPlayers();
    });

    async function loadPlayers() {
        try {
            loading = true;
            const response = await fetch('/api/players');
            if (!response.ok) throw new Error('Failed to load players');
            players = await response.json();
        } catch (error) {
            console.error('Failed to load players:', error);
        } finally {
            loading = false;
        }
    }

    async function clearDatabase() {
        if (!confirm('Are you sure you want to clear the entire database? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/players/all', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to clear database');
            }
            
            await loadPlayers();
            successMessage = 'Database cleared successfully';
            setTimeout(() => successMessage = '', 3000);
        } catch (error) {
            console.error('Failed to clear database:', error);
            importError = error.message || 'Failed to clear database';
            setTimeout(() => importError = '', 3000);
        }
    }

    async function addPlayer() {
        if (!newPlayer.tag) return;
        try {
            const response = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPlayer)
            });
            if (!response.ok) throw new Error('Failed to add player');
            
            await loadPlayers();
            newPlayer = {
                tag: '',
                aliases: [],
                paymentMethods: { venmo: '', paypal: '', zelle: '' },
                notes: ''
            };
            successMessage = 'Player added successfully';
            setTimeout(() => successMessage = '', 3000);
        } catch (error) {
            console.error('Failed to add player:', error);
        }
    }

    async function deletePlayer(tag) {
        if (!confirm(`Are you sure you want to delete ${tag}?`)) return;
        try {
            const response = await fetch(`/api/players/${encodeURIComponent(tag)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete player');
            await loadPlayers();
        } catch (error) {
            console.error('Failed to delete player:', error);
        }
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            importError = '';
            loading = true;
            const response = await fetch('/api/players/import', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const result = await response.json();
            await loadPlayers();
            successMessage = `Import successful: ${result.newPlayers} new players added, ${result.updatedPlayers} players updated`;
            setTimeout(() => successMessage = '', 3000);
            event.target.value = ''; // Reset file input
        } catch (error) {
            importError = `Import failed: ${error.message}`;
        } finally {
            loading = false;
        }
    }

    $: filteredPlayers = searchQuery 
        ? players.filter(player => 
            player.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.aliases.some(alias => 
                alias.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : players;
</script>

<div class="player-database">
    <h2>Player Database</h2>
    
    {#if loading}
        <div class="loading">Loading...</div>
    {/if}

    {#if successMessage}
        <div class="success-message">{successMessage}</div>
    {/if}

    {#if importError}
        <div class="error-message">{importError}</div>
    {/if}

    <div class="controls">
        <div class="search">
            <input 
                type="text" 
                bind:value={searchQuery} 
                placeholder="Search players..."
            />
        </div>

        <div class="import">
            <input 
                type="file" 
                accept=".xlsx,.csv"
                on:change={handleFileUpload}
                bind:this={fileInput}
                style="display: none"
            />
            <button on:click={() => fileInput.click()}>
                Import Players
            </button>
            <button class="danger" on:click={clearDatabase}>
                Clear Database
            </button>
        </div>
    </div>

    <div class="add-player">
        <h3>Add New Player</h3>
        <input 
            type="text" 
            bind:value={newPlayer.tag} 
            placeholder="Player Tag"
        />
        <div class="payment-methods">
            <input 
                type="text" 
                bind:value={newPlayer.paymentMethods.venmo} 
                placeholder="Venmo"
            />
            <input 
                type="text" 
                bind:value={newPlayer.paymentMethods.paypal} 
                placeholder="PayPal"
            />
            <input 
                type="text" 
                bind:value={newPlayer.paymentMethods.zelle} 
                placeholder="Zelle"
            />
        </div>
        <textarea
            bind:value={newPlayer.notes}
            placeholder="Notes"
            rows="3"
        ></textarea>
        <button on:click={addPlayer}>Add Player</button>
    </div>

    <div class="player-list">
        <h3>Players ({filteredPlayers.length})</h3>
        {#each filteredPlayers as player}
            <div class="player-card">
                <div class="player-header">
                    <h4>{player.tag}</h4>
                    <button 
                        class="delete-button" 
                        on:click={() => deletePlayer(player.tag)}
                    >
                        ×
                    </button>
                </div>
                {#if player.aliases?.length}
                    <div class="aliases">
                        Also known as: {player.aliases.join(', ')}
                    </div>
                {/if}
                <div class="payment-info">
                    {#if player.paymentMethods.venmo}
                        <p>Venmo: {player.paymentMethods.venmo}</p>
                    {/if}
                    {#if player.paymentMethods.paypal}
                        <p>PayPal: {player.paymentMethods.paypal}</p>
                    {/if}
                    {#if player.paymentMethods.zelle}
                        <p>Zelle: {player.paymentMethods.zelle}</p>
                    {/if}
                </div>
                {#if player.notes}
                    <div class="notes">
                        <p>{player.notes}</p>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .player-database {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .search {
        flex: 1;
        margin-right: 1rem;
    }

    .search input {
        width: 100%;
    }

    .loading {
        text-align: center;
        padding: 1rem;
        color: #666;
    }

    .success-message {
        background-color: #dff0d8;
        color: #3c763d;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }

    .error-message {
        background-color: #f2dede;
        color: #a94442;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }

    .add-player {
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
        background-color: #fff;
    }

    .payment-methods {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 1rem 0;
    }

    .player-card {
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
        background-color: #fff;
    }

    .player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .delete-button {
        background: none;
        border: none;
        color: #dc3545;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 0.5rem;
    }

    .delete-button:hover {
        color: #c82333;
    }

    .aliases {
        font-size: 0.9rem;
        color: #666;
        margin: 0.5rem 0;
    }

    .notes {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #eee;
    }

    input, textarea {
        margin: 0.5rem 0;
        padding: 0.5rem;
        width: 100%;
        box-sizing: border-box;
    }

    button {
        padding: 0.5rem 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background-color: #45a049;
    }

    .danger {
        background-color: #dc3545;
        margin-left: 1rem;
    }
    
    .danger:hover {
        background-color: #c82333;
    }
</style>
