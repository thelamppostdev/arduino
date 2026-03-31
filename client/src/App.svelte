<script lang="ts">
  import StatusBar from './lib/StatusBar.svelte';
  import ColorPicker from './lib/ColorPicker.svelte';
  import AnimationPicker from './lib/AnimationPicker.svelte';
  import Monitor from './lib/Monitor.svelte';
  import AuroraControls from './lib/AuroraControls.svelte';
  import ReactorControls from './lib/ReactorControls.svelte';
  import PRChecks from './lib/PRChecks.svelte';
  import { sendRingCommand } from './api';

  let selectedColor = 'blue';
  let selectedAnimation = 'fire';

  async function onColorSelect(event: CustomEvent<string>) {
    selectedColor = event.detail;
    await sendRingCommand(selectedColor, selectedAnimation);
  }

  async function onAnimationSelect(event: CustomEvent<string>) {
    selectedAnimation = event.detail;
    await sendRingCommand(selectedColor, selectedAnimation);
  }
</script>

<main>
  <header>
    <div class="title">
      <svg class="title-icon" viewBox="0 0 48 48" width="22" height="22">
        <rect x="4" y="4" width="40" height="40" rx="4" fill="#1a5c2a"/>
        <path d="M12 12h8v4h8v-4h8" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 24h6l4-4h4l4 4h6" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 36h8v-4h8v4h8" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 12v24" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 3"/>
        <path d="M32 12v24" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 3"/>
        <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
        <circle cx="36" cy="12" r="2.5" fill="#fbbf24"/>
        <circle cx="12" cy="24" r="2.5" fill="#fbbf24"/>
        <circle cx="36" cy="24" r="2.5" fill="#fbbf24"/>
        <circle cx="12" cy="36" r="2.5" fill="#fbbf24"/>
        <circle cx="36" cy="36" r="2.5" fill="#fbbf24"/>
        <rect x="20" y="20" width="8" height="8" rx="1" fill="#333"/>
        <circle cx="22" cy="22" r="0.8" fill="#666"/>
      </svg>
      <h1>The Lamppost</h1>
    </div>
    <StatusBar />
  </header>

  <section class="panel">
    <ColorPicker selected={selectedColor} on:select={onColorSelect} />
  </section>

  <section class="panel">
    <AnimationPicker selected={selectedAnimation} on:select={onAnimationSelect} />
  </section>

  {#if selectedAnimation === 'reactor'}
    <section class="panel">
      <ReactorControls />
    </section>
  {/if}
  {#if selectedAnimation === 'aurora'}
    <section class="panel">
      <AuroraControls />
    </section>
  {/if}
  {#if selectedAnimation === 'checks'}
    <section class="panel">
      <PRChecks />
    </section>
  {/if}
  {#if selectedAnimation === 'monitor'}
    <section class="panel">
      <Monitor />
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 420px;
    margin: 0 auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin-bottom: 4px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    flex-shrink: 0;
  }

  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.3px;
  }

  .panel {
    background: #12122a;
    border: 1px solid #1e1e3a;
    border-radius: 14px;
    padding: 14px;
  }
</style>
