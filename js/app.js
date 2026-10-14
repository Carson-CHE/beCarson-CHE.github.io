/* ===================== 数学王国 · 主程序 ===================== */
"use strict";

/* ---------- 数据存取 ---------- */
const LS_USERS = "mk_users";
const LS_CUR = "mk_current";

function loadUsers() { try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; } catch (e) { return {}; } }
function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
function dataKey(name) { return "mk_data_" + name; }

function blankData() {
  return {
    xp: 0, stars: 0, totalQ: 0, correctQ: 0,
    streak: 0, lastDate: null,
    days: {},            // "2026-10-13": {q, c}
    units: {},           // unitId: {stars, best, attempts, totalQ, correctQ, modes:{}}
    gradeTests: {},      // grade: bestScore
    ach: {},             // achId: dateStr
    wrongs: []           // 错题本: {q, a, type, choices, hint, explain, unitTitle, icon, date, mastered, masteredCount}
  };
}
function loadData(name) {
  try {
    const d = JSON.parse(localStorage.getItem(dataKey(name)));
    return d ? Object.assign(blankData(), d) : blankData();
  } catch (e) { return blankData(); }
}
function saveData() { localStorage.setItem(dataKey(state.user), JSON.stringify(state.data)); }

/* ---------- 全局状态 ---------- */
const state = {
  user: null,
  data: null,
  gradeTab: 1,
  selUnit: null,     // 当前选中单元 {grade, unit}
  quiz: null,        // 答题状态
  wrongFilter: "todo" // 错题本筛选: todo | mastered | all
};
window.state = state; // 暴露给控制台调试/自动化测试

const $ = id => document.getElementById(id);
function todayStr(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function stripHtml(s) { return String(s).replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }

/* ---------- 音效 ---------- */
let AC = null;
function beep(ok) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.frequency.value = ok ? 880 : 220;
    g.gain.setValueAtTime(0.08, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.25);
    o.start(); o.stop(AC.currentTime + 0.25);
  } catch (e) { /* 无声环境忽略 */ }
}

/* ---------- 彩带 ---------- */
function confetti(n = 70) {
  const box = $("confettiBox");
  const colors = ["#FF8F00", "#4A90E2", "#7ED321", "#FF5252", "#7E57C2", "#FFD54F"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.4 + "s";
    c.style.borderRadius = Math.random() < 0.5 ? "50%" : "2px";
    box.appendChild(c);
    setTimeout(() => c.remove(), 2200);
  }
}

/* ===================== 注册 / 登录 ===================== */
let authMode = "login";
document.querySelectorAll(".auth-tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".auth-tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    authMode = t.dataset.tab;
    $("authPass2").style.display = authMode === "register" ? "block" : "none";
    $("authSubmit").textContent = authMode === "register" ? "创建账号 🎈" : "开始冒险 🚀";
    $("authMsg").textContent = "";
  };
});

$("authSubmit").onclick = doAuth;
$("authPass").addEventListener("keydown", e => { if (e.key === "Enter") doAuth(); });
$("authPass2").addEventListener("keydown", e => { if (e.key === "Enter") doAuth(); });

function doAuth() {
  const name = $("authUser").value.trim();
  const pass = $("authPass").value;
  const msg = $("authMsg");
  if (name.length < 2) return msg.textContent = "用户名至少 2 个字符哦";
  if (pass.length < 4) return msg.textContent = "密码至少 4 位哦";
  const users = loadUsers();

  if (authMode === "register") {
    if (pass !== $("authPass2").value) return msg.textContent = "两次输入的密码不一样";
    if (users[name]) return msg.textContent = "这个用户名已经被注册啦";
    users[name] = { pass: btoa(pass), avatar: AVATARS[Object.keys(users).length % AVATARS.length], created: todayStr() };
    saveUsers(users);
    loginAs(name, true);
  } else {
    if (!users[name] || users[name].pass !== btoa(pass)) return msg.textContent = "用户名或密码不对，再试试";
    loginAs(name, false);
  }
}

function loginAs(name, isNew) {
  state.user = name;
  state.data = loadData(name);
  localStorage.setItem(LS_CUR, name);
  if (isNew) unlockAch("welcome");
  enterApp();
}

function logout() {
  state.user = null; state.data = null;
  localStorage.removeItem(LS_CUR);
  $("appView").classList.remove("active");
  $("authView").classList.add("active");
}

/* ===================== 视图导航 ===================== */
const TOP_VIEWS = ["authView", "appView", "quizView", "resultView"];
function showView(id) {
  if (TOP_VIEWS.includes(id)) {
    TOP_VIEWS.forEach(v => $(v).classList.toggle("active", v === id));
    if (id === "appView") showPage("dashboardView");
    return;
  }
  showPage(id);
}
function showPage(id) {
  TOP_VIEWS.forEach(v => $(v).classList.toggle("active", v === "appView"));
  document.querySelectorAll("#appView .page").forEach(p => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.nav === id));
  if (id === "dashboardView") renderDashboard();
  if (id === "learnView") renderLearn();
  if (id === "achieveView") renderAchievements();
  if (id === "statsView") renderStats();
  if (id === "wrongView") renderWrongs();
}
document.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => showPage(b.dataset.nav));
function backToApp() { showView("appView"); }
function backToLearn() { showPage("learnView"); } // 返回上一级：课程页继续选课

