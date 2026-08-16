import { describe, expect, it } from 'vitest';
import { deviceGuidance, enrollmentMessage, fingerName, firmwareModeLabel, resolveLocale, toolbarStatusLabel, translate, translations } from './i18n';

describe('i18n', () => {
  it('keeps every locale in key parity with Vietnamese', () => {
    const baseline = Object.keys(translations.vi).sort();
    expect(Object.keys(translations.en).sort()).toEqual(baseline);
    expect(Object.keys(translations['zh-CN']).sort()).toEqual(baseline);
  });

  it('resolves supported system locales and falls back to Vietnamese', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('zh-Hans-CN')).toBe('zh-CN');
    expect(resolveLocale('vi-VN')).toBe('vi');
    expect(resolveLocale('fr-FR')).toBe('vi');
  });

  it('interpolates translated values without leaking mixed-language copy', () => {
    expect(translate('vi', 'hud.actionExecuted', { action: 'Phím Enter' })).toBe('Đã chạy Phím Enter');
    expect(translate('en', 'hud.actionExecuted', { action: 'Enter key' })).toBe('Ran Enter key');
    expect(translate('zh-CN', 'hud.actionExecuted', { action: 'Enter 键' })).toBe('已执行 Enter 键');
  });

  it('derives finger names from semantic ids', () => {
    expect(fingerName('vi', 1)).toBe('Ngón cái trái');
    expect(fingerName('en', 7)).toBe('Right index finger');
    expect(fingerName('zh-CN', 10)).toBe('右手小指');
  });

  it('maps fingerprint enrollment stages to actionable messages', () => {
    expect(enrollmentMessage('vi', 'unlock_existing')).toContain('vân tay đã đăng ký');
    expect(enrollmentMessage('en', 'enroll:reg_model:0x0a')).toContain('same finger');
    expect(enrollmentMessage('zh-CN', 'enroll:store:0x0b')).toContain('保存');
    expect(enrollmentMessage('vi', 'timeout')).toContain('hết thời gian');
    expect(enrollmentMessage('en', 'persistence_failed')).toContain('save');
  });

  it('localizes firmware codes instead of exposing backend values', () => {
    expect(firmwareModeLabel('vi', 'hid')).toBe('Bàn phím HID');
    expect(firmwareModeLabel('en', 'checking')).toBe('Checking');
    expect(firmwareModeLabel('zh-CN', 'unknown')).toBe('未知');
  });

  it('gives actionable copy for non-ready device states', () => {
    expect(toolbarStatusLabel('vi', 'bootloader')).toContain('chế độ nạp');
    expect(deviceGuidance('en', 'error').description).toContain('sensor cable');
    expect(deviceGuidance('zh-CN', 'checking').title).toContain('检查');
  });
});
