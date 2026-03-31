<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { connectWs } from '../api';

  let ws: WebSocket;
  let connected = false;

  let owner = '';
  let ownerConfirmed = false;
  let repos: { nameWithOwner: string }[] = [];
  let allRepos: { nameWithOwner: string }[] = [];
  let repoFilter = '';
  let selectedRepo = '';
  let showRepoDropdown = false;
  let prs: { number: number; title: string; headRefName: string }[] = [];
  let selectedPR: number | null = null;
  let watching = false;
  let checks: { name: string; status: string; conclusion: string; statusChar: string }[] = [];
  let pollInterval = 15;
  let repoLoading = false;
  let prLoading = false;

  onMount(() => {
    ws = connectWs(handleMessage);
    ws.addEventListener('open', () => { connected = true; });
    ws.addEventListener('close', () => { connected = false; });
  });

  function handleMessage(msg: any) {
    if (msg.type === 'pr-repos') {
      allRepos = msg.repos || [];
      repos = allRepos;
      repoLoading = false;
    } else if (msg.type === 'pr-list') {
      prs = msg.prs || [];
      prLoading = false;
    } else if (msg.type === 'pr-checks') {
      checks = msg.checks || [];
    }
  }

  function send(data: any) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function confirmOwner() {
    if (!owner.trim()) return;
    ownerConfirmed = true;
    repoLoading = true;
    selectedRepo = '';
    selectedPR = null;
    repoFilter = '';
    send({ type: 'pr-repos', query: owner.trim() });
  }

  function changeOwner() {
    ownerConfirmed = false;
    allRepos = [];
    repos = [];
    selectedRepo = '';
    selectedPR = null;
    checks = [];
    repoFilter = '';
  }

  function filterRepos() {
    if (!repoFilter) {
      repos = allRepos;
    } else {
      const q = repoFilter.toLowerCase();
      repos = allRepos.filter(r => r.nameWithOwner.toLowerCase().includes(q));
    }
    showRepoDropdown = true;
  }

  function selectRepo(repo: string) {
    selectedRepo = repo;
    repoFilter = repo.split('/')[1] || repo;
    showRepoDropdown = false;
    selectedPR = null;
    checks = [];
    prLoading = true;
    send({ type: 'pr-list', repo });
  }

  function watch() {
    if (!selectedRepo || !selectedPR) return;
    send({ type: 'pr-watch', repo: selectedRepo, pr: selectedPR, interval: pollInterval });
    watching = true;
  }

  function stop() {
    send({ type: 'pr-stop' });
    watching = false;
    checks = [];
  }

  onDestroy(() => {
    if (watching) {
      try { send({ type: 'pr-stop' }); } catch {}
    }
  });

  function statusIcon(ch: string): string {
    switch (ch) {
      case 'S': return '\u2705';
      case 'F': return '\u274c';
      case 'P': return '\u23f3';
      case 'Q': return '\u23f8\ufe0f';
      case 'K': return '\u23ed\ufe0f';
      default: return '\u2753';
    }
  }

  function statusColor(ch: string): string {
    switch (ch) {
      case 'S': return '#4ade80';
      case 'F': return '#f87171';
      case 'P': return '#fbbf24';
      case 'Q': return '#666';
      case 'K': return '#f97316';
      default: return '#888';
    }
  }

  $: allPassed = checks.length > 0 && checks.every(c => c.statusChar === 'S' || c.statusChar === 'K');
  $: anyFailed = checks.some(c => c.statusChar === 'F');
</script>

