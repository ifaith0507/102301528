/**
 * tests.js —— 单元测试
 * 覆盖数据存储、搜索过滤、状态更新、表单验证、时间格式化、XSS防护等
 * 运行方式：用谷歌浏览器打开 tests.html 即可查看结果
 */
var TestRunner = (function () {
  var results = [];
  function assert(condition, message) { results.push({ pass: !!condition, message: message }); }
  function assertEqual(actual, expected, message) {
    var pass = actual === expected;
    results.push({ pass: pass, message: message + (pass ? '' : ' (期望: ' + expected + ', 实际: ' + actual + ')') });
  }
  function test(name, fn) {
    var before = results.length;
    try { fn(); return { name: name, results: results.slice(before), error: null }; }
    catch (e) { results.push({ pass: false, message: '异常: ' + e.message }); return { name: name, results: results.slice(before), error: e.message }; }
  }
  return { assert: assert, assertEqual: assertEqual, test: test, getResults: function(){ return results; } };
})();

function runAllTests() {
  var groups = [];
  var T = TestRunner;
  var origDB = DB.slice();

  // ---------- 测试 1：数据存储 —— 新增与查询 ----------
  groups.push(T.test('1. 数据存储：新增记录并查询', function () {
    DB = [];
    var item = addItem({ type:'lost', cat:'校园卡', title:'测试校园卡', place:'图书馆', time:'2026-10-10T10:00', desc:'测试', contact:'微信test' });
    T.assert(item.id !== undefined, '新增后应返回带 id 的记录');
    T.assertEqual(item.title, '测试校园卡', '名称应正确保存');
    T.assertEqual(item.status, 'open', '初始状态应为 open');
    T.assertEqual(item.type, 'lost', '类型应为 lost');
    T.assertEqual(item.mine, true, '新发布记录 mine 应为 true');
    var found = getItem(item.id);
    T.assert(found !== null, 'getItem 应能查到刚新增的记录');
    T.assertEqual(found.title, '测试校园卡', '查询到的名称应一致');
  }));

  // ---------- 测试 2：状态更新 ----------
  groups.push(T.test('2. 数据存储：更新状态（标记已找到/已归还）', function () {
    DB = [];
    var item = addItem({ type:'found', cat:'雨伞', title:'黑色雨伞', place:'教学楼', time:'2026-10-09T15:00', desc:'拾到', contact:'QQ123' });
    T.assertEqual(item.status, 'open', '初始状态为 open');
    var updated = setStatusById(item.id, 'closed');
    T.assertEqual(updated.status, 'closed', '更新后状态应为 closed');
    var refetch = getItem(item.id);
    T.assertEqual(refetch.status, 'closed', '重新查询状态仍为 closed');
    setStatusById(item.id, 'open');
    T.assertEqual(getItem(item.id).status, 'open', '重新开放后状态为 open');
  }));

  // ---------- 测试 3：表单验证 ----------
  groups.push(T.test('3. 表单验证：空字段与超长名称', function () {
    var e1 = validatePublish({ type:'lost', name:'', place:'图书馆', time:'2026-10-10T10:00', contact:'微信' });
    T.assert(e1.length > 0, '名称为空时应报错');
    var e2 = validatePublish({ type:'lost', title:'校园卡', place:'图书馆', time:'2026-10-10T10:00', contact:'' });
    T.assert(e2.indexOf('请填写联系方式') !== -1, '缺少联系方式应报错');
    var longName = 'A'.repeat(21);
    var e3 = validatePublish({ type:'lost', title:longName, place:'图书馆', time:'2026-10-10T10:00', contact:'微信' });
    T.assert(e3.indexOf('物品名称不能超过 20 个字符') !== -1, '名称超20字应报错');
    var e4 = validatePublish({ type:'found', title:'钥匙', place:'食堂', time:'2026-10-10T10:00', contact:'QQ123' });
    T.assertEqual(e4.length, 0, '合法数据验证应通过(0个错误)');
    var e5 = validatePublish({ type:'invalid', title:'测试', place:'图书馆', time:'2026-10-10T10:00', contact:'微信' });
    T.assert(e5.length > 0, '非法类型应报错');
  }));

  // ---------- 测试 4：搜索与过滤 ----------
  groups.push(T.test('4. 搜索与过滤：关键词、类型', function () {
    DB = [
      { id:'1', type:'lost',  cat:'校园卡',  title:'校园卡（张三）', place:'图书馆',   desc:'蓝色卡套', contact:'wx1', owner:'A', mine:false, status:'open',  time:'2026-10-10T10:00' },
      { id:'2', type:'found', cat:'雨伞',    title:'黑色雨伞',       place:'教学楼B',  desc:'折叠伞',   contact:'wx2', owner:'B', mine:false, status:'open',  time:'2026-10-10T10:00' },
      { id:'3', type:'lost',  cat:'耳机',    title:'AirPods耳机',   place:'体育馆',   desc:'白色耳机', contact:'wx3', owner:'C', mine:false, status:'closed',time:'2026-10-10T10:00' },
      { id:'4', type:'found', cat:'书籍',    title:'高数教材',       place:'食堂',     desc:'第七版',   contact:'wx4', owner:'D', mine:false, status:'open',  time:'2026-10-10T10:00' },
      { id:'5', type:'lost',  cat:'校园卡',  title:'校园卡（李四）', place:'南门',     desc:'红色卡套', contact:'wx5', owner:'E', mine:false, status:'open',  time:'2026-10-10T10:00' }
    ];
    // 关键词搜索 "校园卡"
    var r1 = searchData('校园卡', 'all');
    T.assertEqual(r1.length, 2, '搜索"校园卡"应返回2条');
    // 类型过滤
    var r2 = searchData('校园卡', 'lost');
    T.assertEqual(r2.length, 2, '寻物类型下搜"校园卡"应2条');
    var r3 = searchData('校园卡', 'found');
    T.assertEqual(r3.length, 0, '招领类型下搜"校园卡"应0条');
    // 搜索地点
    var r4 = searchData('图书馆', 'all');
    T.assertEqual(r4.length, 1, '搜索地点"图书馆"应1条');
    // 搜索描述
    var r5 = searchData('白色', 'all');
    T.assertEqual(r5.length, 1, '搜索描述"白色"应1条');
    // 空关键词返回全部
    var r6 = searchData('', 'all');
    T.assertEqual(r6.length, 5, '空关键词返回全部5条');
  }));

  // ---------- 测试 5：时间格式化 ----------
  groups.push(T.test('5. 时间格式化：相对时间描述', function () {
    var now = new Date().toISOString();
    T.assertEqual(relTime(now), '刚刚', '当前时间应显示"刚刚"');
    var fiveHrAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    T.assertEqual(relTime(fiveHrAgo), '5 小时前', '5小时前应正确显示');
    var threeDayAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    T.assertEqual(relTime(threeDayAgo), '3 天前', '3天前应正确显示');
    T.assertEqual(relTime(''), '', '空时间应返回空字符串');
    T.assertEqual(relTime('invalid-date'), '', '非法日期应返回空字符串');
  }));

  // ---------- 测试 6：HTML 转义（XSS 防护） ----------
  groups.push(T.test('6. HTML转义：防止 XSS 注入', function () {
    var malicious = '<script>alert("xss")<\/script>';
    var escaped = esc(malicious);
    T.assert(escaped.indexOf('<script>') === -1, '转义后不应含 <script> 标签');
    T.assert(escaped.indexOf('&lt;') !== -1, '应将 < 转义为 &lt;');
    T.assert(escaped.indexOf('&gt;') !== -1, '应将 > 转义为 &gt;');
    T.assertEqual(esc(''), '', '空字符串应返回空');
    T.assertEqual(esc('normal text'), 'normal text', '普通文本不改变');
    var escQ = esc('a"b\'c');
    T.assert(escQ.indexOf('&quot;') !== -1, '双引号应转义');
    T.assert(escQ.indexOf('&#39;') !== -1, '单引号应转义');
  }));

  // ---------- 测试 7：删除记录 ----------
  groups.push(T.test('7. 数据存储：删除记录', function () {
    DB = [
      { id:'del1', type:'lost', cat:'其他', title:'物品A', place:'地点', desc:'', contact:'wx', owner:'A', mine:true, status:'open', time:'2026-10-10T10:00' },
      { id:'del2', type:'found',cat:'其他', title:'物品B', place:'地点', desc:'', contact:'wx', owner:'B', mine:true, status:'open', time:'2026-10-10T10:00' }
    ];
    deleteItem('del2');
    T.assertEqual(DB.length, 1, '删除后应剩1条');
    T.assert(getItem('del2') === undefined, ' getItem(del2) 应为 undefined');
    T.assert(getItem('del1') !== undefined, 'getItem(del1) 仍存在');
  }));

  // ---------- 测试 8：状态文字与类型文字映射 ----------
  groups.push(T.test('8. 状态/类型文字映射', function () {
    T.assertEqual(TYPE_TXT.lost, '寻物', 'lost -> 寻物');
    T.assertEqual(TYPE_TXT.found, '招领', 'found -> 招领');
    T.assertEqual(statusTxt({type:'lost',  status:'open'}),   '寻找中', '寻物+open -> 寻找中');
    T.assertEqual(statusTxt({type:'lost',  status:'closed'}), '已找到', '寻物+closed -> 已找到');
    T.assertEqual(statusTxt({type:'found',status:'open'}),   '待认领', '招领+open -> 待认领');
    T.assertEqual(statusTxt({type:'found',status:'closed'}), '已归还', '招领+closed -> 已归还');
  }));

  // ---------- 测试 9：编号生成 ----------
  groups.push(T.test('9. 编号生成：唯一性', function () {
    DB = [];
    var ids = [];
    for (var i = 0; i < 10; i++) {
      var item = addItem({ type:'lost', cat:'其他', title:'批量测试'+i, place:'地点', time:'2026-10-10T10:00', desc:'', contact:'wx' });
      ids.push(item.id);
    }
    var unique = ids.filter(function(v, idx, arr){ return arr.indexOf(v) === idx; });
    T.assertEqual(unique.length, 10, '10条记录编号应全部唯一');
    T.assert(ids[0].indexOf('LF-') === 0, '编号应以 LF- 开头');
  }));

  // 恢复 DB
  DB = origDB;
  saveData();

  // ---------- 渲染结果 ----------
  var html = '';
  var totalPass = 0, totalFail = 0;
  groups.forEach(function (g) {
    var groupPass = 0, groupFail = 0;
    g.results.forEach(function (r) { if (r.pass) groupPass++; else groupFail++; });
    totalPass += groupPass; totalFail += groupFail;
    var status = groupFail === 0 ? 'pass' : 'fail';
    html += '<div class="test-group ' + status + '">';
    html += '<div class="test-group-header"><span class="test-status">' + (groupFail === 0 ? '✅' : '❌') + '</span> ' + g.name;
    html += '<span class="test-count">' + groupPass + ' 通过, ' + groupFail + ' 失败</span></div>';
    html += '<ul class="test-list">';
    g.results.forEach(function (r) {
      html += '<li class="' + (r.pass ? 'pass' : 'fail') + '"><span>' + (r.pass ? '✓' : '✗') + '</span> ' + r.message + '</li>';
    });
    html += '</ul></div>';
  });
  var summary = '<div class="test-summary ' + (totalFail === 0 ? 'all-pass' : 'has-fail') + '">';
  summary += '总计: ' + (totalPass + totalFail) + ' 项断言, ' + totalPass + ' 通过, ' + totalFail + ' 失败';
  summary += '</div>';
  document.getElementById('test-results').innerHTML = summary + html;
}
