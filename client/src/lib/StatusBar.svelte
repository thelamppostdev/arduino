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

<div class="status">
  <span class="dot" class:connected class:reconnecting></span>
  <span class="label">
    {#if connected}
      Connected
    {:else if reconnecting}
      Reconnecting
    {:else}
      Offline
    {/if}
  </span>
</div>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4444;
    flex-shrink: 0;
  }

  .dot.connected {
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.4);
  }

  .dot.reconnecting {
    background: #fbbf24;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    50% { opacity: 0.3; }
  }

  .label {
    font-size: 12px;
    color: #666;
  }
</style>
