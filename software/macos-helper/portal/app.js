const state = { csrf: "", fingers: [], device: null, activeJob: null, timer: null, logsPaused: false };
const grid = document.querySelector("#finger-grid");
const statusBadge = document.querySelector("#device-status");
const profileDialog = document.querySelector("#profile-dialog");
const profileForm = document.querySelector("#profile-form");
const jobDialog = document.querySelector("#job-dialog");
const customSteps = document.querySelector("#custom-steps");

const presets = {
  password: "Mật khẩu + Enter",
  accept: "Accept · Y + Enter · chạm kép",
  enter: "Enter · chạm kép",
  escape: "Escape · chạm kép",
  custom: "Macro tùy chỉnh · chạm kép",
};

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (options.method && options.method !== "GET") headers["X-CSRF-Token"] = state.csrf;
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

function button(text, className, action, disabled = false) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `button ${className}`;
  element.textContent = text;
  element.disabled = disabled;
  element.addEventListener("click", action);
  return element;
}

/* Tab Navigation */
function switchTab(tabName) {
  if (!tabName) return;
  localStorage.setItem("touchpass_active_tab", tabName);

  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-content, .tab-panel").forEach((panel) => {
    const isTarget = panel.id === `tab-${tabName}` || panel.dataset.tab === tabName;
    panel.classList.toggle("active", isTarget);
  });
}

function initTabNavigation() {
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll("[data-nav-target]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.navTarget));
  });

  const savedTab = localStorage.getItem("touchpass_active_tab") || "onboarding";
  switchTab(savedTab);
}

/* Onboarding Wizard */
function initOnboardingWizard() {
  const btnTestHid = document.querySelector("#btn-test-hid");
  if (btnTestHid) {
    btnTestHid.addEventListener("click", async () => {
      try {
        btnTestHid.disabled = true;
        await api("/api/test", {
          method: "POST",
          body: JSON.stringify({ action: "type_test" }),
        });
        showToast("Đã gửi lệnh gõ thử USB HID!");
        const testInput = document.querySelector("#hid-test-input");
        if (testInput) testInput.focus();
      } catch (err) {
        showToast(`Lỗi gõ thử HID: ${err.message}`);
      } finally {
        btnTestHid.disabled = false;
      }
    });
  }
}

/* Slot Grid & Profiles */
function render() {
  grid.replaceChildren();
  for (const finger of state.fingers) {
    const card = document.createElement("article");
    card.className = `finger-card${finger.enrolled ? " enrolled" : ""}`;
    const number = document.createElement("div");
    number.className = "slot-number";
    number.textContent = String(finger.slot).padStart(2, "0");
    const summary = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "finger-name";
    title.textContent = finger.label;
    const meta = document.createElement("p");
    meta.className = "finger-meta";
    meta.textContent = `${finger.enrolled ? "Đã đăng ký" : "Chưa có vân tay"} · ${presets[finger.action.preset] || "Chưa cấu hình"}`;
    summary.append(title, meta);
    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(
      button("Cấu hình", "button-secondary", () => openProfile(finger)),
      finger.enrolled
        ? button("Xóa vân", "button-danger", () => deleteFinger(finger))
        : button("Đăng ký", "button-primary", () => enrollFinger(finger), !state.device?.connected),
    );
    card.append(number, summary, actions);
    grid.append(card);
  }
}

function setDeviceStatus(device) {
  state.device = device;
  statusBadge.className = "status";
  if (device.connected && device.sensor === "ok") {
    statusBadge.classList.add("status-online");
    statusBadge.textContent = `ZW101 sẵn sàng · ${device.port}`;
  } else if (device.connected) {
    statusBadge.classList.add("status-error");
    statusBadge.textContent = "ESP32 đã nối · đang kiểm tra ZW101";
  } else {
    statusBadge.classList.add("status-offline");
    statusBadge.textContent = "Chưa tìm thấy ESP32-S3";
  }
  updateTelemetry(device);
}

function updateTelemetry(device) {
  const statusElem = document.querySelector("#telemetry-status");
  const portElem = document.querySelector("#telemetry-port");
  const sensorElem = document.querySelector("#telemetry-sensor");

  if (statusElem) {
    statusElem.textContent = device.connected ? "Đã kết nối" : "Ngoại tuyến";
  }
  if (portElem) {
    portElem.textContent = device.port || "N/A";
  }
  if (sensorElem) {
    sensorElem.textContent = device.sensor === "ok" ? "Hoạt động (OK)" : (device.sensor || "Chưa nhận");
  }
}

