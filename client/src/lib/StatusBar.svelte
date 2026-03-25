<script lang="ts">
  import { onMount } from 'svelte';
  import { connectWs } from '../api';

  let connected = false;
  let reconnecting = false;

  onMount(() => {
    connectWs((msg) => {
      if (msg.type === 'status') {
        connected = msg.data.connected;
        reconnecting = msg.data.isReconnecting;
      }
    });
  });
</script>

<div class="status-bar">
  <span class="dot" class:connected class:reconnecting></span>
  <span class="label">
    {#if connected}
      Arduino Connected
    {:else if reconnecting}
      Reconnecting...
    {:else}
      Arduino Disconnected
    {/if}
  </span>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #1a1a2e;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff4444;
  }

  .dot.connected {
    background: #44ff44;
  }

  .dot.reconnecting {
    background: #ffaa00;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    50% { opacity: 0.3; }
  }

  .label {
    font-size: 14px;
    color: #ccc;
  }
</style>
