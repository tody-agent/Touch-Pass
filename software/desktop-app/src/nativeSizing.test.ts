// @ts-expect-error Node built-in types are intentionally not installed for the browser bundle.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import tauriConfigSource from '../src-tauri/tauri.conf.json?raw';

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');
const tauriConfig = JSON.parse(tauriConfigSource) as { app: { windows: Array<Record<string, unknown>> } };

describe('native desktop sizing contract', () => {
  it('uses the approved resizable native main window dimensions', () => {
    const mainWindow = tauriConfig.app.windows.find((window) => window.label === 'main');

    expect(mainWindow).toMatchObject({
      width: 1180,
      height: 760,
      minWidth: 960,
      minHeight: 640,
      resizable: true,
      decorations: true
    });
  });

  it('keeps the approved three-pane shell, body lock, and pane-local scrolling at every native size', () => {
    const grid = 'grid-template-columns: clamp(250px, 29vw, 340px) minmax(390px, 1fr) clamp(270px, 30vw, 350px);';

    expect(css).toContain(grid);
    expect((css.match(new RegExp(grid.replace(/[()]/g, '\\$&'), 'g')) ?? [])).toHaveLength(2);
    expect(css).toMatch(/html,\s*body,\s*#app\s*\{[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(/\.finger-navigator,\s*\.workspace-editor-pane,\s*\.device-inspector\s*\{[^}]*overflow:\s*auto;/s);
    expect(css).toMatch(/\.settings-navigator,\s*\.settings-main,\s*\.settings-status-pane\s*\{[^}]*overflow:\s*auto;/s);
  });

  it('does not restore a stacked or hidden-pane layout below the supported native minimum', () => {
    expect(css).not.toMatch(/@media\s*\(max-width:\s*(?:800|560)px\)/);
  });

  it('wraps expanded localized copy in the constrained desktop panes', () => {
    expect(css).toMatch(/\.action-row-copy\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
    expect(css).toMatch(/\.settings-main-heading p,\s*\.settings-privacy-status p\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
    expect(css).toMatch(/\.device-status-list dd\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
  });
});
