/* ============================================================
 * 错题本功能 · 单元测试
 * 运行：node wrongbook.test.js
 * 原理：Node 内置 vm 模块加载真实前端源码（js/data.js、js/gen.js、js/app.js），
 *       以最小 DOM / localStorage 桩替代浏览器环境，零外部依赖。
 * ============================================================ */
"use strict";
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

/* ---------------- 浏览器环境桩 ---------------- */
function makeEl() {
  return {
    innerHTML: "", textContent: "", value: "", className: "", disabled: false,
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, remove() {}, focus() {}, click() {},
    closest() { return null; },
    querySelectorAll() { return []; }
  };
}
const els = {};
const documentStub = {
  getElementById(id) { return els[id] || (els[id] = makeEl()); },
  querySelectorAll() { return []; },
  createElement() { return makeEl(); },
  addEventListener() {},
  body: makeEl()
};
const storage = new Map();
const localStorageStub = {
  getItem: k => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: k => storage.delete(k)
};

const sandbox = {
  document: documentStub,
  localStorage: localStorageStub,
  console,
  btoa: s => Buffer.from(s).toString("base64"),
  setTimeout: () => 0, clearTimeout: () => {},   // 关闭异步回调，只测同步逻辑
  setInterval: () => 0, clearInterval: () => {}
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);

