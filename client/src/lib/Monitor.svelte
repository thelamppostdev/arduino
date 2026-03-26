<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { connectWs } from '../api';

  let running = false;
  let connected = false;
  let cpu = 0;
  let memory = 0;
  let cpuLevel = 0;
  let memLevel = 0;
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
    let fill = '#1a1a2e';
    let stroke = '#333';
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
    <svg viewBox="0 0 200 200" width="180" height="180">
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
      <span class="dot" style="background: #FF0000"></span>
      CPU: {cpu}%
    </div>
    <div class="stat">
      <span class="dot" style="background: #0000FF"></span>
      Memory: {memory}%
    </div>
    <div class="stat">
      <span class="dot" style="background: #8000FF"></span>
      Overlap
    </div>
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
    gap: 16px;
  }

  .ring-preview {
    display: flex;
    justify-content: center;
  }

  .stats {
    display: flex;
    gap: 20px;
    font-size: 14px;
    color: #ccc;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }

  .controls {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .btn {
    flex: 1;
    padding: 14px;
    border: 2px solid #333;
    border-radius: 12px;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .btn:hover {
    background: #252545;
  }

  .start-btn {
    border-color: #8000FF;
  }

  .stop-btn {
    border-color: #FF4444;
  }
</style>
