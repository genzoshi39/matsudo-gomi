const STORAGE_KEY = "matsudo-gomi-notifier-v1";
const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
const colors = ["#1f7a52", "#2563a8", "#9b5a1e", "#7b4bb7", "#bd3a3a", "#3f6f75"];
let visibleMonth = new Date();
visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);

const defaultState = {
  area: "千葉県松戸市古ケ崎47周辺",
  evening: "20:00",
  morning: "07:00",
  memo: "松戸市の公式ごみ出しカレンダーで地区を確認してから、下の収集ルールを修正してください。",
  rules: [
    { id: crypto.randomUUID(), name: "燃やせるごみ", weekday: 1, week: "every", desc: "仮設定。公式カレンダーで確認してください。", color: colors[0] },
    { id: crypto.randomUUID(), name: "燃やせるごみ", weekday: 4, week: "every", desc: "仮設定。公式カレンダーで確認してください。", color: colors[0] },
    { id: crypto.randomUUID(), name: "リサイクルするプラスチック", weekday: 3, week: "every", desc: "仮設定。公式カレンダーで確認してください。", color: colors[1] },
    { id: crypto.randomUUID(), name: "資源ごみ", weekday: 6, week: "2", desc: "仮設定。公式カレンダーで確認してください。", color: colors[2] }
  ],
  notified: {}
};

let state = load();

const $ = (id) => document.getElementById(id);

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function save() {
  state.area = $("areaInput").value.trim();
  state.evening = $("eveningInput").value;
  state.morning = $("morningInput").value;
  state.memo = $("memoInput").value.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pad(n) { return String(n).padStart(2, "0"); }

function makeDate(year, month, day) {
  return new Date(year, month, day, 12);
}

function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日（${dayNames[date.getDay()]}）`;
}

function weekOfMonth(date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function matches(rule, date) {
  if (Number(rule.weekday) !== date.getDay()) return false;
  if (rule.week === "every") return true;
  return Number(rule.week) === weekOfMonth(date);
}

function eventsFor(date) {
  return state.rules.filter((rule) => matches(rule, date));
}

function renderDay(containerId, date) {
  const events = eventsFor(date);
  const el = $(containerId);
  if (!events.length) {
    el.innerHTML = `<div class="none">収集予定なし</div><p class="hint">登録ルール上の表示です。</p>`;
    return;
  }
  el.innerHTML = events.map((event) => `
    <div class="garbage-name"><span class="color-dot" style="background:${event.color}"></span>${escapeHtml(event.name)}</div>
    <p class="hint">${escapeHtml(event.desc || "朝の指定時間までに出してください。")}</p>
  `).join("");
}

function renderCalendar() {
  const root = $("calendar");
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const first = makeDate(year, month, 1);
  const last = makeDate(year, month + 1, 0);
  $("calendarTitle").textContent = `${year}年${month + 1}月の予定`;
  const cells = dayNames.map((d) => `<div class="weekday">${d}</div>`);
  for (let i = 0; i < first.getDay(); i++) cells.push(`<div class="cell"></div>`);
  for (let day = 1; day <= last.getDate(); day++) {
    const date = makeDate(year, month, day);
    const chips = eventsFor(date).map((event) => `<span class="chip" style="background:${tint(event.color)}">${escapeHtml(event.name)}</span>`).join("");
    cells.push(`<div class="cell"><div class="num">${day}</div>${chips}</div>`);
  }
  root.innerHTML = cells.join("");
}

function renderRules() {
  const root = $("scheduleList");
  root.innerHTML = state.rules.map((rule) => `
    <div class="item">
      <div>
        <strong><span class="color-dot" style="background:${rule.color}"></span>${escapeHtml(rule.name)}</strong>
        <span>${rule.week === "every" ? "毎週" : `第${rule.week}`} ${dayNames[rule.weekday]}曜 / ${escapeHtml(rule.desc || "")}</span>
      </div>
      <button class="secondary" data-delete="${rule.id}" aria-label="${escapeHtml(rule.name)}を削除">削除</button>
    </div>
  `).join("");
  root.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rules = state.rules.filter((rule) => rule.id !== button.dataset.delete);
      save();
      render();
    });
  });
}

function render() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  $("todayDate").textContent = `今日 ${formatDate(today)}`;
  $("tomorrowDate").textContent = `明日 ${formatDate(tomorrow)}`;
  $("areaInput").value = state.area;
  $("eveningInput").value = state.evening;
  $("morningInput").value = state.morning;
  $("memoInput").value = state.memo;
  renderDay("todayGarbage", today);
  renderDay("tomorrowGarbage", tomorrow);
  renderCalendar();
  renderRules();
}

function tint(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function notify(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body });
}

function checkNotifications() {
  const now = new Date();
  const todayEvents = eventsFor(now);
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowEvents = eventsFor(tomorrow);
  maybeNotify(now, state.morning, ymd(now), "today", todayEvents, "今日のごみ出し");
  maybeNotify(now, state.evening, ymd(tomorrow), "tomorrow", tomorrowEvents, "明日のごみ出し");
}

function maybeNotify(now, hhmm, dateKey, type, events, title) {
  if (!events.length || !hhmm) return;
  const [hh, mm] = hhmm.split(":").map(Number);
  const due = now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm);
  const key = `${dateKey}-${type}`;
  if (due && !state.notified[key]) {
    notify(title, events.map((event) => event.name).join(" / "));
    state.notified[key] = true;
    save();
  }
}

function exportIcs() {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Matsudo Gomi Notifier//JA"
  ];
  for (let offset = 0; offset < 120; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    for (const event of eventsFor(date)) {
      const start = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${event.id}-${start}@matsudo-gomi`);
      lines.push(`DTSTAMP:${start}T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`SUMMARY:${escapeIcs(event.name)}`);
      lines.push(`DESCRIPTION:${escapeIcs(`${state.area} ${event.desc || ""}`)}`);
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "matsudo-gomi-calendar.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

["areaInput", "eveningInput", "morningInput", "memoInput"].forEach((id) => {
  $(id).addEventListener("input", save);
});

$("addBtn").addEventListener("click", () => {
  const name = $("nameInput").value.trim();
  if (!name) return;
  state.rules.push({
    id: crypto.randomUUID(),
    name,
    weekday: Number($("weekdayInput").value),
    week: $("weekInput").value,
    desc: $("descInput").value.trim(),
    color: colors[state.rules.length % colors.length]
  });
  $("nameInput").value = "";
  $("descInput").value = "";
  save();
  render();
});

$("resetBtn").addEventListener("click", () => {
  if (!confirm("登録したルールを初期状態に戻しますか？")) return;
  state = structuredClone(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  render();
});

$("notifyBtn").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    $("notifyNote").textContent = "このブラウザは通知に対応していません。";
    return;
  }
  const permission = await Notification.requestPermission();
  $("notifyNote").textContent = permission === "granted" ? "通知を許可しました。" : "通知は許可されませんでした。";
});

$("testBtn").addEventListener("click", () => notify("ごみ出し通知テスト", "通知はこのように表示されます。"));
$("icsBtn").addEventListener("click", exportIcs);
$("prevMonthBtn").addEventListener("click", () => {
  visibleMonth = makeDate(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});
$("currentMonthBtn").addEventListener("click", () => {
  const now = new Date();
  visibleMonth = makeDate(now.getFullYear(), now.getMonth(), 1);
  renderCalendar();
});
$("nextMonthBtn").addEventListener("click", () => {
  visibleMonth = makeDate(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

render();
checkNotifications();
setInterval(checkNotifications, 60 * 1000);
