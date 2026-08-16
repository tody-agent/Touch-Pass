import { describe, expect, it } from 'vitest';
import actionPane from '../components/ActionPane.svelte?raw';
import handColumn from '../components/HandColumn.svelte?raw';
import handMap from '../components/HandMap.svelte?raw';
import helpSheet from '../components/HelpSheet.svelte?raw';
import hudPill from '../components/HUDPill.svelte?raw';
import settingsPane from '../components/SettingsPane.svelte?raw';
import titleBar from '../components/TitleBar.svelte?raw';
import touchIdModal from '../components/TouchIDModal.svelte?raw';

describe('localized component copy', () => {
  it('does not reintroduce legacy hard-coded or mixed-language labels', () => {
    const source = [
      actionPane,
      handColumn,
      handMap,
      helpSheet,
      hudPill,
      settingsPane,
      titleBar,
      touchIdModal
    ].join('\n');

    expect(source).not.toMatch(
      /Menu Bar|Cham Thu Van Tay|Đồng Ý AI|Điền Mật Khẩu|Phím Tắt Tự Chọn|worker=|fingerprints=|hidKeyConfigured=/
    );
  });
});