<div class="pr-checks">
  <h2>PR Checks</h2>

  {#if !watching}
    <div class="field">
      {#if !ownerConfirmed}
        <div class="input-row">
          <input
            type="text"
            class="input"
            placeholder="Org or owner (e.g. dexcom-inc)"
            bind:value={owner}
            on:keydown={(e) => e.key === 'Enter' && confirmOwner()}
          />
          <button class="inline-btn" on:click={confirmOwner} disabled={!owner.trim()}>Go</button>
        </div>
      {:else}
        <div class="owner-bar">
          <span class="owner-name">{owner}</span>
          <button class="btn-link" on:click={changeOwner}>change</button>
        </div>
      {/if}
    </div>

    {#if ownerConfirmed}
      <div class="field">
        {#if repoLoading}
          <div class="hint">Loading repos...</div>
        {:else}
          <input
            type="text"
            class="input"
            placeholder="Search repos..."
            bind:value={repoFilter}
            on:input={filterRepos}
            on:focus={() => { showRepoDropdown = true; }}
          />
          {#if showRepoDropdown && repos.length > 0}
            <div class="dropdown">
              {#each repos as repo}
                <button class="dropdown-item" on:click={() => selectRepo(repo.nameWithOwner)}>
                  {repo.nameWithOwner.split('/')[1]}
                </button>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    {#if selectedRepo}
      <div class="field">
        {#if prLoading}
          <div class="hint">Loading PRs...</div>
        {:else if prs.length === 0}
          <div class="hint">No open PRs</div>
        {:else}
          <select class="input" bind:value={selectedPR}>
            <option value={null} disabled selected>Select a PR...</option>
            {#each prs as pr}
              <option value={pr.number}>#{pr.number} {pr.title}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/if}

    <div class="slider-row">
      <label>Poll <span class="val">{pollInterval}s</span></label>
      <input type="range" min="5" max="60" step="5" bind:value={pollInterval} />
    </div>

    <button
      class="btn watch-btn"
      on:click={watch}
      disabled={!connected || !selectedRepo || !selectedPR}
    >
      Watch PR
    </button>
  {:else}
    <div class="watching-header">
      <span class="watching-label">{selectedRepo}#{selectedPR}</span>
      {#if allPassed}
        <span class="badge pass">All Passed</span>
      {:else if anyFailed}
        <span class="badge fail">Failed</span>
      {:else}
        <span class="badge pending">Running</span>
      {/if}
    </div>

    {#if checks.length > 0}
      <div class="check-list">
        {#each checks as check, i}
          <div class="check-row">
            <span class="check-dot" style="background: {statusColor(check.statusChar)}"></span>
            <span class="check-name">{check.name}</span>
            <span class="check-icon">{statusIcon(check.statusChar)}</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="hint">Fetching checks...</div>
    {/if}

    <div class="slider-row">
      <label>Poll <span class="val">{pollInterval}s</span></label>
      <input type="range" min="5" max="60" step="5" bind:value={pollInterval}
        on:change={() => send({ type: 'pr-interval', interval: pollInterval })} />
    </div>

    <button class="btn stop-btn" on:click={stop}>Stop Watching</button>
  {/if}
</div>

<style>
  .pr-checks h2 {
    margin: 0 0 10px 0;
    font-size: 11px;
    font-weight: 500;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .field {
    margin-bottom: 8px;
    position: relative;
  }

  .input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #1e1e3a;
    border-radius: 8px;
    background: #0a0a14;
    color: #ccc;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }

  .input:focus {
    border-color: #4ade80;
  }

  .input-row {
    display: flex;
    gap: 6px;
  }

  .input-row .input {
    flex: 1;
  }

  .inline-btn {
    padding: 8px 14px;
    border: 1px solid #4ade80;
    border-radius: 8px;
    background: #0a0a14;
    color: #4ade80;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.12s;
  }

  .inline-btn:hover {
    background: #161630;
  }

  .inline-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .owner-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
  }

  .owner-name {
    font-size: 12px;
    color: #ccc;
    font-weight: 500;
  }

  .btn-link {
    background: none;
    border: none;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .btn-link:hover {
    color: #888;
  }

  select.input {
    appearance: none;
    cursor: pointer;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #12122a;
    border: 1px solid #1e1e3a;
    border-radius: 8px;
    margin-top: 4px;
    max-height: 180px;
    overflow-y: auto;
    z-index: 10;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: none;
    color: #ccc;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  .dropdown-item:hover {
    background: #1a1a40;
  }

  .hint {
    font-size: 11px;
    color: #555;
    padding: 6px 0;
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
    font-family: inherit;
  }

  .btn:hover {
    background: #161630;
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .watch-btn {
    border-color: #4ade80;
    color: #4ade80;
  }

  .stop-btn {
    border-color: #f87171;
    color: #f87171;
    margin-top: 8px;
  }

  .watching-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .watching-label {
    font-size: 12px;
    color: #ccc;
    font-weight: 500;
  }

  .badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge.pass {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
  }

  .badge.fail {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }

  .badge.pending {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }

  .check-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 4px;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 6px;
    background: #0a0a14;
  }

  .check-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .check-name {
    flex: 1;
    font-size: 11px;
    color: #aaa;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .check-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .slider-row label {
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

  .slider-row input[type="range"] {
    flex: 1;
    accent-color: #4ade80;
    height: 4px;
  }
</style>
