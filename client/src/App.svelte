<script lang="ts">
  import StatusBar from './lib/StatusBar.svelte';
  import ColorPicker from './lib/ColorPicker.svelte';
  import AnimationPicker from './lib/AnimationPicker.svelte';
  import Monitor from './lib/Monitor.svelte';
  import AuroraControls from './lib/AuroraControls.svelte';
  import ReactorControls from './lib/ReactorControls.svelte';
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
  <h1>The Lamppost</h1>
  <StatusBar />
  <ColorPicker selected={selectedColor} on:select={onColorSelect} />
  <div class="spacer"></div>
  <AnimationPicker selected={selectedAnimation} on:select={onAnimationSelect} />
  {#if selectedAnimation === 'reactor'}
    <div class="spacer"></div>
    <ReactorControls />
  {/if}
  {#if selectedAnimation === 'aurora'}
    <div class="spacer"></div>
    <AuroraControls />
  {/if}
  {#if selectedAnimation === 'monitor'}
    <div class="spacer"></div>
    <Monitor />
  {/if}
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: 32px 16px;
  }

  h1 {
    text-align: center;
    margin: 0 0 24px 0;
    font-size: 28px;
    color: #fff;
  }

  .spacer {
    height: 24px;
  }
</style>