/* ===================== 进入应用 ===================== */
function enterApp() {
  $("authView").classList.remove("active");
  $("userName").textContent = state.user;
  $("userAvatar").textContent = loadUsers()[state.user].avatar || "🧒";
  updateStreakOnVisit();
  showView("appView");
}

function updateStreakOnVisit() {
  const d = state.data, t = todayStr();
  if (d.lastDate === t) return;
  const y = todayStr(new Date(Date.now() - 86400000));
  d.streak = (d.lastDate === y) ? d.streak + 1 : 1;
  d.lastDate = t;
  saveData();
}

/* ===================== 仪表盘 ===================== */
function levelOf(xp) {
  let cur = LEVELS[0], next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) cur = LEVELS[i]; else { next = LEVELS[i]; break; }
  }
  return { cur, next };
}

function renderDashboard() {
  const d = state.data;
  const h = new Date().getHours();
  const greet = h < 6 ? "夜深了" : h < 9 ? "早上好" : h < 12 ? "上午好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
  $("helloText").textContent = `${greet}，${state.user}！`;
  $("helloSub").textContent = d.streak > 1 ? `已经连续学习 ${d.streak} 天啦，继续加油！` : "今天也要开心学数学哦～";

  // 等级
  const { cur, next } = levelOf(d.xp);
  $("levelBadge").textContent = "Lv." + cur.lv;
  $("levelName").textContent = cur.name;
  if (next) {
    const pct = Math.min(100, Math.round((d.xp - cur.xp) / (next.xp - cur.xp) * 100));
    $("levelFill").style.width = pct + "%";
    $("levelXp").textContent = `${d.xp} / ${next.xp} XP`;
  } else {
    $("levelFill").style.width = "100%";
    $("levelXp").textContent = `${d.xp} XP · 已满级`;
  }

  // 顶栏
  $("streakNum").textContent = d.streak;
  $("starNum").textContent = d.stars;

  // 今日目标
  const today = d.days[todayStr()] || { q: 0 };
  const goal = 20, pct2 = Math.min(100, today.q / goal * 100);
  $("goalRing").style.strokeDashoffset = 327 - 327 * pct2 / 100;
  $("goalNum").textContent = `${Math.min(today.q, goal)}/${goal}`;

  renderReco();
  renderGradeCards();
}

/* ---------- 个性化推荐 ---------- */
function allUnits() {
  const list = [];
  CURRICULUM.forEach(g => g.units.forEach(u => list.push({ grade: g.grade, gname: g.name, color: g.color, ...u })));
  return list;
}

function getRecommendations() {
  const d = state.data;
  const recos = [];
  const units = allUnits();

  // 1) 完全新手 → 第一课
  if (d.totalQ === 0) {
    const u = units[0];
    recos.push({ icon: "🌱", title: `从「${u.title}」开始`, desc: "这是数学王国的第一站，先来一次轻松练习吧！", grade: u.grade, unitId: u.id, mode: "practice" });
    return recos;
  }

  // 2) 待攻克错题 → 优先重练
  const todoWrongs = d.wrongs.filter(w => !w.mastered).length;
  if (todoWrongs >= 3) {
    recos.push({ icon: "📒", title: `重练 ${todoWrongs} 道错题`, desc: "错题不攻克，越积越多哦！现在就把它们消灭掉！", grade: 0, unitId: "wrongbook", mode: "retrain" });
  }

  // 3) 薄弱单元（有练习但正确率 < 70%）→ 复习
  const weak = units.filter(u => {
    const p = d.units[u.id];
    return p && p.totalQ >= 5 && p.correctQ / p.totalQ < 0.7;
  }).sort((a, b) => (d.units[a.id].correctQ / d.units[a.id].totalQ) - (d.units[b.id].correctQ / d.units[b.id].totalQ));
  if (weak.length) {
    const u = weak[0];
    const acc = Math.round(d.units[u.id].correctQ / d.units[u.id].totalQ * 100);
    recos.push({ icon: "💪", title: `复习「${u.title}」`, desc: `正确率 ${acc}%，再练一次把它变成强项！`, grade: u.grade, unitId: u.id, mode: "practice" });
  }

  // 4) 下一个未获星单元 → 新课
  const nextNew = units.find(u => !(d.units[u.id] && d.units[u.id].stars > 0));
  if (nextNew) {
    recos.push({ icon: "📖", title: `学习新课「${nextNew.title}」`, desc: `${nextNew.gname} · ${nextNew.desc}`, grade: nextNew.grade, unitId: nextNew.id, mode: "practice" });
  }

  // 5) 已练习但未测试的单元 → 挑战测试
  const needTest = units.find(u => {
    const p = d.units[u.id];
    return p && p.modes && p.modes.practice && !p.modes.test;
  });
  if (needTest) recos.push({ icon: "📝", title: `挑战「${needTest.title}」测试`, desc: "练习完成啦，来检验一下学习成果！", grade: needTest.grade, unitId: needTest.id, mode: "test" });

  // 6) 口算日常
  if (recos.length < 3) {
    const any = units.find(u => d.units[u.id]) || units[0];
    recos.push({ icon: "⚡", title: "每日口算打卡", desc: "60 秒口算挑战，让计算又快又准！", grade: any.grade, unitId: any.id, mode: "oral" });
  }

  if (!recos.length) recos.push({ icon: "👑", title: "你已通关全部课程！", desc: "试试挑战测试满分，成为真正的数学王者！", grade: 3, unitId: units[units.length - 1].id, mode: "test" });
  return recos.slice(0, 3);
}