async function refresh() {
  try {
    const [status, profiles] = await Promise.all([api("/api/status"), api("/api/fingers")]);
    state.csrf = status.csrf_token;
    setDeviceStatus(status.device);
    state.fingers = profiles.fingers;
    render();
  } catch (error) {
    showToast(error.message);
  }
}

function formatKeyStep(step) {
  if (!step) return "enter";
  let key = (step.key || "enter").trim().toLowerCase();
  let mods = Number(step.modifiers || 0);
  if (!mods) return key;

  const modParts = [];
  if (mods & 0x01) modParts.push("ctrl");
  if (mods & 0x02) modParts.push("shift");
  if (mods & 0x04) modParts.push("alt");
  if (mods & 0x08) modParts.push("cmd");

  if (key.includes("+")) return key;
  return [...modParts, key].join("+");
}

function parseKeyInput(inputStr) {
  const str = (inputStr || "").trim().toLowerCase();
  if (!str) return { type: "key", key: "enter", modifiers: 0 };

  const parts = str.split("+").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    return { type: "key", key: parts[0], modifiers: 0 };
  }

  let modifiers = 0;
  let key = parts[parts.length - 1];
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === "ctrl" || part === "control") modifiers |= 0x01;
    else if (part === "shift") modifiers |= 0x02;
    else if (part === "alt" || part === "opt" || part === "option") modifiers |= 0x04;
    else if (part === "cmd" || part === "meta" || part === "super" || part === "win") modifiers |= 0x08;
  }
  return { type: "key", key, modifiers };
}

function addCustomStep(step = { type: "text", value: "" }) {
  if (customSteps.children.length >= 16) return;
  const row = document.createElement("div");
  row.className = "custom-step";
  const type = document.createElement("select");
  for (const [value, label] of [["text", "Text"], ["key", "Phím"], ["delay", "Delay"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    type.append(option);
  }
  type.value = step.type;
  const value = document.createElement("input");
  const remove = button("×", "button-danger", () => row.remove());
  const sync = () => {
    value.type = type.value === "delay" ? "number" : "text";
    value.placeholder = type.value === "text" ? "ASCII text" : type.value === "key" ? "enter / escape / tab…" : "0–5000 ms";
    value.value = type.value === "text" ? (step.value || "") : type.value === "key" ? formatKeyStep(step) : String(step.milliseconds ?? 250);
  };
  type.addEventListener("change", () => { step = { type: type.value }; sync(); });
  sync();
  row.append(type, value, remove);
  customSteps.append(row);
}

function readCustomSteps() {
  return [...customSteps.children].map((row) => {
    const [type, value] = row.querySelectorAll("select, input");
    if (type.value === "text") return { type: "text", value: value.value };
    if (type.value === "key") return parseKeyInput(value.value);
    return { type: "delay", milliseconds: Number(value.value) };
  });
}

function openProfile(finger) {
  stopRecordingMode();
  document.querySelector("#profile-slot").value = finger.slot;
  document.querySelector("#dialog-title").textContent = `Slot ${finger.slot}`;
  document.querySelector("#profile-label").value = finger.label;
  document.querySelector("#profile-preset").value = finger.action.preset;
  document.querySelector("#profile-secret").value = "";
  document.querySelector("#secret-hint").textContent = finger.action.secret_configured ? "Đã có mật khẩu trong Keychain. Để trống để giữ nguyên." : "Chưa có mật khẩu; hãy nhập một giá trị ASCII.";
  document.querySelector("#form-error").textContent = "";
  customSteps.replaceChildren();
  for (const step of finger.action.steps || []) addCustomStep(step);
  syncPresetFields();
  profileDialog.showModal();
}

function syncPresetFields() {
  const preset = document.querySelector("#profile-preset").value;
  document.querySelector("#secret-field").hidden = preset !== "password";
  document.querySelector("#custom-builder").hidden = preset !== "custom";
}

profileForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const slot = Number(document.querySelector("#profile-slot").value);
  const preset = document.querySelector("#profile-preset").value;
  const body = { label: document.querySelector("#profile-label").value, action: { preset } };
  if (preset === "password") {
    body.action.confirm = false;
    const secret = document.querySelector("#profile-secret").value;
    if (secret) body.secret = secret;
  } else {
    body.action.confirm = true;
  }
  if (preset === "custom") body.action.steps = readCustomSteps();
  try {
    await api(`/api/fingers/${slot}`, { method: "PUT", body: JSON.stringify(body) });
    profileDialog.close();
    showToast("Đã lưu cấu hình.");
    await refresh();
  } catch (error) {
    document.querySelector("#form-error").textContent = error.message;
  }
});

