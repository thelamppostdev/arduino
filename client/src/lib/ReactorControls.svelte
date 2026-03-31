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

<div class="controls">
  <h2>Reactor</h2>
  <button class="restart-btn" on:click={restart} disabled={!connected}>
    Restart Sequence
  </button>
  <div class="slider-row">
    <label>Min <span class="val">{minBright}</span></label>
    <input type="range" min="1" max="30" bind:value={minBright} on:input={onMinChange} />
  </div>
  <div class="slider-row">
    <label>Max <span class="val">{maxBright}</span></label>
    <input type="range" min="5" max="30" bind:value={maxBright} on:input={onMaxChange} />
  </div>
  <div class="slider-row">
    <label>Spin <span class="val">{spinDisplay}</span></label>
    <input type="range" min="1" max="10" bind:value={spinRate} on:input={send}
      style="direction: rtl;" />
  </div>
  <div class="slider-row">
    <label>Start <span class="val">{11 - initSpinRate}</span></label>
    <input type="range" min="2" max="10" bind:value={initSpinRate} on:input={send}
      style="direction: rtl;" />
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

  .restart-btn {
    width: 100%;
    padding: 10px;
    border: 1px solid #00CCCC;
    border-radius: 8px;
    background: #0a0a14;
    color: #00DDDD;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 12px;
    transition: background 0.12s;
  }

  .restart-btn:hover {
    background: #161630;
  }

  .restart-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
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
    accent-color: #00CCCC;
    height: 4px;
  }
</style>