function renderReco() {
  const list = getRecommendations();
  $("recoList").innerHTML = list.map(r => `
    <div class="reco-card" onclick="recoGo(${r.grade},'${r.unitId}','${r.mode}')">
      <div class="reco-icon">${r.icon}</div>
      <div><div class="reco-title">${r.title}</div><div class="reco-desc">${r.desc}</div></div>
    </div>`).join("");
}
function recoGo(grade, unitId, mode) {
  if (mode === "retrain") return startRetrain();
  const g = CURRICULUM.find(x => x.grade === grade);
  const u = g.units.find(x => x.id === unitId);
  state.selUnit = { grade: g, unit: u };
  startQuiz(mode);
}

/* ---------- 年级进度卡 ---------- */
function renderGradeCards() {
  const d = state.data;
  $("gradeCards").innerHTML = CURRICULUM.map(g => {
    let starSum = 0, done = 0;
    g.units.forEach(u => {
      const p = d.units[u.id];
      if (p) { starSum += p.stars || 0; if ((p.stars || 0) > 0) done++; }
    });
    const pct = Math.round(starSum / (g.units.length * 3) * 100);
    const best = d.gradeTests[g.grade];
    return `
      <div class="grade-card" onclick="goGrade(${g.grade})">
        <div class="grade-header">
          <div class="grade-name" style="color:${g.color}">${g.name}</div>
          <div class="grade-progress-label">⭐ ${starSum}/${g.units.length * 3} · 完成 ${pct}%</div>
        </div>
        <div class="grade-bar-bg"><div class="grade-bar-fill" style="width:${pct}%;background:${g.color}"></div></div>
        <div class="grade-stats">
          <span>📚 ${g.units.length} 个单元</span>
          <span>✅ 已点亮 ${done} 个</span>
          ${best != null ? `<span>📝 测试最佳 ${best} 分</span>` : ""}
        </div>
      </div>`;
  }).join("");
}
function goGrade(grade) { state.gradeTab = grade; showPage("learnView"); }

function quickStart(mode) {
  if (mode === "retrain") return startRetrain();
  const recos = getRecommendations();
  const r = recos.find(x => x.mode === mode) || recos[0];
  if (mode === "test") return startGradeTest(r.grade);
  recoGo(r.grade, r.unitId, mode);
}

/* 年级综合测试：混合该年级全部单元 */
function startGradeTest(gradeNum) {
  const g = CURRICULUM.find(x => x.grade === gradeNum);
  state.selUnit = { grade: g, unit: { id: "mix_g" + gradeNum, title: g.name + "综合测试", icon: "📝" } };
  startQuiz("test", true);
}

/* ===================== 课程页 ===================== */
function renderLearn() {
  $("gradeTabs").innerHTML = CURRICULUM.map(g =>
    `<button class="grade-tab ${state.gradeTab === g.grade ? "active" : ""}" onclick="setGradeTab(${g.grade})">${g.name}</button>`).join("");
  const g = CURRICULUM.find(x => x.grade === state.gradeTab);
  const d = state.data;
  $("unitList").innerHTML = g.units.map(u => {
    const p = d.units[u.id] || {};
    const stars = p.stars || 0;
    return `
      <div class="unit-card ${stars > 0 ? "done" : ""}" onclick="openUnit(${g.grade},'${u.id}')">
        <div class="unit-top"><span class="unit-icon">${u.icon}</span><span class="unit-title">${u.title}</span></div>
        <div class="unit-desc">${u.desc}</div>
        <div class="unit-meta">
          <span>${u.tags.map(t => "#" + t).join(" ")}</span>
          <span class="unit-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}${p.best != null ? ` · 最佳${p.best}分` : ""}</span>
        </div>
      </div>`;
  }).join("");
}
function setGradeTab(gr) { state.gradeTab = gr; renderLearn(); }

/* ---------- 单元弹窗 ---------- */
function openUnit(grade, unitId) {
  const g = CURRICULUM.find(x => x.grade === grade);
  const u = g.units.find(x => x.id === unitId);
  state.selUnit = { grade: g, unit: u };
  const p = state.data.units[u.id] || {};
  $("umHead").innerHTML = `${u.icon} ${u.title}`;
  $("umDesc").textContent = `${g.name} · ${u.desc}`;
  const m = p.modes || {};
  $("umProgress").innerHTML = `
    <div class="unit-stars" style="font-size:1.4rem">${"★".repeat(p.stars || 0)}${"☆".repeat(3 - (p.stars || 0))}</div>
    <div style="font-size:.85rem;color:#718096;margin-top:.3rem">
      ${m.oral ? "⚡口算✓ " : ""}${m.practice ? "✏️练习✓ " : ""}${m.test ? "📝测试✓" : ""}
      ${p.best != null ? ` · 历史最佳 ${p.best} 分 · 挑战 ${p.attempts} 次` : "还没有挑战过，快来试试！"}
    </div>`;
  $("unitModal").classList.add("open");
}
function closeModal(id) { $(id).classList.remove("open"); }
$("unitModal").addEventListener("click", e => { if (e.target === $("unitModal")) closeModal("unitModal"); });

