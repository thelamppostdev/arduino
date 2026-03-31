<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selected: string = 'fire';

  const dispatch = createEventDispatcher<{ select: string }>();

  const animations = [
    { name: 'fire', icon: '🔥', label: 'Fire' },
    { name: 'bluefire', icon: '🧊', label: 'Blue Fire' },
    { name: 'reactor', icon: '⚡', label: 'Reactor' },
    { name: 'aurora', icon: '🌌', label: 'Aurora' },
    { name: 'fireworks', icon: '🎆', label: 'Fireworks' },
    { name: 'comet', icon: '☄️', label: 'Comet' },
    { name: 'checks', icon: '✅', label: 'PR Checks' },
    { name: 'pulse', icon: '💜', label: 'Pulse' },
    { name: 'progress', icon: '🔄', label: 'Progress' },
    { name: 'monitor', icon: '📊', label: 'Monitor' },
  ];

  function selectAnimation(name: string) {
    selected = name;
    dispatch('select', name);
  }
</script>

<div class="section">
  <h2>Animation</h2>
  <div class="grid">
    {#each animations as anim}
      <button
        class="anim-btn"
        class:active={selected === anim.name}
        on:click={() => selectAnimation(anim.name)}
      >
        <span class="icon">{anim.icon}</span>
        <span class="label">{anim.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .section h2 {
    margin: 0 0 10px 0;
    font-size: 11px;
    font-weight: 500;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .anim-btn {
    padding: 10px 6px;
    border: 1px solid #1e1e3a;
    border-radius: 10px;
    background: #0a0a14;
    color: #ccc;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }

  .anim-btn:hover {
    background: #161630;
    border-color: #2a2a50;
  }

  .anim-btn.active {
    border-color: #7F00FF;
    background: #1a1040;
    color: #fff;
  }

  .icon {
    font-size: 22px;
    line-height: 1;
  }

  .label {
    font-size: 11px;
    font-weight: 500;
  }
</style>
