<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selected: string = 'blue';

  const dispatch = createEventDispatcher<{ select: string }>();

  const colors = [
    { name: 'red', rgb: '#FF0000' },
    { name: 'orange', rgb: '#FF8000' },
    { name: 'yellow', rgb: '#FFFF00' },
    { name: 'lime', rgb: '#80FF00' },
    { name: 'green', rgb: '#00FF00' },
    { name: 'teal', rgb: '#008080' },
    { name: 'marine', rgb: '#00FFFF' },
    { name: 'blue', rgb: '#0000FF' },
    { name: 'purple', rgb: '#7F00FF' },
    { name: 'magenta', rgb: '#FF00FF' },
    { name: 'pink', rgb: '#FF007F' },
    { name: 'white', rgb: '#FFFFFF' },
  ];

  function selectColor(name: string) {
    selected = name;
    dispatch('select', name);
  }
</script>

<div class="section">
  <h2>Color</h2>
  <div class="grid">
    {#each colors as color}
      <button
        class="swatch"
        class:active={selected === color.name}
        style="--color: {color.rgb}"
        on:click={() => selectColor(color.name)}
        title={color.name}
      ></button>
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
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: var(--color);
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
  }

  .swatch:hover {
    transform: scale(1.15);
  }

  .swatch.active {
    border-color: #fff;
    box-shadow: 0 0 10px var(--color), 0 0 4px rgba(255, 255, 255, 0.3);
  }
</style>