/* ===================== 错题本 ===================== */
/* 收录错题（自动去重；同一题反复错会刷新日期并恢复为未掌握） */
function addWrong(q, unit) {
  const d = state.data;
  const key = stripHtml(q.q) + "||" + q.a;
  const exist = d.wrongs.find(w => w._key === key);
  if (exist) {
    exist.date = todayStr();
    exist.mastered = false;
    return false;
  }
  d.wrongs.unshift({
    _key: key,
    q: q.q, a: q.a, type: q.type, choices: q.choices || null,
    hint: q.hint || null, explain: q.explain || null,
    unitTitle: unit.title, icon: unit.icon || "📗",
    date: todayStr(), mastered: false
  });
  // 容量上限 100：优先删最旧的已掌握，其次最旧的
    if (d.wrongs.length > 100) {
    let idx = -1;
    for (let i = d.wrongs.length - 1; i >= 0; i--) if (d.wrongs[i].mastered) { idx = i; break; }
    d.wrongs.splice(idx >= 0 ? idx : d.wrongs.length - 1, 1);
  }
  return true;
}

/* 渲染错题本页面 */
function renderWrongs() {
  const d = state.data;
  const todo = d.wrongs.filter(w => !w.mastered);
  const done = d.wrongs.filter(w => w.mastered);
  $("wrongSub").textContent = d.wrongs.length
    ? `共收录 ${d.wrongs.length} 道错题 · ${todo.length} 道待攻克 · ${done.length} 道已掌握`
    : "错题本空空如也，做练习时答错的题会自动收录到这里哦～";
  $("retrainBtn").disabled = todo.length === 0;
  $("retrainBtn").style.opacity = todo.length === 0 ? ".5" : "1";
  $("retrainBtn").innerHTML = todo.length ? `▶️ 开始专项重练（${Math.min(todo.length, 10)}题）` : "▶️ 开始专项重练";
  $("clearMasteredBtn").style.display = done.length ? "inline-flex" : "none";

  // 筛选 chips
  const f = state.wrongFilter;
  $("wrongFilter").innerHTML = [
    { k: "todo", t: `待攻克 (${todo.length})` },
    { k: "mastered", t: `已掌握 (${done.length})` },
    { k: "all", t: `全部 (${d.wrongs.length})` }
  ].map(x => `<button class="wf-chip ${f === x.k ? "active" : ""}" onclick="setWrongFilter('${x.k}')">${x.t}</button>`).join("");

  let list = d.wrongs;
  if (f === "todo") list = todo;
  if (f === "mastered") list = done;

  if (!list.length) {
    $("wrongList").innerHTML = `<div class="wrong-empty"><span class="big">${d.wrongs.length ? "🎉" : "📗"}</span>
      ${d.wrongs.length ? "这一类没有错题啦，换个筛选看看？" : "还没有错题，去做一组练习吧！"}</div>`;
    return;
  }
  $("wrongList").innerHTML = list.map((w) => {
    const idx = d.wrongs.indexOf(w);
    return `
    <div class="wrong-row ${w.mastered ? "mastered" : ""}">
      <span style="font-size:1.5rem">${w.icon}</span>
      <div class="wrong-q">${stripHtml(w.q)}</div>
      <span class="wrong-a">✔ ${w.a}</span>
      <span class="wrong-tag">${w.unitTitle}</span>
      <span class="wrong-status ${w.mastered ? "ok" : "todo"}">${w.mastered ? "✅ 已掌握" : "🔴 待攻克"}</span>
      <span class="wrong-date">${w.date}</span>
      <button class="btn btn-ghost" style="padding:.3rem .7rem;font-size:.78rem" onclick="removeWrong(${idx})" title="移出错题本">🗑</button>
    </div>`;
  }).join("");
}
function setWrongFilter(f) { state.wrongFilter = f; renderWrongs(); }
function removeWrong(idx) {
  state.data.wrongs.splice(idx, 1);
  saveData();
  renderWrongs();
}
function clearMastered() {
  state.data.wrongs = state.data.wrongs.filter(w => !w.mastered);
  saveData();
  renderWrongs();
}

/* 专项重练：从未掌握错题中抽取组卷 */
function startRetrain() {
  const d = state.data;
  const todo = d.wrongs.map((w, i) => ({ w, i })).filter(x => !x.w.mastered);
  if (!todo.length) { showPage("wrongView"); return; }
  shuffle(todo);
  const picked = todo.slice(0, 10);
  const qs = picked.map(x => {
    const w = x.w;
    return { q: w.q, a: w.a, type: w.type, choices: w.choices ? shuffle(w.choices) : null, hint: w.hint, explain: w.explain, _widx: x.i };
  });
  state.selUnit = { grade: { grade: 0, name: "错题本" }, unit: { id: "wrongbook", title: "错题专项重练", icon: "📒" } };
  startQuiz("retrain", false, qs);
}

