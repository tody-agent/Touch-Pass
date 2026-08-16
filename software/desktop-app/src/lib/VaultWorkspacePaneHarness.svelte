<script lang="ts">
  import { createVaultWorkspaceState, requestFingerSelection } from './vaultWorkspaceState';

  let workspace = $state(createVaultWorkspaceState(3));
  const selectedFingerId = $derived(workspace.selectedFingerId);

  function selectFinger(fingerId: number) {
    workspace = requestFingerSelection(workspace, fingerId);
  }
</script>

<section aria-label="Vault workspace pane harness">
  <button onclick={() => selectFinger(9)}>Select finger 9</button>
  <output data-testid="navigator-finger">{selectedFingerId}</output>
  <output data-testid="editor-finger">{selectedFingerId}</output>
  <output data-testid="inspector-finger">{selectedFingerId}</output>
</section>