/* 加载真实源码（顺序与 index.html 一致） */
const ROOT = __dirname;
for (const f of ["js/data.js", "js/gen.js", "js/app.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
const run = code => vm.runInContext(code, ctx);

/* 每个用例前重置用户数据 */
function reset() {
  run(`state.user = "tester"; state.data = blankData(); state.quiz = null;`);
}
const addOne = key => run(
  `addWrong({q:${JSON.stringify(key)}, a:'2', type:'num'}, {title:'10以内加减法', icon:'🍎'})`
);

/* ---------------- 测试用例 ---------------- */
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("blankData 初始化包含空错题本", () => {
  reset();
  assert.strictEqual(run(`Array.isArray(state.data.wrongs)`), true);
  assert.strictEqual(run(`state.data.wrongs.length`), 0);
});

test("addWrong 新增错题：字段完整、默认待攻克", () => {
  reset();
  addOne("1 + 1 = ?");
  const w = run(`state.data.wrongs[0]`);
  assert.strictEqual(run(`state.data.wrongs.length`), 1);
  assert.strictEqual(w.a, "2");
  assert.strictEqual(w.type, "num");
  assert.strictEqual(w.unitTitle, "10以内加减法");
  assert.strictEqual(w.mastered, false);
  assert.ok(w.date, "应记录收录日期");
  assert.ok(w._key.includes("1 + 1 = ?"), "应生成去重键");
});

test("addWrong 去重：同一题重复收录不增加数量，且重置为待攻克", () => {
  reset();
  addOne("1 + 1 = ?");
  run(`state.data.wrongs[0].mastered = true`);
  addOne("1 + 1 = ?"); // 同一道题再错一次
  assert.strictEqual(run(`state.data.wrongs.length`), 1, "同题不应重复收录");
  assert.strictEqual(run(`state.data.wrongs[0].mastered`), false, "再错应恢复为待攻克");
});

test("addWrong 容量上限 100：超出时优先淘汰最旧的已掌握", () => {
  reset();
  run(`for (let i = 0; i < 105; i++) addWrong({q:'q'+i, a:String(i), type:'num'}, {title:'u', icon:'📗'})`);
  assert.strictEqual(run(`state.data.wrongs.length`), 100, "总数不得超过 100");
  assert.ok(!run(`state.data.wrongs.some(w => w._key.startsWith('q0||'))`), "最旧的应被淘汰");
  assert.ok(run(`state.data.wrongs.some(w => w._key.startsWith('q104||'))`), "最新的应保留");
  // 标记 5 条为已掌握，再收录 5 条 → 已掌握的被优先淘汰
  run(`for (let i = 10; i < 15; i++) state.data.wrongs[i].mastered = true`);
  run(`for (let i = 200; i < 205; i++) addWrong({q:'q'+i, a:String(i), type:'num'}, {title:'u', icon:'📗'})`);
  assert.strictEqual(run(`state.data.wrongs.length`), 100);
  assert.strictEqual(run(`state.data.wrongs.filter(w => w.mastered).length`), 0, "已掌握应被优先淘汰");
});

test("endQuiz 练习模式：答错的题自动收录进错题本", () => {
  reset();
  run(`
    const unit = {id:'g1u2', title:'10以内加减法', icon:'🍎'};
    state.selUnit = { grade:{grade:1, name:'一年级'}, unit };
    state.quiz = {
      mode:'practice', conf: MODE_CONF.practice, grade: state.selUnit.grade, unit,
      qs:[{q:'1 + 1 = ?',a:'2',type:'num'},{q:'3 + 4 = ?',a:'7',type:'num'}],
      gradeMixed:false, idx:9, correct:0, streakNow:0, bestStreak:0,
      answers:[
        {q:'1 + 1 = ?', user:'5', right:'2', ok:false},
        {q:'3 + 4 = ?', user:'0', right:'7', ok:false},
        {q:'2 + 2 = ?', user:'4', right:'4', ok:true}
      ],
      total:10, timeLeft:0, timerId:null, startAt:Date.now()-30000, locked:false, cur:null
    };
    endQuiz();
  `);
  assert.strictEqual(run(`state.data.wrongs.length`), 2, "答错 2 题应收录 2 条");
  assert.ok(run(`state.data.wrongs.every(w => !w.mastered)`));
  assert.ok(run(`state.data.wrongs.every(w => w.unitTitle === '10以内加减法')`));
  assert.strictEqual(run(`state.quiz`), null, "交卷后答题状态应清空");
});

test("endQuiz 重练模式：答错不重复收录", () => {
  reset();
  run(`
    state.data.wrongs = [{_key:'k1', q:'1 + 1 = ?', a:'2', type:'num', unitTitle:'u', icon:'📗', date:'2026-01-01', mastered:false}];
    state.selUnit = { grade:{grade:0, name:'错题本'}, unit:{id:'wrongbook', title:'错题专项重练', icon:'📒'} };
    state.quiz = {
      mode:'retrain', conf: MODE_CONF.retrain, grade: state.selUnit.grade, unit: state.selUnit.unit,
      qs:[{q:'1 + 1 = ?', a:'2', type:'num', _widx:0}],
      gradeMixed:false, idx:0, correct:0, streakNow:0, bestStreak:0,
      answers:[{q:'1 + 1 = ?', user:'9', right:'2', ok:false}],
      total:1, timeLeft:0, timerId:null, startAt:Date.now()-10000, locked:false, cur:null
    };
    endQuiz();
  `);
  assert.strictEqual(run(`state.data.wrongs.length`), 1, "重练答错不应产生新条目");
});

test("专项重练：答对后该题标记为已掌握", () => {
  reset();
  run(`
    state.data.wrongs = [
      {_key:'k1', q:'1 + 1 = ?', a:'2', type:'num', unitTitle:'u', icon:'📗', date:'2026-01-01', mastered:false},
      {_key:'k2', q:'3 + 4 = ?', a:'7', type:'num', unitTitle:'u', icon:'📗', date:'2026-01-01', mastered:false}
    ];
    state.selUnit = { grade:{grade:0, name:'错题本'}, unit:{id:'wrongbook', title:'错题专项重练', icon:'📒'} };
    startRetrain();
  `);
  const idx = run(`(() => {
    const qz = state.quiz;
    qz.total = 99;               // 防止触发交卷
    qz.cur = qz.qs[0];
    qz.locked = false;
    const i = qz.qs[0]._widx;
    afterAnswer(true, qz.qs[0].a);
    return i;
  })()`);
  assert.strictEqual(run(`state.data.wrongs[${idx}].mastered`), true, "答对应标记已掌握");
  assert.strictEqual(run(`state.data.wrongs[${idx}].masteredCount`), 1, "应累计攻克次数");
});

test("专项重练：答错后保持待攻克", () => {
  reset();
  run(`
    state.data.wrongs = [{_key:'k1', q:'1 + 1 = ?', a:'2', type:'num', unitTitle:'u', icon:'📗', date:'2026-01-01', mastered:false}];
    state.selUnit = { grade:{grade:0, name:'错题本'}, unit:{id:'wrongbook', title:'错题专项重练', icon:'📒'} };
    startRetrain();
  `);
  run(`(() => {
    const qz = state.quiz;
    qz.total = 99;
    qz.cur = qz.qs[0];
    qz.locked = false;
    afterAnswer(false, '999');
  })()`);
  assert.strictEqual(run(`state.data.wrongs[0].mastered`), false);
});

test("startRetrain 组卷：最多 10 题且每题带来源索引 _widx", () => {
  reset();
  run(`
    for (let i = 0; i < 15; i++) addWrong({q:'q'+i, a:String(i), type:'num'}, {title:'u', icon:'📗'});
    state.selUnit = { grade:{grade:0, name:'错题本'}, unit:{id:'wrongbook', title:'错题专项重练', icon:'📒'} };
    startRetrain();
  `);
  assert.strictEqual(run(`state.quiz.qs.length`), 10, "最多抽 10 题");
  assert.ok(run(`state.quiz.qs.every(q => typeof q._widx === 'number')`), "每题应有 _widx");
  assert.strictEqual(run(`state.quiz.mode`), "retrain");
});

test("clearMastered 清空已掌握，保留待攻克", () => {
  reset();
  run(`
    addWrong({q:'q1', a:'1', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q2', a:'2', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q3', a:'3', type:'num'}, {title:'u', icon:'📗'});
    state.data.wrongs[0].mastered = true;
    state.data.wrongs[2].mastered = true;
    clearMastered();
  `);
  assert.strictEqual(run(`state.data.wrongs.length`), 1);
  assert.strictEqual(run(`state.data.wrongs[0]._key.startsWith('q2')`), true, "只剩待攻克那道");
});

test("removeWrong 删除指定错题", () => {
  reset();
  run(`
    addWrong({q:'q1', a:'1', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q2', a:'2', type:'num'}, {title:'u', icon:'📗'});
    removeWrong(0); // q2 在最前（unshift）
  `);
  assert.strictEqual(run(`state.data.wrongs.length`), 1);
  assert.ok(run(`state.data.wrongs[0]._key.startsWith('q1')`));
});

test("个性化推荐：待攻克错题 ≥3 时推荐错题重练", () => {
  reset();
  run(`
    state.data.totalQ = 5;
    addWrong({q:'q1', a:'1', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q2', a:'2', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q3', a:'3', type:'num'}, {title:'u', icon:'📗'});
  `);
  const recos = run(`getRecommendations()`);
  assert.ok(recos.some(r => r.mode === "retrain"), "应包含错题重练推荐");
});

test("renderWrongs 渲染：副标题统计正确、按钮状态联动", () => {
  reset();
  run(`
    addWrong({q:'q1', a:'1', type:'num'}, {title:'u', icon:'📗'});
    addWrong({q:'q2', a:'2', type:'num'}, {title:'u', icon:'📗'});
    state.data.wrongs[0].mastered = true;
    renderWrongs();
  `);
  const sub = run(`document.getElementById('wrongSub').textContent`);
  assert.ok(sub.includes("共收录 2"), sub);
  assert.ok(sub.includes("1 道待攻克"), sub);
  assert.ok(sub.includes("1 道已掌握"), sub);
  assert.strictEqual(run(`document.getElementById('retrainBtn').disabled`), false, "有待攻克时按钮可用");
  // 全部掌握后按钮禁用
  run(`state.data.wrongs.forEach(w => w.mastered = true); renderWrongs();`);
  assert.strictEqual(run(`document.getElementById('retrainBtn').disabled`), true, "无待攻克时按钮禁用");
});

/* ---------------- 运行 ---------------- */
console.log("\n📒 错题本功能 · 单元测试\n");
let pass = 0, fail = 0;
for (const t of tests) {
  try { t.fn(); console.log("  ✓ " + t.name); pass++; }
  catch (e) { console.error("  ✗ " + t.name + "\n      " + e.message); fail++; }
}
console.log(`\n结果：${pass} 通过，${fail} 失败，共 ${tests.length} 个用例\n`);
process.exit(fail ? 1 : 0);