/* ===================== 答题引擎 ===================== */
const MODE_CONF = {
  oral:     { name: "⚡ 口算大挑战", count: Infinity, time: 60,  hint: false },
  practice: { name: "✏️ 数学练习",   count: 10,       time: 0,   hint: true },
  test:     { name: "📝 数学测试",   count: 10,       time: 180, hint: false },
  retrain:  { name: "📒 错题重练",   count: 10,       time: 0,   hint: true }
};

function startQuiz(mode, gradeMixed = false, presetQs = null) {
  closeModal("unitModal");
  const { grade, unit } = state.selUnit;
  const conf = MODE_CONF[mode];
  const isGradeTest = mode === "test" && gradeMixed;
  const qs = [];
  const seen = new Set();

  if (presetQs) {
    presetQs.forEach(q => qs.push(q));
  } else if (isGradeTest) {
    const perUnit = Math.ceil(15 / grade.units.length);
    for (const u of grade.units) {
      let c = 0, g2 = 0;
      while (c < perUnit && g2++ < 30) {
        const q = makeQuestion(u.gen);
        const key = stripHtml(q.q);
        if (seen.has(key)) continue;
        seen.add(key); qs.push(q); c++;
      }
    }
    shuffle(qs);
  } else {
    const n = mode === "oral" ? 40 : conf.count;
    let guard = 0;
    while (qs.length < n && guard++ < n * 8) {
      const q = makeQuestion(unit.gen);
      const key = stripHtml(q.q);
      if (seen.has(key)) continue;
      seen.add(key);
      qs.push(q);
    }
  }
  state.quiz = {
    mode, conf, grade, unit, qs, gradeMixed: isGradeTest,
    idx: 0, correct: 0, streakNow: 0, bestStreak: 0,
    answers: [],
    total: Math.min(isGradeTest ? 15 : conf.count, qs.length),
    timeLeft: isGradeTest ? 300 : conf.time, timerId: null, startAt: Date.now()
  };
  $("quizTitle").textContent = `${conf.name} · ${unit.title}`;
  $("quizTimer").style.display = state.quiz.timeLeft ? "block" : "none";
  showView("quizView");
  if (state.quiz.timeLeft) startTimer();
  renderQuestion();
}

function startTimer() {
  const qz = state.quiz;
  updateTimerText();
  qz.timerId = setInterval(() => {
    qz.timeLeft--;
    updateTimerText();
    if (qz.timeLeft <= 0) { endQuiz(); }
  }, 1000);
}
function updateTimerText() {
  const qz = state.quiz;
  if (!qz) return;
  const t = qz.timeLeft;
  $("quizTimer").textContent = "⏱ " + (t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : t + "s");
  $("quizTimer").style.color = t <= 10 ? "#FF5252" : "";
  // 计时模式同步推进进度条
  if (qz.timeLeft > 0) {
    const totalTime = qz.gradeMixed ? 300 : qz.conf.time;
    $("quizProgressFill").style.width = Math.min(100, (totalTime - t) / totalTime * 100) + "%";
  }
}

function renderQuestion() {
  const qz = state.quiz;
  const q = qz.qs[qz.idx % qz.qs.length];
  qz.cur = q;
  $("quizQ").innerHTML = q.q;
  $("quizFeedback").textContent = "";
  $("quizFeedback").style.color = "";
  $("quizStreak").textContent = qz.streakNow >= 2 ? `🔥 连续答对 ${qz.streakNow} 题！` : "";
  $("hintBtn").style.display = (qz.conf.hint && q.hint) ? "inline-flex" : "none";
  $("hintBtn").disabled = false;
  $("quizSubmit").disabled = false;

  // 进度条：计时模式按时间推进，其余按题数推进
  if (qz.timeLeft) {
    const totalTime = qz.gradeMixed ? 300 : qz.conf.time;
    $("quizProgressFill").style.width = Math.min(100, (totalTime - qz.timeLeft) / totalTime * 100) + "%";
  } else {
    $("quizProgressFill").style.width = Math.min(100, qz.idx / qz.total * 100) + "%";
  }

  if (q.type === "choice") {
    $("quizChoices").style.display = "grid";
    $("quizInputWrap").style.display = "none";
    $("quizSubmit").style.display = "none";
    $("quizChoices").innerHTML = q.choices.map(c =>
      `<button class="choice-btn" onclick="answerChoice(this,'${String(c).replace(/'/g, "\\'")}')">${c}</button>`).join("");
  } else {
    $("quizChoices").style.display = "none";
    $("quizInputWrap").style.display = "block";
    $("quizSubmit").style.display = "inline-flex";
    const inp = $("quizInput");
    inp.value = "";
    setTimeout(() => inp.focus(), 50);
  }
}

