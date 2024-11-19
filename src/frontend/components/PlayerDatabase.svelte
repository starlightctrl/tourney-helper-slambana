<script>
    let players = [];
    let newPlayer = {
        tag: '',
        aliases: [],
        paymentMethods: {
            venmo: '',
            paypal: '',
            zelle: ''
        }
    };

    function addPlayer() {
        if (!newPlayer.tag) return;
        players = [...players, { ...newPlayer }];
        newPlayer.tag = '';
        newPlayer.aliases = [];
        newPlayer.paymentMethods = { venmo: '', paypal: '', zelle: '' };
    }
</script>

<div class="player-database">
    <h2>Player Database</h2>
    
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
        <button on:click={addPlayer}>Add Player</button>
    </div>

    <div class="player-list">
        <h3>Players</h3>
        {#each players as player}
            <div class="player-card">
                <h4>{player.tag}</h4>
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

    .add-player {
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
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
    }

    input {
        margin: 0.5rem 0;
        padding: 0.5rem;
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
</style>
