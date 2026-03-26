<script lang="ts">
  import { onMount } from 'svelte';
  import { connectWs } from '../api';

  let maxBright = 18;
  let minBright = 8;
  let spinRate = 1;
  let initSpinRate = 6;
  let ws: WebSocket;
  let connected = false;

  onMount(() => {
    ws = connectWs(() => {});
    ws.addEventListener('open', () => { connected = true; });
    ws.addEventListener('close', () => { connected = false; });
  });

  function send() {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reactor-config', maxBright, minBright, spinRate, initSpinRate }));
    }
  }

  function restart() {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reactor-restart' }));
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

  // Invert display so 1=fast, 10=slow shows as 1=slow, 10=fast
  $: spinDisplay = 11 - spinRate;
</script>

<div class="reactor-controls">
  <h2>Reactor Controls</h2>
  <button class="btn restart-btn" on:click={restart} disabled={!connected}>
    Restart Sequence
  </button>
  <div class="slider-row">
    <label>Min: {minBright}</label>
    <input type="range" min="1" max="30" bind:value={minBright} on:input={onMinChange} />
  </div>
  <div class="slider-row">
    <label>Max: {maxBright}</label>
    <input type="range" min="5" max="30" bind:value={maxBright} on:input={onMaxChange} />
  </div>
  <div class="slider-row">
    <label>Spin: {spinDisplay}</label>
    <input type="range" min="1" max="10" bind:value={spinRate} on:input={send}
      style="direction: rtl;" />
  </div>
  <div class="slider-row">
    <label>Start: {11 - initSpinRate}</label>
    <input type="range" min="2" max="10" bind:value={initSpinRate} on:input={send}
      style="direction: rtl;" />
  </div>
</div>

<style>
  .reactor-controls h2 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .restart-btn {
    width: 100%;
    padding: 14px;
    border: 2px solid #00FFFF;
    border-radius: 12px;
    background: #1a1a2e;
    color: #00FFFF;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 16px;
    transition: background 0.15s;
  }

  .restart-btn:hover {
    background: #252545;
  }

  .restart-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
    accent-color: #00FFFF;
  }
</style>