/* 数字键盘 */
(function buildKeypad() {
  const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","C"];
  $("keypad").innerHTML = keys.map(k => `<button class="keypad-btn" data-k="${k}">${k}</button>`).join("");
  $("keypad").addEventListener("click", e => {
    const b = e.target.closest(".keypad-btn"); if (!b) return;
    const inp = $("quizInput"), k = b.dataset.k;
    if (k === "C") inp.value = "";
    else if (k === "⌫") inp.value = inp.value.slice(0, -1);
    else if (inp.value.length < 8) inp.value += k;
    inp.focus();
  });
})();
$("quizInput").addEventListener("keydown", e => { if (e.key === "Enter") submitAnswer(); });

function showHint() {
  const qz = state.quiz;
  if (!qz.cur.hint) return;
  $("quizFeedback").textContent = "💡 " + qz.cur.hint;
  $("quizFeedback").style.color = "#B7791F";
  $("hintBtn").disabled = true;
}

/* 选择题作答 */
function answerChoice(btn, val) {
  const qz = state.quiz;
  if (qz.locked) return;
  qz.locked = true;
  const ok = val === qz.cur.a;
  btn.classList.add(ok ? "correct" : "wrong");
  if (!ok) {
    [...$("quizChoices").children].forEach(b => { if (b.textContent === qz.cur.a) b.classList.add("correct"); });
  }
  afterAnswer(ok, val);
}

/* 数字题作答 */
function submitAnswer() {
  const qz = state.quiz;
  if (qz.locked) return;
  const inp = $("quizInput");
  if (inp.value.trim() === "") { inp.classList.add("shake"); setTimeout(() => inp.classList.remove("shake"), 400); return; }
  qz.locked = true;
  const val = inp.value.trim();
  const ok = parseFloat(val) === parseFloat(qz.cur.a);
  afterAnswer(ok, val);
}

function afterAnswer(ok, userVal) {
  const qz = state.quiz;
  const q = qz.cur;
  beep(ok);
  qz.answers.push({ q: q.q, user: userVal, right: q.a, ok });

  // 错题重练：答对立即标记为已掌握，答错恢复为待攻克
  if (qz.mode === "retrain" && q._widx != null) {
    const entry = state.data.wrongs[q._widx];
    if (entry) {
      entry.mastered = ok;
      if (ok) entry.masteredCount = (entry.masteredCount || 0) + 1;
    }
  }

  if (ok) {
    qz.correct++;
    qz.streakNow++;
    qz.bestStreak = Math.max(qz.bestStreak, qz.streakNow);
    $("quizFeedback").textContent = pick(["太棒了！🎉", "答对啦！✨", "真厉害！👏", "完全正确！🌟"]);
    $("quizFeedback").style.color = "#43A047";
  } else {
    qz.streakNow = 0;
    $("quizFeedback").textContent = `正确答案是 ${q.a}${q.explain ? " · " + q.explain : ""}`;
    $("quizFeedback").style.color = "#FF5252";
    $("quizCard").classList.add("shake");
    setTimeout(() => $("quizCard").classList.remove("shake"), 400);
  }

  const isLast = qz.mode !== "oral" && qz.idx + 1 >= qz.total;
  const delay = ok ? (qz.mode === "oral" ? 350 : 700) : 1400;
  setTimeout(() => {
    if (state.quiz !== qz) return; // 已交卷或退出，丢弃回调
    qz.locked = false;
    if (isLast) return endQuiz();
    qz.idx++;
    renderQuestion();
  }, delay);
}

function quitQuiz() {
  if (state.quiz && state.quiz.timerId) clearInterval(state.quiz.timerId);
  state.quiz = null;
  showView("appView");
}

