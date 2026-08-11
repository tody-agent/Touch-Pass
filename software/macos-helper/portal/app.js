const state = { csrf: "", fingers: [], device: null, activeJob: null, timer: null };
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
    value.value = type.value === "text" ? (step.value || "") : type.value === "key" ? (step.key || "enter") : String(step.milliseconds ?? 250);
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
    if (type.value === "key") return { type: "key", key: value.value.trim().toLowerCase(), modifiers: 0 };
    return { type: "delay", milliseconds: Number(value.value) };
  });
}

function openProfile(finger) {
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

refresh();
setInterval(refresh, 5000);
