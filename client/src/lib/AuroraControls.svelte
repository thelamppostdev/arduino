<script lang="ts">
  import { onMount } from 'svelte';
  import { connectWs } from '../api';

  let minBright = 6;
  let maxBright = 20;
  let ws: WebSocket;
  let connected = false;

  onMount(() => {
    ws = connectWs(() => {});
    ws.addEventListener('open', () => { connected = true; });
    ws.addEventListener('close', () => { connected = false; });
  });

  function send() {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'aurora-bright', min: minBright, max: maxBright }));
    }
  }

  function onMinChange() {
    if (minBright > maxBright) maxBright = minBright;
    send();
  }

  function onMaxChange() {
    if (maxBright < minBright) minBright = maxBright;
    send();
  }
</script>

<div class="controls">
  <h2>Aurora Brightness</h2>
  <div class="slider-row">
    <label>Min <span class="val">{minBright}</span></label>
    <input type="range" min="1" max="30" bind:value={minBright} on:input={onMinChange} />
  </div>
  <div class="slider-row">
    <label>Max <span class="val">{maxBright}</span></label>
    <input type="range" min="1" max="30" bind:value={maxBright} on:input={onMaxChange} />
  </div>
</div>

<style>
  .controls h2 {
    margin: 0 0 10px 0;
    font-size: 11px;
    font-weight: 500;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  label {
    width: 60px;
    font-size: 12px;
    color: #888;
    display: flex;
    justify-content: space-between;
  }

  .val {
    color: #ccc;
    font-variant-numeric: tabular-nums;
  }

  input[type="range"] {
    flex: 1;
    accent-color: #8000FF;
    height: 4px;
  }
</style>
