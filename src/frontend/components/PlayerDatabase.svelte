<script>
    import { onMount } from 'svelte';
    import { notifyDatabaseUpdate } from '../stores/playerStore';
    
    let players = [];
    let searchQuery = '';
    let fileInput;
    let importError = '';
    let successMessage = '';
    let loading = false;
    let aliasInput = '';
    let editingPlayer = null;
    let isEditing = false;
    
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
            console.log('Attempting to clear database...');
            const response = await fetch('/api/players/all', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to clear database');
            }
            
            const result = await response.json();
            console.log('Clear database response:', result);
            
            await loadPlayers();
            notifyDatabaseUpdate();
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
            const existingPlayer = players.find(p => 
                p.tag.toLowerCase() === newPlayer.tag.toLowerCase()
            );

            if (existingPlayer) {
                const response = await fetch(`/api/players/${encodeURIComponent(existingPlayer.tag)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...existingPlayer,
                        paymentMethods: newPlayer.paymentMethods,
                        aliases: newPlayer.aliases,
                        notes: newPlayer.notes
                    })
                });
                if (!response.ok) throw new Error('Failed to update player');
                successMessage = 'Player updated successfully';
            } else {
                const response = await fetch('/api/players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPlayer)
                });
                if (!response.ok) throw new Error('Failed to add player');
                successMessage = 'Player added successfully';
            }
            
            await loadPlayers();
            notifyDatabaseUpdate();
            clearForm();
            setTimeout(() => successMessage = '', 3000);
        } catch (error) {
            console.error('Failed to save player:', error);
            importError = error.message;
            setTimeout(() => importError = '', 3000);
        }
    }

    function clearForm() {
        newPlayer = {
            tag: '',
            aliases: [],
            paymentMethods: { venmo: '', paypal: '', zelle: '' },
            notes: ''
        };
        aliasInput = '';
        isEditing = false;
        editingPlayer = null;
    }

    function startEditing(player) {
        isEditing = true;
        editingPlayer = player;
        newPlayer = {
            tag: player.tag,
            aliases: [...player.aliases],
            paymentMethods: {
                venmo: player.paymentMethods.venmo || '',
                paypal: player.paymentMethods.paypal || '',
                zelle: player.paymentMethods.zelle || ''
            },
            notes: player.notes || ''
        };
    }

    async function deletePlayer(tag) {
        if (!confirm(`Are you sure you want to delete ${tag}?`)) return;
        try {
            const response = await fetch(`/api/players/${encodeURIComponent(tag)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete player');
            await loadPlayers();
            notifyDatabaseUpdate();
        } catch (error) {
            console.error('Failed to delete player:', error);
        }
    }

    async function downloadJson() {
        try {
            const response = await fetch('/api/players');
            const data = await response.json();
            
            // Create blob and download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'players.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download JSON:', error);
            importError = 'Failed to download JSON';
            setTimeout(() => importError = '', 3000);
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
                accept=".xlsx,.csv,.json"
                on:change={handleFileUpload}
                bind:this={fileInput}
                style="display: none"
            />
            <button on:click={() => fileInput.click()}>
                Import
            </button>
            <button on:click={downloadJson}>
                Export
            </button>
            <button class="danger" on:click={clearDatabase}>
                Clear Database
            </button>
        </div>
    </div>

    <div class="add-player">
        <h3>{isEditing ? 'Edit Player' : 'Add New Player'}</h3>
        <input 
            type="text" 
            bind:value={newPlayer.tag} 
            placeholder="Player Tag"
        />
        <div class="aliases-input">
            <div class="alias-list">
                {#each newPlayer.aliases as alias, i}
                    <span class="alias-tag">
                        {alias}
                        <button 
                            class="remove-alias" 
                            on:click={() => {
                                newPlayer.aliases = newPlayer.aliases.filter((_, index) => index !== i);
                            }}
                        >×</button>
                    </span>
                {/each}
            </div>
            <div class="alias-add">
                <input 
                    type="text" 
                    bind:value={aliasInput} 
                    placeholder="Add alias"
                    on:keydown={(e) => {
                        if (e.key === 'Enter' && aliasInput.trim()) {
                            newPlayer.aliases = [...newPlayer.aliases, aliasInput.trim()];
                            aliasInput = '';
                        }
                    }}
                />
                <button 
                    on:click={() => {
                        if (aliasInput.trim()) {
                            newPlayer.aliases = [...newPlayer.aliases, aliasInput.trim()];
                            aliasInput = '';
                        }
                    }}
                >Add Alias</button>
            </div>
        </div>
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
        <div class="form-buttons">
            <button on:click={addPlayer}>
                {isEditing ? 'Save Changes' : 'Add Player'}
            </button>
            {#if isEditing}
                <button class="cancel-button" on:click={clearForm}>
                    Cancel
                </button>
            {/if}
        </div>
    </div>

    <div class="player-list">
        <h3>Players ({filteredPlayers.length})</h3>
        {#each filteredPlayers as player}
            <div class="player-card">
                <div class="player-header">
                    <h4>{player.tag}</h4>
                    <div class="player-actions">
                        <button 
                            class="edit-button" 
                            on:click={() => startEditing(player)}
                        >
                            Edit
                        </button>
                        <button 
                            class="delete-button" 
                            on:click={() => deletePlayer(player.tag)}
                        >
                            ×
                        </button>
                    </div>
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

        /* Layout variables */
        --button-height: 2.75rem;
        --button-padding: 0 1rem;
        --gap-standard: 0.75rem;
    }

    .player-database {
        font-family: var(--font-primary);
    }

    .player-card h4 {
        font-family: var(--font-primary);
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    .payment-info,
    .player-card .aliases {
        font-family: var(--font-mono);
        font-size: 0.9rem;
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

    .player-database {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--gap-standard);
        margin-bottom: var(--spacing-unit);
    }

    .search {
        flex: 1;
    }

    .search input {
        width: 100%;
        height: var(--button-height);
        padding: 0 1.5rem;
        margin: 0;
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        font-size: 0.95rem;
    }

    .import {
        display: flex;
        gap: var(--gap-standard);
        align-items: center;
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
        gap: var(--gap-standard);
        margin: 0.5rem 0;
    }

    .player-card {
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        padding: calc(var(--spacing-unit) * 1.5);
        position: relative;
        margin-bottom: var(--spacing-unit);
        box-shadow: 8px 8px 0 var(--color-primary);
        transition: all 0.2s ease;
    }

    .player-card:hover {
        transform: translate(-4px, -4px);
        box-shadow: 12px 12px 0 var(--color-primary);
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

    input:not([type="file"]), 
    textarea {
        height: var(--button-height);
        padding: 0 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        font-size: 0.95rem;
        margin: 0.25rem 0;
        width: 100%;
        box-sizing: border-box;
    }

    textarea {
        height: auto;
        padding: 1rem 1.5rem;
    }

    button {
        background: var(--color-primary);
        color: white;
        height: var(--button-height);
        padding: var(--button-padding);
        border: 2px solid var(--color-primary);
        border-radius: 3px;
        position: relative;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.95rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    button:hover {
        background: var(--color-secondary);
        transform: translateY(-2px);
    }

    .player-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .edit-button {
        background-color: #ffc107;
        color: #000;
        padding: 0.25rem 0.5rem;
        font-size: 0.9rem;
    }

    .edit-button:hover {
        background-color: #e0a800;
    }

    .cancel-button {
        background-color: #6c757d;
        margin-left: 0.5rem;
    }

    .cancel-button:hover {
        background-color: #5a6268;
    }

    .form-buttons {
        display: flex;
        gap: var(--gap-standard);
        margin-top: 0.5rem;
    }

    .danger {
        background-color: #dc3545;
    }
    
    .danger:hover {
        background-color: #c82333;
    }

    .aliases-input {
        margin: 0.5rem 0;
    }

    .alias-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .alias-tag {
        background-color: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .remove-alias {
        background: none;
        border: none;
        color: #dc3545;
        padding: 0 0.25rem;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
    }

    .remove-alias:hover {
        color: #c82333;
    }

    .alias-add {
        display: flex;
        gap: var(--gap-standard);
        align-items: center;
    }

    .alias-add input {
        flex: 1;
        margin: 0;
    }

    .alias-add button {
        white-space: nowrap;
        margin: 0;
    }

    .alias-add button {
        white-space: nowrap;
    }
</style>
