/* ===================== 题目生成器 ===================== */
/* 每题返回 { q, a, type:'num'|'choice', choices?, hint, explain? }
   type=num  → 数字键盘输入；type=choice → 选择题，a 为正确选项文本 */

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rnd(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/* 生成数字选择题（含正确答案 + 3 个干扰项） */
function numChoice(answer, spread) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    let d = answer + rnd(-spread, spread);
    if (d >= 0 && d !== answer) set.add(d);
  }
  while (set.size < 4) set.add(answer + set.size + rnd(1, 3));
  return shuffle([...set].map(String));
}

const GENERATORS = {
  /* ---------- 一年级 ---------- */
  count20() {
    const n = rnd(4, 20);
    const e = pick(["🍎","🌟","🐤","🎈","🍓","🐠","🌸","🚗"]);
    let row = "";
    for (let i = 0; i < n; i++) row += e + ((i + 1) % 10 === 0 ? "<br>" : "");
    return { q: `数一数，一共有多少个？<br><span style="font-size:1.6rem">${row}</span>`, a: n, type: "num",
      hint: "从左到右一个一个数，数过的做记号，就不会数漏啦。" };
  },
  addSub10() {
    if (Math.random() < 0.5) {
      const a = rnd(1, 9), b = rnd(1, 10 - a);
      return { q: `${a} + ${b} = ?`, a: a + b, type: "num", hint: "可以伸出手指接着数，也可以想凑十。" };
    }
    const a = rnd(2, 10), b = rnd(1, a);
    return { q: `${a} − ${b} = ?`, a: a - b, type: "num", hint: `先想 ${b} + ? = ${a}，倒过来算减法。` };
  },
  addSub20() {
    const kind = Math.random();
    if (kind < 0.4) { // 进位加
      const a = rnd(5, 9), b = rnd(11 - a, 9);
      return { q: `${a} + ${b} = ?`, a: a + b, type: "num", hint: `用凑十法：先把 ${b} 分成 ${10 - a} 和 ${b - (10 - a)}。` };
    } else if (kind < 0.75) { // 退位减
      const a = rnd(11, 18), b = rnd(a - 9 > 1 ? a - 9 : 2, 9);
      return { q: `${a} − ${b} = ?`, a: a - b, type: "num", hint: `破十法：把 ${a} 分成 10 和 ${a - 10}，先算 10 − ${b}。` };
    }
    const a = rnd(10, 20), b = rnd(1, 9);
    return { q: `${a} − ${b} = ?`, a: a - b, type: "num", hint: "把十几分成 10 和几，再算一算。" };
  },
  compare() {
    const style = rnd(1, 3);
    let left, right, la, ra;
    if (style === 1) { la = rnd(3, 20); ra = rnd(3, 20); left = String(la); right = String(ra); }
    else if (style === 2) { const a = rnd(2, 9), b = rnd(1, 8); la = a + b; left = `${a} + ${b}`; ra = rnd(3, 18); right = String(ra); }
    else { const a = rnd(9, 18), b = rnd(2, 8); la = a - b; left = `${a} − ${b}`; ra = rnd(2, 15); right = String(ra); }
    if (la === ra) { ra = ra + 1; right = String(ra); }
    const ans = la > ra ? ">" : "<";
    return { q: `在 ○ 里填上 &gt; 或 &lt;<br><span style="font-size:1.7rem">${left} ○ ${right}</span>`, a: ans, type: "choice",
      choices: [">", "<"], hint: "先分别算出两边的结果，再比一比谁大谁小。大口朝大数！" };
  },
  shapes() {
    const bank = [
      { q: "下面哪个图形有 <b>3 条边、3 个角</b>？", a: "三角形 △", choices: ["三角形 △", "正方形 □", "圆 ●", "长方形 ▭"] },
      { q: "下面哪个图形 <b>4 条边都一样长，4 个角都是直角</b>？", a: "正方形 □", choices: ["长方形 ▭", "正方形 □", "三角形 △", "圆 ●"] },
      { q: "下面哪个图形 <b>没有角</b>？", a: "圆 ●", choices: ["三角形 △", "长方形 ▭", "圆 ●", "正方形 □"] },
      { q: "数学书的封面最像哪个图形？", a: "长方形 ▭", choices: ["圆 ●", "三角形 △", "长方形 ▭", "正方形 □"] },
      { q: "红领巾的形状最像哪个图形？", a: "三角形 △", choices: ["三角形 △", "圆 ●", "正方形 □", "长方形 ▭"] }
    ];
    const it = pick(bank);
    return { q: it.q, a: it.a, type: "choice", choices: shuffle(it.choices), hint: "想一想每个图形的特点：几条边？几个角？" };
  },
  position() {
    const animals = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼"];
    const n = rnd(4, 6);
    const row = shuffle(animals).slice(0, n);
    const idx = rnd(0, n - 1);
    const fromLeft = Math.random() < 0.5;
    const pos = fromLeft ? idx + 1 : n - idx;
    const cn = ["一","二","三","四","五","六"];
    const em = e => `<span class="emoji">${e}</span>`;
    return {
      q: `<span class="emoji-row">${row.map(em).join(" ")}</span>小动物排排队，${em(row[idx])}从<b>${fromLeft ? "左" : "右"}</b>边数排第几？`,
      a: pos, type: "num",
      hint: `从${fromLeft ? "左" : "右"}边开始数：第${cn[0]}、第${cn[1]}…… 一边指一边数。`,
      explain: `从${fromLeft ? "左" : "右"}边数，${row[idx]} 排第 ${pos}。`
    };
  },

  /* ---------- 二年级 ---------- */
  addSub100() {
    if (Math.random() < 0.5) {
      const a = rnd(15, 80), b = rnd(10, 99 - a);
      return { q: `${a} + ${b} = ?`, a: a + b, type: "num", hint: "先加个位，再加十位；个位满十要向十位进 1。" };
    }
    const a = rnd(30, 99), b = rnd(11, a - 5);
    return { q: `${a} − ${b} = ?`, a: a - b, type: "num", hint: "个位不够减时，要向十位借 1 当 10。" };
  },
  mul() {
    const a = rnd(2, 9), b = rnd(2, 9);
    return { q: `${a} × ${b} = ?`, a: a * b, type: "num", hint: `想乘法口诀：${cnNum(a)}${cnNum(b)}${cnNum(a * b)}。` };
  },
  length() {
    const kind = rnd(1, 3);
    if (kind === 1) {
      const m = rnd(1, 9);
      return { q: `${m} 米 = ? 厘米`, a: m * 100, type: "num", hint: "1 米 = 100 厘米。" };
    } else if (kind === 2) {
      const cm = rnd(1, 9) * 100;
      return { q: `${cm} 厘米 = ? 米`, a: cm / 100, type: "num", hint: "100 厘米 = 1 米。" };
    }
    const a = rnd(20, 95), er = rnd(2, 10);
    return { q: `小明的铅笔长 ${a} 厘米，橡皮长 ${er} 厘米，铅笔比橡皮长多少厘米？`, a: a - er, type: "num", hint: "求“长多少”用减法。" };
  },
  angle() {
    const bank = [
      { q: "一个三角形有几个角？", a: "3", type: "num", hint: "三角形 = 三条边 + 三个角。" },
      { q: "长方形有几个直角？", a: "4", type: "num", hint: "长方形的 4 个角都是直角。" },
      { q: "比直角小的角叫什么角？", a: "锐角", type: "choice", choices: ["锐角", "直角", "钝角"], hint: "锐角尖尖小，钝角张开大。" },
      { q: "比直角大的角叫什么角？", a: "钝角", type: "choice", choices: ["锐角", "直角", "钝角"], hint: "钝角张开得比直角大。" },
      { q: "红领巾上有几个钝角？", a: "1", type: "num", hint: "红领巾是三角形，有 1 个钝角和 2 个锐角。" },
      { q: "下面哪个物体的角是直角？", a: "数学书的角", type: "choice", choices: ["数学书的角", "张开的剪刀（很小）", "扇子的边"], hint: "数学书、黑板的角都是直角。" }
    ];
    return pick(bank);
  },
  clock() {
    const kind = rnd(1, 3);
    if (kind === 1) {
      const h = rnd(1, 12);
      return { q: `钟面上时针指着 ${h}，分针指着 12，是几时？`, a: `${h}时`, type: "choice",
        choices: shuffle([`${h}时`, `${h % 12 + 1}时`, `${(h + 10) % 12 + 1}时`, `${h}时半`]), hint: "分针指 12，时针指几就是几时。" };
    } else if (kind === 2) {
      const h = rnd(1, 12);
      return { q: `钟面上时针走过 ${h}，分针指着 6，是几时半？`, a: `${h}时半`, type: "choice",
        choices: shuffle([`${h}时半`, `${h}时`, `${h % 12 + 1}时半`, `12时半`]), hint: "分针指 6 就是半时，时针走过几就是几时半。" };
    }
    const h = rnd(1, 11), m = pick([5, 10, 15, 20, 25]);
    return { q: `早上 ${h}:${String(m).padStart(2, "0")} 上课，过 1 小时是几时几分？`, a: `${h + 1}:${String(m).padStart(2, "0")}`, type: "choice",
      choices: shuffle([`${h + 1}:${String(m).padStart(2, "0")}`, `${h}:${String(m).padStart(2, "0")}`, `${h + 2}:${String(m).padStart(2, "0")}`, `${h + 1}:00`]),
      hint: "过 1 小时，分钟不变，小时加 1。" };
  },
  word2() {
    const kind = rnd(1, 4);
    if (kind === 1) {
      const a = rnd(12, 35), b = rnd(5, 18);
      return { q: `小明有 ${a} 张贴纸，送给小红 ${b} 张，还剩多少张？`, a: a - b, type: "num", hint: "送出去用减法。" };
    } else if (kind === 2) {
      const a = rnd(6, 9), b = rnd(3, 8);
      return { q: `每盒有 ${a} 支彩笔，${b} 盒一共有多少支？`, a: a * b, type: "num", hint: `求几个几用乘法：${a} × ${b}。` };
    } else if (kind === 3) {
      const b = rnd(4, 8), each = rnd(3, 9), a = b * each;
      return { q: `${a} 个苹果平均放进 ${b} 个盘子，每盘放几个？`, a: each, type: "num", hint: `平均分用除法：${a} ÷ ${b}。` };
    }
    const a = rnd(15, 40), b = rnd(8, 20), c = rnd(3, 12);
    return { q: `停车场原来有 ${a} 辆车，开走 ${b} 辆，又开来 ${c} 辆，现在有多少辆？`, a: a - b + c, type: "num", hint: `先算 ${a} − ${b}，再加上 ${c}。` };
  },

  /* ---------- 三年级 ---------- */
  addSub10000() {
    if (Math.random() < 0.5) {
      const a = rnd(200, 5000), b = rnd(100, 4000);
      return { q: `${a} + ${b} = ?`, a: a + b, type: "num", hint: "相同数位对齐，从个位加起，满十进一。" };
    }
    const a = rnd(1000, 9000), b = rnd(200, a - 100);
    return { q: `${a} − ${b} = ?`, a: a - b, type: "num", hint: "相同数位对齐，不够减向前一位借 1 当 10。" };
  },
  mulMulti() {
    const kind = rnd(1, 3);
    if (kind === 1) { const a = rnd(12, 99), b = rnd(2, 9); return { q: `${a} × ${b} = ?`, a: a * b, type: "num", hint: `先算个位 ${a % 10}×${b}，再算十位 ${Math.floor(a / 10)}0×${b}，最后相加。` }; }
    if (kind === 2) { const a = rnd(110, 500), b = rnd(2, 6); return { q: `${a} × ${b} = ?`, a: a * b, type: "num", hint: "把三位数拆成几百、几十、几分别乘，再相加。" }; }
    const b = rnd(3, 9), c = rnd(2, 9);
    return { q: `${b} × ${c} × 10 = ?`, a: b * c * 10, type: "num", hint: `先算 ${b} × ${c}，再在结果末尾添一个 0。` };
  },
  div() {
    const kind = rnd(1, 3);
    if (kind === 1) { const b = rnd(2, 9), q = rnd(2, 9); return { q: `${b * q} ÷ ${b} = ?`, a: q, type: "num", hint: `想乘法口诀：${cnNum(b)}${cnNum(q)}${cnNum(b * q)}。` }; }
    if (kind === 2) { const b = rnd(2, 6), q = rnd(12, 60); return { q: `${b * q} ÷ ${b} = ?`, a: q, type: "num", hint: "从最高位除起，除到哪一位商就写在哪一位上。" }; }
    const b = rnd(2, 9), q = rnd(3, 9), r = rnd(1, b - 1);
    return { q: `${b * q + r} ÷ ${b} = ? （商是多少？余数不用写）`, a: q, type: "num", hint: `先想 ${b} 乘几最接近但不超过被除数。` };
  },
  fraction() {
    const kind = rnd(1, 3);
    if (kind === 1) {
      const d = pick([2, 3, 4, 6, 8]);
      return { q: `把一个蛋糕平均分成 ${d} 份，每份是它的几分之一？`, a: `1/${d}`, type: "choice",
        choices: shuffle([`1/${d}`, `1/${d === 2 ? 4 : d - 1}`, `${d}/1`, `1/${d + 2}`]), hint: "平均分成几份，每份就是几分之一。" };
    } else if (kind === 2) {
      const a = pick([2, 4, 6, 8]), b = pick([3, 5, 7, 9]);
      const ans = a < b ? `1/${a}` : `1/${b}`;
      return { q: `比一比：1/${a} ○ 1/${b}，哪个更大？`, a: ans, type: "choice",
        choices: shuffle([`1/${a}`, `1/${b}`]), hint: "分的份数越少，每一份就越大！" };
    }
    const d = pick([4, 6, 8]), n = rnd(2, d - 1);
    return { q: `一张纸条平均分成 ${d} 份，涂色 ${n} 份，涂色部分是几分之几？`, a: `${n}/${d}`, type: "choice",
      choices: shuffle([`${n}/${d}`, `${d}/${n}`, `${n - 1}/${d}`, `1/${d}`]), hint: `分母是 ${d}（总份数），分子是 ${n}（涂色份数）。` };
  },
  periArea() {
    const kind = rnd(1, 4);
    if (kind === 1) { const w = rnd(2, 12), h = rnd(2, 12); return { q: `长方形长 ${Math.max(w, h)} 厘米，宽 ${Math.min(w, h)} 厘米，周长是多少厘米？`, a: 2 * (w + h), type: "num", hint: "长方形周长 =（长 + 宽）× 2。" }; }
    if (kind === 2) { const s = rnd(2, 12); return { q: `正方形边长 ${s} 厘米，周长是多少厘米？`, a: 4 * s, type: "num", hint: "正方形周长 = 边长 × 4。" }; }
    if (kind === 3) { const w = rnd(2, 12), h = rnd(2, 12); return { q: `长方形长 ${Math.max(w, h)} 厘米，宽 ${Math.min(w, h)} 厘米，面积是多少平方厘米？`, a: w * h, type: "num", hint: "长方形面积 = 长 × 宽。" }; }
    const s = rnd(2, 12); return { q: `正方形边长 ${s} 分米，面积是多少平方分米？`, a: s * s, type: "num", hint: "正方形面积 = 边长 × 边长。" };
  },
  decimal() {
    const kind = rnd(1, 3);
    if (kind === 1) {
      const a = rnd(1, 9) / 10 + rnd(0, 9), b = rnd(1, 9) / 10 + rnd(0, 5);
      const s = (Math.round(a * 10) + Math.round(b * 10)) / 10;
      return { q: `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, a: s.toFixed(1), type: "choice",
        choices: numChoice(parseFloat(s.toFixed(1)), 3).map(v => parseFloat(v).toFixed(1)), hint: "小数点对齐，像整数一样相加，满十进一。" };
    } else if (kind === 2) {
      const a = rnd(25, 98) / 10, b = rnd(5, Math.floor(a * 10) - 5) / 10;
      const s = (Math.round(a * 10) - Math.round(b * 10)) / 10;
      return { q: `${a.toFixed(1)} − ${b.toFixed(1)} = ?`, a: s.toFixed(1), type: "choice",
        choices: numChoice(parseFloat(s.toFixed(1)), 3).map(v => parseFloat(v).toFixed(1)), hint: "小数点对齐再减，不够减向前借 1。" };
    }
    const a = rnd(11, 99) / 10, b = rnd(11, 99) / 10;
    if (a === b) return GENERATORS.decimal();
    return { q: `比一比：${a.toFixed(1)} ○ ${b.toFixed(1)}`, a: a > b ? ">" : "<", type: "choice",
      choices: [">", "<"], hint: "先比整数部分，整数部分相同再比小数部分。" };
  },
  calendar() {
    const bank = [
      { q: "一年有几个月？", a: "12", type: "num", hint: "从 1 月数到 12 月。" },
      { q: "下面哪个月是大月（31天）？", a: "7月", type: "choice", choices: shuffle(["7月", "4月", "6月", "9月"]), hint: "一三五七八十腊，三十一天永不差。" },
      { q: "下面哪个月是小月（30天）？", a: "6月", type: "choice", choices: shuffle(["6月", "1月", "3月", "8月"]), hint: "4、6、9、11 月是小月。" },
      { q: "平年的 2 月有多少天？", a: "28", type: "num", hint: "平年 2 月 28 天，闰年 2 月 29 天。" },
      { q: "平年全年有多少天？", a: "365", type: "num", hint: "平年 365 天，闰年 366 天。" },
      { q: "2024 年是闰年，它的 2 月有多少天？", a: "29", type: "num", hint: "闰年 2 月有 29 天。" },
      { q: "儿童节是 6 月 1 日，前一天是几月几日？", a: "5月31日", type: "choice", choices: shuffle(["5月31日", "5月30日", "5月29日", "6月2日"]), hint: "5 月是大月，有 31 天。" }
    ];
    return pick(bank);
  },
  word3() {
    const kind = rnd(1, 4);
    if (kind === 1) {
      const each = rnd(4, 9), box = rnd(3, 8);
      return { q: `每盒装 ${each} 个月饼，${box} 盒一共装多少个月饼？`, a: each * box, type: "num", hint: "求几个几用乘法：每盒个数 × 盒数。" };
    } else if (kind === 2) {
      const per = rnd(3, 9), groups = rnd(2, 6);
      return { q: `学校买来 ${per * groups * 10} 本图书，平均分给 ${groups} 个班，每个班分到多少本？`, a: per * 10, type: "num", hint: `平均分用除法：${per * groups * 10} ÷ ${groups}。` };
    } else if (kind === 3) {
      const a = rnd(120, 400), b = rnd(50, 200);
      return { q: `果园里有苹果树 ${a} 棵，梨树比苹果树少 ${b} 棵，两种树一共有多少棵？`, a: a - b + a, type: "num", hint: `先求梨树：${a} − ${b}，再加上苹果树。` };
    }
    const w = rnd(3, 9), l = w + rnd(1, 5);
    return { q: `一块长方形菜地长 ${l} 米，宽 ${w} 米，四周围上篱笆，篱笆长多少米？`, a: 2 * (l + w), type: "num", hint: "篱笆长就是长方形的周长。" };
  }
};

/* ---------- 进阶练习：分步解题（凑十法 / 破十法） ---------- */
/* 初级：20以内加减法（进位加 + 退位减，结果不超过 20） */
function advAddA() {
  let a = 0, b = 0, need = 0, rest = 0, guard = 0;
  do {
    a = rnd(5, 9);
    need = 10 - a;                       // 还差几凑成 10
    const maxB = Math.min(9, 20 - a);    // 和不超过 20
    if (maxB <= need) continue;
    b = rnd(need + 1, maxB);
    rest = b - need;
  } while (!b && guard++ < 200);
  const ten = a + need, sum = a + b;
  return {
    q: `${a} + ${b} = ?`, a: sum, type: "num", method: "凑十法",
    hint: `凑十法：把 ${b} 分成 ${need} 和 ${rest}。`,
    explain: `${a} + ${need} = ${ten}，${ten} + ${rest} = ${sum}。`,
    steps: [
      { prompt: `${a} 再添 {} 就到 ${ten}`, ans: need },
      { prompt: `把 ${b} 分成 ${need} 和 {}`, ans: rest },
      { prompt: `${a} + ${need} = {}`, ans: ten },
      { prompt: `${ten} + ${rest} = {}`, ans: sum }
    ]
  };
}

/* 进阶：两位数 ± 两位数 */
function advAddB() {
  let a = 0, b = 0, need = 0, rest = 0, guard = 0;
  do {
    a = rnd(11, 26);
    const o = a % 10;
    if (o === 0) continue;
    need = 10 - o;
    const minB = Math.max(10, need + 1);
    const maxB = 40 - a;
    if (maxB < minB) continue;
    b = rnd(minB, maxB);
    rest = b - need;
    if (rest < 1 || a + b > 40) b = 0;
  } while (!b && guard++ < 300);
  const ten = a + need, sum = a + b;
  return {
    q: `${a} + ${b} = ?`, a: sum, type: "num", method: "凑十法",
    hint: `凑十法：把 ${b} 分成 ${need} 和 ${rest}。`,
    explain: `${a} + ${need} = ${ten}，${ten} + ${rest} = ${sum}。`,
    steps: [
      { prompt: `${a} 再添 {} 就到 ${ten}`, ans: need },
      { prompt: `把 ${b} 分成 ${need} 和 {}`, ans: rest },
      { prompt: `${a} + ${need} = {}`, ans: ten },
      { prompt: `${ten} + ${rest} = {}`, ans: sum }
    ]
  };
}

/* 破十法拆分：把 a 分成 (整十部分) 和 (10 + 个位) */
function advSplit(a) {
  const o = a % 10;
  if (a < 20) return { q: o, r: 10 };                       // 13 → 3 和 10
  return { q: (Math.floor(a / 10) - 1) * 10, r: 10 + o };   // 32 → 20 和 12
}

function advSubA() {
  let a = 0, b = 0, guard = 0;
  do {
    a = rnd(11, 18);                   // 十几减几，结果在 20 以内
    const o = a % 10;
    if (o === 0 || o >= 9) continue;   // 个位必须不够减
    b = rnd(o + 1, 9);
  } while (!b && guard++ < 200);
  const { q: q10, r: r10 } = advSplit(a);
  const res = r10 - b, ans = q10 + res;
  return {
    q: `${a} − ${b} = ?`, a: ans, type: "num", method: "破十法",
    hint: `破十法：把 ${a} 分成 ${q10} 和 ${r10}，先算 ${r10} − ${b}。`,
    explain: `${r10} − ${b} = ${res}，${q10} + ${res} = ${ans}。`,
    steps: [
      { prompt: `把 ${a} 分成 ${q10} 和 {}`, ans: r10 },
      { prompt: `${r10} − ${b} = {}`, ans: res },
      { prompt: `${q10} + ${res} = {}`, ans: ans }
    ]
  };
}

function advSubB() {
  let a = 0, b = 0, guard = 0;
  do {
    a = rnd(20, 40);
    const oa = a % 10;
    b = rnd(10, a - 1);
    const ob = b % 10;
    if (!(oa < ob)) b = 0;             // 个位不够减，才用破十法
  } while (!b && guard++ < 300);
  const oa = a % 10, ob = b % 10;
  const qA = (Math.floor(a / 10) - 1) * 10, rA = 10 + oa;   // 35 → 20 和 15
  const qB = Math.floor(b / 10) * 10;                       // 17 → 10 和 7
  const resOnes = rA - ob, resTens = qA - qB;
  const ans = resTens + resOnes;
  return {
    q: `${a} − ${b} = ?`, a: ans, type: "num", method: "破十法",
    hint: `破十法：把 ${a} 分成 ${qA} 和 ${rA}，把 ${b} 分成 ${qB} 和 ${ob}。`,
    explain: `${rA} − ${ob} = ${resOnes}，${qA} − ${qB} = ${resTens}，${resTens} + ${resOnes} = ${ans}。`,
    steps: [
      { prompt: `把 ${a} 分成 ${qA} 和 {}`, ans: rA },
      { prompt: `把 ${b} 分成 ${qB} 和 {}`, ans: ob },
      { prompt: `${rA} − ${ob} = {}`, ans: resOnes },
      { prompt: `${qA} − ${qB} = ${resTens}，${resTens} + ${resOnes} = {}`, ans: ans }
    ]
  };
}

const ADVANCE_GENERATORS = {
  a: { add: advAddA, sub: advSubA },
  b: { add: advAddB, sub: advSubB }
};

function cnNum(n) {
  const cn = ["零","一","二","三","四","五","六","七","八","九","十"];
  if (n <= 10) return cn[n];
  if (n < 20) return "十" + cn[n - 10];
  if (n < 100) { const t = Math.floor(n / 10), o = n % 10; return cn[t] + "十" + (o ? cn[o] : ""); }
  return String(n);
}

/* 统一入口：按单元 gen key 出题 */
function makeQuestion(genKey) {
  const fn = GENERATORS[genKey];
  const q = fn();
  if (q.type === "num") q.a = String(q.a);
  return q;
}