async function enrollFinger(finger) {
  try {
    const payload = await api(`/api/fingers/${finger.slot}/enroll`, { method: "POST", body: "{}" });
    state.activeJob = payload.job;
    document.querySelector("#job-title").textContent = `Đăng ký ${finger.label}`;
    jobDialog.showModal();
    updateJob(payload.job);
    pollJob();
  } catch (error) { showToast(error.message); }
}

async function deleteFinger(finger) {
  if (!confirm(`Xóa vân tay “${finger.label}” và cấu hình liên quan?`)) return;
  try {
    const payload = await api(`/api/fingers/${finger.slot}`, { method: "DELETE", body: "{}" });
    state.activeJob = payload.job;
    if (["deleted", "error"].includes(payload.job.state)) await refresh();
    else pollJob();
    showToast("Đã gửi yêu cầu xóa.");
  } catch (error) { showToast(error.message); }
}

const jobMessages = {
  queued: "Đang gửi yêu cầu tới ESP32…",
  place_first: "Đặt ngón tay lên cảm biến.",
  remove: "Nhấc ngón tay ra.",
  place_second: "Đặt lại cùng ngón tay lần thứ hai.",
  stored: "Đăng ký hoàn tất.",
  deleted: "Đã xóa vân tay.",
  cancelled: "Đã hủy thao tác.",
  error: "ZW101 không thể hoàn tất thao tác.",
};

function updateJob(job) {
  state.activeJob = job;
  document.querySelector("#job-message").textContent = job.error || jobMessages[job.state] || job.state;
  const terminal = ["stored", "deleted", "cancelled", "error"].includes(job.state);
  document.querySelector("#cancel-job").textContent = terminal ? "Đóng" : "Hủy";
  if (terminal) {
    clearTimeout(state.timer);
    refresh();
  }
}

function pollJob() {
  clearTimeout(state.timer);
  state.timer = setTimeout(async () => {
    try {
      const payload = await api(`/api/jobs/${state.activeJob.id}`);
      updateJob(payload.job);
      if (!["stored", "deleted", "cancelled", "error"].includes(payload.job.state)) pollJob();
    } catch (error) { showToast(error.message); }
  }, 500);
}

document.querySelector("#cancel-job").addEventListener("click", async () => {
  const terminal = ["stored", "deleted", "cancelled", "error"].includes(state.activeJob?.state);
  if (!terminal && state.activeJob) {
    try {
      const payload = await api(`/api/jobs/${state.activeJob.id}/cancel`, { method: "POST", body: "{}" });
      updateJob(payload.job);
    } catch (error) { showToast(error.message); return; }
  }
  jobDialog.close();
});

/* Debug Console & Live Log Streaming */
function getTagBadgeClass(tag) {
  const t = (tag || "").toUpperCase();
  if (t === "TOUCH") return "log-tag-touch";
  if (t === "MATCH") return "log-tag-match";
  if (t === "PW" || t === "PASSWORD") return "log-tag-pw";
  if (t === "ERR" || t === "ERROR") return "log-tag-err";
  return "log-tag-system";
}

function formatLogTime(isoStr) {
  if (!isoStr) return `[${new Date().toLocaleTimeString("vi-VN")}]`;
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return `[${isoStr}]`;
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const secs = String(d.getSeconds()).padStart(2, "0");
    return `[${hours}:${mins}:${secs}]`;
  } catch (e) {
    return `[${isoStr}]`;
  }
}

async function pollLogs() {
  if (state.logsPaused) return;
  try {
    const data = await api("/api/logs");
    if (data.logs) {
      renderLogs(data.logs);
    }
  } catch (err) {
    // Silent catch on log polling errors
  }
}

function renderLogs(logs) {
  const logConsole = document.querySelector("#log-console");
  if (!logConsole) return;

  logConsole.replaceChildren();
  if (logs.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "log-entry";
    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = "[00:00:00]";
    const tagSpan = document.createElement("span");
    tagSpan.className = "log-tag log-tag-system";
    tagSpan.textContent = "SYSTEM";
    emptyDiv.append(timeSpan, tagSpan, document.createTextNode(" Sẵn sàng kết nối TouchPass Debug Portal..."));
    logConsole.appendChild(emptyDiv);
    return;
  }

  for (const entry of logs) {
    const div = document.createElement("div");
    div.className = "log-entry";

    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = formatLogTime(entry.timestamp);

    const tagSpan = document.createElement("span");
    const tagClass = getTagBadgeClass(entry.tag);
    tagSpan.className = `log-tag ${tagClass}`;
    tagSpan.textContent = (entry.tag || "SYSTEM").toUpperCase();

    const msgNode = document.createTextNode(` ${entry.message || ""}`);

    div.append(timeSpan, tagSpan, msgNode);
    logConsole.appendChild(div);
  }

  logConsole.scrollTop = logConsole.scrollHeight;
}