/* ===================== 结算 ===================== */
function endQuiz() {
  const qz = state.quiz;
  if (!qz) return;
  if (qz.timerId) clearInterval(qz.timerId);
  const answered = qz.answers.length;
  const correct = qz.correct;
  const acc = answered ? correct / answered : 0;
  const timeUsed = Math.round((Date.now() - qz.startAt) / 1000);

  // 分数 & 星星
  let score, stars;
  if (qz.mode === "oral") {
    score = correct * 5;
    stars = correct >= 15 ? 3 : correct >= 10 ? 2 : correct >= 5 ? 1 : 0;
  } else {
    score = Math.round(acc * 100);
    stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
  }

  // 写入进度
  const d = state.data;
  if (qz.gradeMixed) {
    // 年级综合测试：记录年级最佳成绩
    const g = qz.grade.grade;
    d.gradeTests[g] = d.gradeTests[g] == null ? score : Math.max(d.gradeTests[g], score);
  } else if (qz.mode === "retrain") {
    // 错题重练：掌握标记已在作答时写入，这里只统计总量
    d.retrainCount = (d.retrainCount || 0) + 1;
  } else {
    const u = d.units[qz.unit.id] = d.units[qz.unit.id] || { stars: 0, best: null, attempts: 0, totalQ: 0, correctQ: 0, modes: {} };
    u.attempts++;
    u.totalQ += answered;
    u.correctQ += correct;
    u.modes[qz.mode] = true;
    u.stars = Math.max(u.stars, stars);
    u.best = u.best == null ? score : Math.max(u.best, score);
  }

  // 收录错题（重练模式的错题不重复收录，由作答逻辑维护状态）
  let newWrongs = 0;
  if (qz.mode !== "retrain") {
    qz.answers.forEach(a => {
      if (!a.ok) {
        const src = qz.qs.find(x => x.q === a.q) || {};
        if (addWrong({ q: a.q, a: a.right, type: src.type || "num", choices: src.choices, hint: src.hint, explain: src.explain }, qz.unit)) newWrongs++;
      }
    });
  }

  d.stars += stars > 0 ? stars : 0;
  d.xp += correct * 2 + stars * 10;
  d.totalQ += answered;
  d.correctQ += correct;
  const t = todayStr();
  d.days[t] = d.days[t] || { q: 0, c: 0 };
  d.days[t].q += answered;
  d.days[t].c += correct;
  saveData();

  // 成就检查
  const newAch = checkAchievements(qz, score, correct, stars);

  // 结果页
  const emoji = stars === 3 ? "🏆" : stars === 2 ? "🎉" : stars === 1 ? "💪" : "🌱";
  const title = qz.mode === "retrain"
    ? (correct === answered ? "错题全部攻克！🎊" : "继续加油，错题快被消灭啦！")
    : (stars === 3 ? "完美通关！" : stars === 2 ? "表现出色！" : stars === 1 ? "继续加油！" : "别灰心，再来一次！");
  $("resultEmoji").textContent = emoji;
  $("resultTitle").textContent = title;
  $("resultStars").innerHTML = "⭐".repeat(stars) + '<span style="opacity:.25">' + "⭐".repeat(3 - stars) + "</span>";
  $("resultScore").textContent = qz.mode === "oral"
    ? `60 秒答对 ${correct} 题 · 得 ${score} 分`
    : `得分 ${score} 分（${correct}/${answered} 题正确）`;
  $("resultDetail").innerHTML = `
    <div>✅ 正确 <b>${correct}</b> 题</div><div>❌ 错误 <b>${answered - correct}</b> 题</div>
    <div>🎯 正确率 <b>${Math.round(acc * 100)}%</b></div><div>⏱ 用时 <b>${timeUsed}s</b></div>
    <div>🔥 最长连对 <b>${qz.bestStreak}</b> 题</div><div>✨ 获得 XP <b>+${correct * 2 + stars * 10}</b></div>`;

  // 错题收录提示
  if (qz.mode === "retrain") {
    const masteredNow = qz.answers.filter(a => a.ok).length;
    $("resultWrongTip").style.display = "block";
    $("resultWrongTip").innerHTML = `📒 本次重练攻克了 <b>${masteredNow}</b> 道错题${answered - correct > 0 ? `，还剩 <b>${answered - correct}</b> 道待继续攻克` : "，太棒了！"}`;
  } else if (newWrongs > 0) {
    $("resultWrongTip").style.display = "block";
    $("resultWrongTip").innerHTML = `📒 <b>${newWrongs}</b> 道错题已自动收入错题本，记得去专项重练哦！`;
  } else {
    $("resultWrongTip").style.display = "none";
  }

  const wrong = qz.answers.filter(a => !a.ok);
  $("resultReview").innerHTML = wrong.length
    ? "<b style='font-size:.9rem'>📖 错题回顾：</b>" + wrong.map(a =>
        `<div class="review-row bad"><span>${stripHtml(a.q)}</span><span style="margin-left:auto;white-space:nowrap">你的答案 <b>${a.user}</b> → 正确 <b style="color:#43A047">${a.right}</b></span></div>`).join("")
    : `<div class="review-row ok">🎊 全部答对，一道错题都没有！</div>`;

  $("resultRetry").onclick = () => {
    if (qz.gradeMixed) return startGradeTest(qz.grade.grade);
    if (qz.mode === "retrain") return startRetrain();
    startQuiz(qz.mode);
  };
  showView("resultView");
  if (stars >= 2) confetti(stars === 3 ? 120 : 60);

  // 成就弹窗（延迟展示）
  if (newAch.length) {
    setTimeout(() => showAchUnlock(newAch[0]), 600);
  }
  state.quiz = null;
}

/* ===================== 成就系统 ===================== */
function unlockAch(id) {
  const d = state.data;
  if (d.ach[id]) return false;
  d.ach[id] = todayStr();
  saveData();
  return true;
}

function checkAchievements(qz, score, correct, stars) {
  const d = state.data;
  const got = [];
  const tryUnlock = id => { if (unlockAch(id)) got.push(ACHIEVEMENTS.find(a => a.id === id)); };

  tryUnlock("first");
  if (qz.mode === "practice" && qz.answers.length === 10 && correct === 10) tryUnlock("perfect10");
  if (qz.mode === "oral" && correct >= 10) tryUnlock("oral_star");
  if (qz.mode === "test" && score === 100) tryUnlock("test_ace");
  if (d.streak >= 3) tryUnlock("streak3");
  if (d.streak >= 7) tryUnlock("streak7");
  if (d.totalQ >= 200) tryUnlock("q200");
  if (d.stars >= 50) tryUnlock("star50");
  if (d.stars >= 200) tryUnlock("star200");
  [1, 2, 3].forEach(gr => {
    const g = CURRICULUM.find(x => x.grade === gr);
    if (g.units.every(u => (d.units[u.id] || {}).stars > 0)) tryUnlock("g" + gr + "_clear");
  });
  const up = d.units[qz.unit.id];
  if (up && up.modes && up.modes.oral && up.modes.practice && up.modes.test) tryUnlock("all_modes");
  // 错题相关
  const masteredTotal = d.wrongs.reduce((s, w) => s + (w.masteredCount || 0), 0);
  if (masteredTotal >= 10) tryUnlock("wrong_10");
  if (d.wrongs.length >= 5 && d.wrongs.every(w => w.mastered)) tryUnlock("wrong_clear");

  return got;
}

