import type { ActionType, FingerProfile } from './types';

export type ActionCategory = 'ai_agent' | 'os_window' | 'developer' | 'basic_security';
export type PresetOS = 'all' | 'windows' | 'macos';

export interface ActionOptionItem {
  id: string;
  category: ActionCategory;
  os?: PresetOS;
  actionType: ActionType;
  payload?: string;
  labelKey: string;
  descKey: string;
  badge?: string;
  iconName: string;
  accentColor: string;
  isExpandable?: boolean;
}

export interface CategoryGroup {
  key: ActionCategory;
  labelKey: string;
  iconName: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: 'ai_agent', labelKey: 'category.ai_agent', iconName: 'Bot' },
  { key: 'os_window', labelKey: 'category.os_window', iconName: 'Monitor' },
  { key: 'developer', labelKey: 'category.developer', iconName: 'Terminal' },
  { key: 'basic_security', labelKey: 'category.basic_security', iconName: 'ShieldCheck' }
];

export const ACTION_PRESETS: ActionOptionItem[] = [
  // Group 1: AI Agents (Claude, Codex, Antigravity)
  {
    id: 'ai_accept',
    category: 'ai_agent',
    actionType: 'ai_accept',
    labelKey: 'preset.ai_accept.label',
    descKey: 'preset.ai_accept.description',
    badge: 'y + ↵',
    iconName: 'Bot',
    accentColor: 'text-blue-400'
  },
  {
    id: 'ai_reject',
    category: 'ai_agent',
    actionType: 'custom',
    payload: 'n',
    labelKey: 'preset.ai_reject.label',
    descKey: 'preset.ai_reject.description',
    badge: 'n + ↵',
    iconName: 'XCircle',
    accentColor: 'text-rose-400'
  },
  {
    id: 'claude_switch_mode',
    category: 'ai_agent',
    actionType: 'custom',
    payload: 'Ctrl+Shift+C',
    labelKey: 'preset.claude_switch_mode.label',
    descKey: 'preset.claude_switch_mode.description',
    badge: 'Ctrl+Shift+C',
    iconName: 'RefreshCw',
    accentColor: 'text-amber-400'
  },
  {
    id: 'claude_new_task',
    category: 'ai_agent',
    actionType: 'custom',
    payload: 'Ctrl+Shift+O',
    labelKey: 'preset.claude_new_task.label',
    descKey: 'preset.claude_new_task.description',
    badge: 'Ctrl+Shift+O',
    iconName: 'PlusSquare',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'codex_new_chat',
    category: 'ai_agent',
    actionType: 'custom',
    payload: 'Ctrl+N',
    labelKey: 'preset.codex_new_chat.label',
    descKey: 'preset.codex_new_chat.description',
    badge: 'Ctrl+N',
    iconName: 'MessageSquarePlus',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'antigravity_plan',
    category: 'ai_agent',
    actionType: 'custom',
    payload: '/plan',
    labelKey: 'preset.antigravity_plan.label',
    descKey: 'preset.antigravity_plan.description',
    badge: '/plan',
    iconName: 'Sparkles',
    accentColor: 'text-indigo-400'
  },
  {
    id: 'antigravity_grill',
    category: 'ai_agent',
    actionType: 'custom',
    payload: '/grill-me',
    labelKey: 'preset.antigravity_grill.label',
    descKey: 'preset.antigravity_grill.description',
    badge: '/grill-me',
    iconName: 'HelpCircle',
    accentColor: 'text-violet-400'
  },
  {
    id: 'claude_compact',
    category: 'ai_agent',
    actionType: 'custom',
    payload: '/compact',
    labelKey: 'preset.claude_compact.label',
    descKey: 'preset.claude_compact.description',
    badge: '/compact',
    iconName: 'Minimize2',
    accentColor: 'text-slate-400'
  },

  // Group 2: Window Management & OS Switching (Windows / macOS)
  {
    id: 'win_switch_window',
    category: 'os_window',
    os: 'windows',
    actionType: 'custom',
    payload: 'Alt+Tab',
    labelKey: 'preset.win_switch_window.label',
    descKey: 'preset.win_switch_window.description',
    badge: 'Alt + Tab',
    iconName: 'Layers',
    accentColor: 'text-blue-400'
  },
  {
    id: 'win_task_view',
    category: 'os_window',
    os: 'windows',
    actionType: 'custom',
    payload: 'Win+Tab',
    labelKey: 'preset.win_task_view.label',
    descKey: 'preset.win_task_view.description',
    badge: 'Win + Tab',
    iconName: 'LayoutGrid',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'win_show_desktop',
    category: 'os_window',
    os: 'windows',
    actionType: 'custom',
    payload: 'Win+D',
    labelKey: 'preset.win_show_desktop.label',
    descKey: 'preset.win_show_desktop.description',
    badge: 'Win + D',
    iconName: 'Monitor',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'win_clipboard_history',
    category: 'os_window',
    os: 'windows',
    actionType: 'custom',
    payload: 'Win+V',
    labelKey: 'preset.win_clipboard_history.label',
    descKey: 'preset.win_clipboard_history.description',
    badge: 'Win + V',
    iconName: 'Clipboard',
    accentColor: 'text-purple-400'
  },
  {
    id: 'mac_switch_app',
    category: 'os_window',
    os: 'macos',
    actionType: 'custom',
    payload: 'Cmd+Tab',
    labelKey: 'preset.mac_switch_app.label',
    descKey: 'preset.mac_switch_app.description',
    badge: 'Cmd + Tab',
    iconName: 'Layers',
    accentColor: 'text-blue-400'
  },
  {
    id: 'mac_spotlight',
    category: 'os_window',
    os: 'macos',
    actionType: 'custom',
    payload: 'Cmd+Space',
    labelKey: 'preset.mac_spotlight.label',
    descKey: 'preset.mac_spotlight.description',
    badge: 'Cmd + Space',
    iconName: 'Search',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'mac_mission_control',
    category: 'os_window',
    os: 'macos',
    actionType: 'custom',
    payload: 'Ctrl+Up',
    labelKey: 'preset.mac_mission_control.label',
    descKey: 'preset.mac_mission_control.description',
    badge: 'Ctrl + ↑',
    iconName: 'LayoutGrid',
    accentColor: 'text-purple-400'
  },

  // Group 3: Terminal & Developer Tools
  {
    id: 'git_status',
    category: 'developer',
    actionType: 'custom',
    payload: 'git status',
    labelKey: 'preset.git_status.label',
    descKey: 'preset.git_status.description',
    badge: 'git status',
    iconName: 'GitBranch',
    accentColor: 'text-amber-400'
  },
  {
    id: 'git_diff',
    category: 'developer',
    actionType: 'custom',
    payload: 'git diff',
    labelKey: 'preset.git_diff.label',
    descKey: 'preset.git_diff.description',
    badge: 'git diff',
    iconName: 'GitCompare',
    accentColor: 'text-orange-400'
  },
  {
    id: 'terminal_clear',
    category: 'developer',
    actionType: 'custom',
    payload: 'clear',
    labelKey: 'preset.terminal_clear.label',
    descKey: 'preset.terminal_clear.description',
    badge: 'clear',
    iconName: 'Terminal',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'docker_ps',
    category: 'developer',
    actionType: 'custom',
    payload: 'docker ps',
    labelKey: 'preset.docker_ps.label',
    descKey: 'preset.docker_ps.description',
    badge: 'docker ps',
    iconName: 'Box',
    accentColor: 'text-blue-400'
  },

  // Group 4: Basic Keys & Security
  {
    id: 'password',
    category: 'basic_security',
    actionType: 'password',
    labelKey: 'preset.password.label',
    descKey: 'preset.password.description',
    iconName: 'KeyRound',
    accentColor: 'text-purple-400',
    isExpandable: true
  },
  {
    id: 'enter',
    category: 'basic_security',
    actionType: 'enter',
    labelKey: 'preset.enter.label',
    descKey: 'preset.enter.description',
    badge: 'Enter',
    iconName: 'CornerDownLeft',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'escape',
    category: 'basic_security',
    actionType: 'escape',
    labelKey: 'preset.escape.label',
    descKey: 'preset.escape.description',
    badge: 'Escape',
    iconName: 'Keyboard',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'custom_input',
    category: 'basic_security',
    actionType: 'custom',
    labelKey: 'preset.custom_input.label',
    descKey: 'preset.custom_input.description',
    iconName: 'WandSparkles',
    accentColor: 'text-amber-400',
    isExpandable: true
  }
];

export function detectCurrentOS(): 'windows' | 'macos' {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  return 'windows';
}

export function getAvailablePresets(os?: PresetOS): ActionOptionItem[] {
  const currentOS = os ?? detectCurrentOS();
  return ACTION_PRESETS.filter((item) => {
    if (!item.os || item.os === 'all') return true;
    return item.os === currentOS;
  });
}

export function matchPreset(profile: FingerProfile, presets?: ActionOptionItem[]): ActionOptionItem | undefined {
  const pool = presets ?? ACTION_PRESETS;
  if (profile.actionType === 'ai_accept') {
    return pool.find((p) => p.id === 'ai_accept');
  }
  if (profile.actionType === 'password') {
    return pool.find((p) => p.id === 'password');
  }
  if (profile.actionType === 'enter') {
    return pool.find((p) => p.id === 'enter');
  }
  if (profile.actionType === 'escape') {
    return pool.find((p) => p.id === 'escape');
  }
  if (profile.actionType === 'custom') {
    const payload = (profile.customPayload ?? '').trim();
    const exact = pool.find((p) => p.actionType === 'custom' && p.payload === payload);
    if (exact) return exact;
    return pool.find((p) => p.id === 'custom_input');
  }
  return undefined;
}
