/**
 * icons.js —— SVG 图标路径定义与辅助函数
 */
var CATS = ['校园卡','钥匙','耳机','雨伞','书籍','证件','水杯','其他'];

var ICON = {
  '校园卡':'<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 9.5h19"/><rect x="6" y="13" width="5" height="3.4" rx="1"/>',
  '钥匙':'<circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M18.5 18.5l2-2"/>',
  '耳机':'<path d="M5 13v-1.5a7 7 0 0114 0V13"/><rect x="3" y="12.5" width="4" height="6.5" rx="1.8"/><rect x="17" y="12.5" width="4" height="6.5" rx="1.8"/>',
  '雨伞':'<path d="M3.5 12.5a8.5 8.5 0 0117 0z"/><path d="M12 3.2v1M12 12.5v6a2.2 2.2 0 004.4 0"/>',
  '书籍':'<path d="M4 5.5A2 2 0 016 3.5h12v17H6a2 2 0 00-2 2z"/><path d="M4 5.5v15M18 3.5v17"/>',
  '证件':'<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.6 16.5c.6-1.7 2-2.6 3.4-2.6s2.8.9 3.4 2.6M15 10h4M15 13h3"/>',
  '水杯':'<path d="M7 4h9l-1 16H8z"/><path d="M6.4 8.5h10.2"/>',
  '其他':'<path d="M4 8.5L12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5l8 4.5 8-4.5M12 13v7"/>',
  'search':'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  'pin':'<path d="M12 21s6.5-6.1 6.5-10.5A6.5 6.5 0 105.5 10.5C5.5 14.9 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.3"/>',
  'clock':'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6V12l3 1.8"/>'
};

/** 生成 SVG 字符串 */
function svg(paths, sw){
  if(sw === undefined) sw = 1.9;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

/** 按分类名取图标 */
function catIcon(cat){
  return svg(ICON[cat] || ICON['其他'], 1.7);
}