function showAchUnlock(ach) {
  $("achUnlockIcon").textContent = ach.icon;
  $("achUnlockName").textContent = ach.name;
  $("achUnlockDesc").textContent = ach.desc;
  $("achModal").classList.add("open");
  confetti(50);
}
function closeAchModal() {
  closeModal("achModal");
  backToLearn(); // 关闭成就弹窗后返回课程页，继续选择其他练习或测试
}
$("achModal").addEventListener("click", e => { if (e.target === $("achModal")) closeAchModal(); });

/* ===================== 成就页 ===================== */
function renderAchievements() {
  const d = state.data;
  const unlocked = Object.keys(d.ach).length;
  $("achCount").textContent = `${unlocked}/${ACHIEVEMENTS.length}`;
  $("achGrid").innerHTML = ACHIEVEMENTS.map(a => {
    const got = d.ach[a.id];
    return `
      <div class="ach-item ${got ? "unlocked" : ""}">
        <div class="ach-icon">${got ? a.icon : "🔒"}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        ${got ? `<div class="ach-date">🎉 ${got} 获得</div>` : ""}
      </div>`;
  }).join("");
}

/* ===================== 统计页 ===================== */
function renderStats() {
  const d = state.data;
  const acc = d.totalQ ? Math.round(d.correctQ / d.totalQ * 100) : 0;
  const studyDays = Object.keys(d.days).length;
  const wrongTodo = d.wrongs.filter(w => !w.mastered).length;
  $("statCards").innerHTML = [
    { n: d.totalQ, l: "累计答题", c: "#4A90E2" },
    { n: acc + "%", l: "总正确率", c: "#43A047" },
    { n: d.stars, l: "累计星星", c: "#F5A623" },
    { n: d.streak, l: "连续学习(天)", c: "#FF7043" },
    { n: studyDays, l: "学习天数", c: "#7E57C2" },
    { n: d.xp, l: "总经验值", c: "#EC407A" },
    { n: d.wrongs.length, l: "错题收录", c: "#E53935" },
    { n: wrongTodo, l: "待攻克错题", c: "#FF8F00" }
  ].map(s => `<div class="stat-card"><div class="stat-num" style="color:${s.c}">${s.n}</div><div class="stat-label">${s.l}</div></div>`).join("");

  // 7天柱状图
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const key = todayStr(dt);
    days.push({ key, label: i === 0 ? "今天" : `${dt.getMonth() + 1}/${dt.getDate()}`, q: (d.days[key] || {}).q || 0 });
  }
  const max = Math.max(...days.map(x => x.q), 5);
  $("weekChart").innerHTML = days.map(x => `
    <div class="bar-col">
      <div style="font-size:.75rem;color:#718096">${x.q || ""}</div>
      <div class="bar" style="height:${Math.round(x.q / max * 120)}px"></div>
      <div class="bar-label">${x.label}</div>
    </div>`).join("");

  // 单元掌握度
  $("unitStats").innerHTML = CURRICULUM.map(g => {
    return `<div style="font-weight:700;margin:.6rem 0 .2rem;color:${g.color}">${g.name}</div>` + g.units.map(u => {
      const p = d.units[u.id];
      const accU = p && p.totalQ ? Math.round(p.correctQ / p.totalQ * 100) : null;
      return `<div class="us-row">
        <span>${u.icon}</span><span class="us-name">${u.title}</span>
        <span class="unit-stars">${"★".repeat((p || {}).stars || 0)}${"☆".repeat(3 - ((p || {}).stars || 0))}</span>
        <div class="us-bar-bg"><div class="us-bar-fill" style="width:${accU == null ? 0 : accU}%;background:${accU == null ? "#EDF2F7" : accU >= 70 ? "var(--s)" : "#FF9800"}"></div></div>
        <span class="us-val">${accU == null ? "未学" : accU + "%"}</span>
      </div>`;
    }).join("");
  }).join("");
}

/* ===================== 装饰背景 ===================== */
(function decor() {
  const icons = ["➕","➖","✖️","➗","🔢","💯","📐","🧮","⭐","🎈"];
  const box = $("bgDecor");
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.textContent = icons[i % icons.length];
    s.style.left = Math.random() * 95 + "vw";
    s.style.top = Math.random() * 90 + "vh";
    s.style.animationDuration = 4 + Math.random() * 5 + "s";
    box.appendChild(s);
  }
})();

/* ===================== 启动：自动登录 ===================== */
(function init() {
  const cur = localStorage.getItem(LS_CUR);
  if (cur && loadUsers()[cur]) {
    state.user = cur;
    state.data = loadData(cur);
    enterApp();
  }
})();