function initDebugConsole() {
  const clearBtn = document.querySelector("#btn-clear-logs");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const logConsole = document.querySelector("#log-console");
      if (logConsole) logConsole.replaceChildren();
      showToast("Đã xóa log console.");
    });
  }

  const pauseBtn = document.querySelector("#btn-pause-logs");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      state.logsPaused = !state.logsPaused;
      pauseBtn.textContent = state.logsPaused ? "Tiếp tục" : "Tạm dừng";
      pauseBtn.classList.toggle("button-primary", state.logsPaused);
      showToast(state.logsPaused ? "Đã tạm dừng nhận log." : "Tiếp tục nhận log.");
    });
  }

  const pingBtn = document.querySelector("#btn-test-ping");
  if (pingBtn) {
    pingBtn.addEventListener("click", async () => {
      try {
        await api("/api/test", { method: "POST", body: JSON.stringify({ action: "ping" }) });
        showToast("Đã gửi lệnh Test Ping!");
      } catch (err) {
        showToast(`Lỗi Ping: ${err.message}`);
      }
    });
  }

  const typeBtn = document.querySelector("#btn-test-type");
  if (typeBtn) {
    typeBtn.addEventListener("click", async () => {
      try {
        await api("/api/test", { method: "POST", body: JSON.stringify({ action: "type_test" }) });
        showToast("Đã gửi lệnh Test Type!");
      } catch (err) {
        showToast(`Lỗi Type Test: ${err.message}`);
      }
    });
  }

  setInterval(pollLogs, 1000);
}

/* Guide Cards / Template Application */
function applyTemplateToSlot(preset, label) {
  let targetFinger = state.fingers.find((f) => !f.enrolled) || state.fingers[0];
  if (!targetFinger) {
    targetFinger = { slot: 1, label: label || "Mẫu mới", action: { preset: preset || "password" } };
  }

  switchTab("slots");

  openProfile({
    ...targetFinger,
    label: label || targetFinger.label,
    action: {
      ...targetFinger.action,
      preset: preset || targetFinger.action?.preset || "password",
    },
  });

  showToast(`Áp dụng mẫu "${label}" cho Slot ${targetFinger.slot}`);
}

function initGuideCards() {
  document.querySelectorAll(".btn-apply-template").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const preset = btn.dataset.preset;
      const label = btn.dataset.label;
      applyTemplateToSlot(preset, label);
    });
  });
}

/* Shortcut Recorder & AI Tool Presets */
let isRecording = false;

function stopRecordingMode() {
  isRecording = false;
  const recorderBox = document.querySelector("#shortcut-recorder");
  if (recorderBox) {
    recorderBox.classList.remove("recording-active");
    recorderBox.innerHTML = '<span class="recorder-prompt">🔴 Bấm vào đây và nhấn tổ hợp phím để bắt phím tự động</span>';
  }
}

function getShortcutLabel(modifiers, rawKey, mappedKey) {
  const parts = [];
  if (modifiers & 0x01) parts.push("Ctrl");
  if (modifiers & 0x02) parts.push("Shift");
  if (modifiers & 0x04) parts.push("Alt");
  if (modifiers & 0x08) parts.push("Cmd");

  let mainKey = rawKey;
  if (mappedKey === "enter") mainKey = "Enter";
  else if (mappedKey === "escape") mainKey = "Escape";
  else if (mappedKey === "tab") mainKey = "Tab";
  else if (mappedKey === "space") mainKey = "Space";
  else if (mappedKey === "up") mainKey = "ArrowUp";
  else if (mappedKey === "down") mainKey = "ArrowDown";
  else if (mappedKey === "left") mainKey = "ArrowLeft";
  else if (mappedKey === "right") mainKey = "ArrowRight";
  else if (typeof mainKey === "string" && mainKey.length === 1) mainKey = mainKey.toUpperCase();

  parts.push(mainKey);
  return parts.join("+");
}

