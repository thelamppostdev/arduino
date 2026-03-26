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

<div class="aurora-controls">
  <h2>Aurora Brightness</h2>
  <div class="slider-row">
    <label>Min: {minBright}</label>
    <input type="range" min="1" max="30" bind:value={minBright} on:input={onMinChange} />
  </div>
  <div class="slider-row">
    <label>Max: {maxBright}</label>
    <input type="range" min="1" max="30" bind:value={maxBright} on:input={onMaxChange} />
  </div>
</div>

<style>
  .aurora-controls h2 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  label {
    width: 70px;
    font-size: 14px;
    color: #ccc;
  }

  input[type="range"] {
    flex: 1;
    accent-color: #8000FF;
  }
</style>
