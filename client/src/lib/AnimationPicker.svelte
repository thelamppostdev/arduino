<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selected: string = 'fire';

  const dispatch = createEventDispatcher<{ select: string }>();

  const animations = [
    { name: 'fire', icon: '🔥', label: 'Fire' },
    { name: 'pulse', icon: '💜', label: 'Pulse' },
    { name: 'progress', icon: '🔄', label: 'Progress' },
  ];

  function selectAnimation(name: string) {
    selected = name;
    dispatch('select', name);
  }
</script>

<div class="section">
  <h2>Animation</h2>
  <div class="buttons">
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
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .buttons {
    display: flex;
    gap: 12px;
  }

  .anim-btn {
    flex: 1;
    padding: 16px;
    border: 2px solid #333;
    border-radius: 12px;
    background: #1a1a2e;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: border-color 0.15s, background 0.15s;
  }

  .anim-btn:hover {
    background: #252545;
  }

  .anim-btn.active {
    border-color: #7F00FF;
    background: #252545;
  }

  .icon {
    font-size: 28px;
  }

  .label {
    font-size: 14px;
  }
</style>
