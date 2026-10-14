/* ===================== 课程体系数据 ===================== */
/* 每个单元 gen 对应 js/gen.js 中的生成器，支持 oral(口算)/practice(练习)/test(测试) 三种模式 */
const CURRICULUM = [
  {
    grade: 1,
    name: "一年级",
    color: "#4A90E2",
    units: [
      { id: "g1u1", title: "认识数字 1-20", icon: "🔢", desc: "数一数、读一读、写一写生活中的数字", gen: "count20", tags: ["数感"] },
      { id: "g1u2", title: "10以内加减法", icon: "🍎", desc: "用水果和小动物学加减，打好计算基础", gen: "addSub10", tags: ["计算"] },
      { id: "g1u3", title: "20以内加减法", icon: "🚀", desc: "进位加、退位减，成为口算小能手", gen: "addSub20", tags: ["计算"] },
      { id: "g1u4", title: "比一比", icon: "⚖️", desc: "比大小、比多少、认识 > < =", gen: "compare", tags: ["逻辑"] },
      { id: "g1u5", title: "认识图形", icon: "🔷", desc: "长方形、正方形、三角形和圆", gen: "shapes", tags: ["几何"] },
      { id: "g1u6", title: "位置与顺序", icon: "🐣", desc: "上下左右、第几个，方向感大挑战", gen: "position", tags: ["逻辑"] }
    ]
  },
  {
    grade: 2,
    name: "二年级",
    color: "#43A047",
    units: [
      { id: "g2u1", title: "100以内加减法", icon: "🧮", desc: "两位数加减，进位退位都不怕", gen: "addSub100", tags: ["计算"] },
      { id: "g2u2", title: "表内乘法", icon: "✖️", desc: "乘法口诀大闯关，背熟九九乘法表", gen: "mul", tags: ["计算"] },
      { id: "g2u3", title: "长度单位", icon: "📏", desc: "认识厘米和米，学会测量与换算", gen: "length", tags: ["测量"] },
      { id: "g2u4", title: "角的初步认识", icon: "📐", desc: "直角、锐角、钝角，图形里的秘密", gen: "angle", tags: ["几何"] },
      { id: "g2u5", title: "认识时间", icon: "🕐", desc: "时针分针转一转，读出正确时间", gen: "clock", tags: ["生活"] },
      { id: "g2u6", title: "简单应用题", icon: "🧩", desc: "把数学用到生活里，解决小问题", gen: "word2", tags: ["应用"] }
    ]
  },
  {
    grade: 3,
    name: "三年级",
    color: "#7E57C2",
    units: [
      { id: "g3u1", title: "万以内加减法", icon: "🏔️", desc: "三四位数加减，挑战大数计算", gen: "addSub10000", tags: ["计算"] },
      { id: "g3u2", title: "多位数乘一位数", icon: "🎯", desc: "两位数、三位数乘一位数", gen: "mulMulti", tags: ["计算"] },
      { id: "g3u3", title: "除数是一位数的除法", icon: "➗", desc: "平均分一分，掌握除法竖式基础", gen: "div", tags: ["计算"] },
      { id: "g3u4", title: "分数的初步认识", icon: "🍰", desc: "几分之一、几分之几，蛋糕分着吃", gen: "fraction", tags: ["数感"] },
      { id: "g3u5", title: "周长与面积", icon: "🏞️", desc: "长方形正方形的周长和面积", gen: "periArea", tags: ["几何"] },
      { id: "g3u6", title: "小数的初步认识", icon: "💧", desc: "认识一位小数，会比大小会计算", gen: "decimal", tags: ["数感"] },
      { id: "g3u7", title: "年、月、日", icon: "📅", desc: "大月小月、平年闰年，时间小百科", gen: "calendar", tags: ["生活"] },
      { id: "g3u8", title: "解决问题", icon: "🧠", desc: "两步计算应用题，逻辑思维升级", gen: "word3", tags: ["应用"] }
    ]
  }
];

/* ===================== 等级体系 ===================== */
const LEVELS = [
  { lv: 1, name: "数学小苗",   xp: 0 },
  { lv: 2, name: "数学新星",   xp: 100 },
  { lv: 3, name: "计算小能手", xp: 250 },
  { lv: 4, name: "数学小达人", xp: 500 },
  { lv: 5, name: "数学小硕士", xp: 900 },
  { lv: 6, name: "数学小博士", xp: 1500 },
  { lv: 7, name: "数学王者",   xp: 2500 }
];

/* ===================== 成就体系 ===================== */
const ACHIEVEMENTS = [
  { id: "welcome",    icon: "🎒", name: "初入王国",   desc: "注册并第一次登录" },
  { id: "first",      icon: "🌱", name: "小试牛刀",   desc: "完成第一次练习" },
  { id: "perfect10",  icon: "💯", name: "十全十美",   desc: "单次练习10题全对" },
  { id: "oral_star",  icon: "⚡", name: "口算小闪电", desc: "口算60秒答对10题以上" },
  { id: "test_ace",   icon: "🥇", name: "满分学霸",   desc: "任意测试获得满分" },
  { id: "streak3",    icon: "🔥", name: "三日坚持",   desc: "连续学习3天" },
  { id: "streak7",    icon: "🌈", name: "七日之约",   desc: "连续学习7天" },
  { id: "q200",       icon: "🏋️", name: "勤奋小蜜蜂", desc: "累计答题200道" },
  { id: "star50",     icon: "⭐", name: "摘星手",     desc: "累计获得50颗星星" },
  { id: "star200",    icon: "🌟", name: "星河收藏家", desc: "累计获得200颗星星" },
  { id: "g1_clear",   icon: "🎖️", name: "一年级通关", desc: "一年级所有单元均获得星星" },
  { id: "g2_clear",   icon: "🏅", name: "二年级通关", desc: "二年级所有单元均获得星星" },
  { id: "g3_clear",   icon: "👑", name: "三年级通关", desc: "三年级所有单元均获得星星" },
  { id: "all_modes",  icon: "🎓", name: "全能小将",   desc: "同一单元完成口算、练习、测试三种模式" },
  { id: "wrong_10",   icon: "📒", name: "知错就改",   desc: "攻克错题本中10道错题" },
  { id: "wrong_clear",icon: "🧹", name: "错题清零",   desc: "错题本中所有错题全部掌握" }
];

const AVATARS = ["🧒","👧","👦","🐼","🦊","🐯","🐰","🐨","🦁","🐸"];
