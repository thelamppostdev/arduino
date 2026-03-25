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
        style="background-color: {color.rgb}"
        on:click={() => selectColor(color.name)}
        title={color.name}
      >
        <span class="name">{color.name}</span>
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

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .swatch {
    aspect-ratio: 1;
    border: 3px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 6px;
    transition: transform 0.15s, border-color 0.15s;
    min-height: 70px;
  }

  .swatch:hover {
    transform: scale(1.08);
  }

  .swatch.active {
    border-color: #fff;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
  }

  .name {
    font-size: 11px;
    color: #000;
    background: rgba(255, 255, 255, 0.7);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: capitalize;
  }
</style>
