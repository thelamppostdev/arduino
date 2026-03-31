<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { connectWs } from '../api';

  let running = false;
  let connected = false;
  let cpu = 0;
  let memory = 0;
  let cpuLevel = 0;
  let memLevel = 0;
  let pulseSpeed = 60;
  let ws: WebSocket;

  onMount(() => {
    ws = connectWs(handleMessage);
    ws.addEventListener('open', () => { connected = true; });
    ws.addEventListener('close', () => { connected = false; });
  });

  function handleMessage(msg: any) {
    if (msg.type === 'monitor-stats') {
      cpu = msg.cpu;
      memory = msg.memory;
      cpuLevel = msg.cpuLevel;
      memLevel = msg.memLevel;
    }
  }

  function send(data: any) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function start() {
    send({ type: 'monitor', action: 'start' });
    running = true;
  }

  function stop() {
    send({ type: 'monitor', action: 'stop' });
    running = false;
    cpuLevel = 0;
    memLevel = 0;
  }

  onDestroy(() => {
    if (running) {
      try { send({ type: 'monitor', action: 'stop' }); } catch {}
    }
  });

  $: leds = Array.from({ length: 12 }, (_, i) => {
    const isCpu = i < cpuLevel;
    const isMem = i < memLevel;
    let fill = '#12122a';
    let stroke = '#1e1e3a';
    let opacity = 0.3;
    if (isCpu && isMem) {
      fill = '#8000FF';
      stroke = '#8000FF';
      opacity = 1;
    } else if (isCpu) {
      fill = '#FF0000';
      stroke = '#FF0000';
      opacity = 1;
    } else if (isMem) {
      fill = '#0000FF';
      stroke = '#0000FF';
      opacity = 1;
    }
    return { fill, stroke, opacity };
  });
</script>

<div class="monitor">
  <div class="ring-preview">
    <svg viewBox="0 0 200 200" width="140" height="140">
      {#each leds as led, i}
        {@const angle = (i * 30 - 90) * (Math.PI / 180)}
        {@const cx = 100 + 75 * Math.cos(angle)}
        {@const cy = 100 + 75 * Math.sin(angle)}
        <circle
          cx={cx}
          cy={cy}
          r="12"
          fill={led.fill}
          stroke={led.stroke}
          stroke-width="1.5"
          opacity={led.opacity}
        />
      {/each}
    </svg>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="dot" style="background: #FF4444"></span>
      CPU {cpu}%
    </div>
    <div class="stat">
      <span class="dot" style="background: #4444FF"></span>
      Mem {memory}%
    </div>
    <div class="stat">
      <span class="dot" style="background: #8000FF"></span>
      Both
    </div>
  </div>

  <div class="slider-row">
    <label>Pulse <span class="val">{pulseSpeed}</span></label>
    <input type="range" min="10" max="200" bind:value={pulseSpeed}
      on:input={() => send({ type: 'monitor-pulse', speed: pulseSpeed })} />
  </div>

  <div class="controls">
    {#if running}
      <button class="btn stop-btn" on:click={stop}>Stop</button>
    {:else}
      <button class="btn start-btn" on:click={start} disabled={!connected}>
        {connected ? 'Start Monitor' : 'Connecting...'}
      </button>
    {/if}
  </div>
</div>

<style>
  .monitor {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .ring-preview {
    display: flex;
    justify-content: center;
  }

  .stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #888;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .controls {
    width: 100%;
  }

  .btn {
    width: 100%;
    padding: 10px;
    border: 1px solid #1e1e3a;
    border-radius: 8px;
    background: #0a0a14;
    color: #ccc;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }

  .btn:hover {
    background: #161630;
  }

  .start-btn {
    border-color: #8000FF;
    color: #a855f7;
  }

  .stop-btn {
    border-color: #FF4444;
    color: #FF6666;
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .slider-row label {
    width: 70px;
    font-size: 12px;
    color: #888;
    display: flex;
    justify-content: space-between;
  }

  .val {
    color: #ccc;
    font-variant-numeric: tabular-nums;
  }

  .slider-row input[type="range"] {
    flex: 1;
    accent-color: #8000FF;
    height: 4px;
  }
</style>
