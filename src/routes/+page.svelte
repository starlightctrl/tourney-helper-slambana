<script>
    import TournamentDisplay from '../frontend/components/TournamentDisplay.svelte';
    import PlayerDatabase from '../frontend/components/PlayerDatabase.svelte';
</script>

<main>
    <h1>Tournament Helper</h1>
    
    <section>
        <TournamentDisplay />
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
</style>