function initShortcutRecorder() {
  const recorderBox = document.querySelector("#shortcut-recorder");
  if (!recorderBox) return;

  recorderBox.addEventListener("click", (e) => {
    e.stopPropagation();
    isRecording = !isRecording;
    if (isRecording) {
      recorderBox.classList.add("recording-active");
      recorderBox.innerHTML = '<span class="recorder-prompt">🔴 Hãy nhấn tổ hợp phím bất kỳ trên bàn phím...</span>';
    } else {
      stopRecordingMode();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!isRecording) return;

    // Prevent default browser shortcut action
    e.preventDefault();

    // Ignore standalone modifier presses
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

    // Extract modifier flags: Ctrl: 0x01, Shift: 0x02, Alt: 0x04, Meta/Cmd: 0x08
    let modifiers = 0;
    if (e.ctrlKey) modifiers |= 0x01;
    if (e.shiftKey) modifiers |= 0x02;
    if (e.altKey) modifiers |= 0x04;
    if (e.metaKey) modifiers |= 0x08;

    // Map key code / key name to TouchPass opcode
    const specialKeyMap = {
      "Enter": "enter",
      "Escape": "escape",
      "Tab": "tab",
      " ": "space",
      "Space": "space",
      "Spacebar": "space",
      "ArrowUp": "up",
      "ArrowDown": "down",
      "ArrowLeft": "left",
      "ArrowRight": "right",
    };

    const rawKey = e.key;
    const isSpecial = Boolean(specialKeyMap[rawKey]);
    const mappedKey = specialKeyMap[rawKey] || rawKey.toLowerCase();

    let step;
    if (isSpecial || modifiers > 0) {
      step = { type: "key", key: mappedKey, modifiers: modifiers };
    } else {
      step = { type: "text", value: rawKey };
    }

    const shortcutLabel = getShortcutLabel(modifiers, rawKey, mappedKey);

    // Append step to custom-steps automatically
    addCustomStep(step);

    // Deactivate recording mode upon keystroke capture
    isRecording = false;
    recorderBox.classList.remove("recording-active");
    recorderBox.innerHTML = `<span class="recorder-prompt">✅ Đã ghi nhận: <strong>${shortcutLabel}</strong> (Bấm để ghi lại)</span>`;
  });
}

const aiPresetActions = {
  claude_cancel: [{ type: "key", key: "c", modifiers: 1 }],
  claude_clear: [{ type: "key", key: "l", modifiers: 1 }],
  claude_compact: [{ type: "text", value: "/compact" }, { type: "key", key: "enter" }],
  cursor_edit: [{ type: "key", key: "k", modifiers: 2 }],
  cursor_composer: [{ type: "key", key: "i", modifiers: 2 }],
  cursor_chat: [{ type: "key", key: "l", modifiers: 2 }],
  antigravity_bar: [{ type: "key", key: "a", modifiers: 3 }],
  antigravity_logs: [{ type: "key", key: "l", modifiers: 3 }],
  codex_run: [{ type: "key", key: "enter", modifiers: 2 }],
  claude_desktop_new: [{ type: "key", key: "o", modifiers: 3 }]
};

function parsePresetAction(actionAttr) {
  if (!actionAttr) return [];
  if (aiPresetActions[actionAttr]) {
    return aiPresetActions[actionAttr];
  }
  try {
    const parsed = JSON.parse(actionAttr);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "object") return [parsed];
  } catch (e) {
    // String fallback or parse error
  }
  return [];
}

function initAIToolPresets() {
  document.querySelectorAll(".btn-apply-preset").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rawAction = btn.dataset.presetAction;
      const label = btn.dataset.label || "Phím tắt AI";
      const steps = parsePresetAction(rawAction);

      let targetFinger = state.fingers.find((f) => !f.enrolled) || state.fingers[0];
      if (!targetFinger) {
        targetFinger = { slot: 1, label: label, action: { preset: "custom", steps: [] } };
      }

      switchTab("slots");

      openProfile({
        ...targetFinger,
        label: label,
        action: {
          ...targetFinger.action,
          preset: "custom",
          steps: steps,
        },
      });

      showToast(`Áp dụng phím tắt AI "${label}" cho Slot ${targetFinger.slot}`);
    });
  });
}

document.querySelector("#profile-preset").addEventListener("change", syncPresetFields);
document.querySelectorAll("[data-add-step]").forEach((element) => element.addEventListener("click", () => addCustomStep({ type: element.dataset.addStep })));
document.querySelector("#refresh").addEventListener("click", refresh);

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// Initial Boot
initTabNavigation();
initOnboardingWizard();
initDebugConsole();
initGuideCards();
initShortcutRecorder();
initAIToolPresets();
refresh();
setInterval(refresh, 5000);
