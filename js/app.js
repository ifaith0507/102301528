/**
 * app.js —— 主应用逻辑
 * 路由、渲染、事件绑定、发布、详情、我的发布
 */
var SCREENS = [
  {key:'home', name:'首页', desc:'搜索 + 列表'},
  {key:'search', name:'搜索页', desc:'关键词 + 筛选'},
  {key:'publish', name:'发布信息页', desc:'寻物 / 招领'},
  {key:'detail', name:'信息详情页', desc:'详情 + 联系'},
  {key:'mine', name:'我的发布页', desc:'修改状态'},
  {key:'success', name:'发布成功页', desc:'结果反馈'}
];

var current = 'home';
var history_ = ['home'];
var filters = {home:'all', search:'all', mine:'all'};
var query = '';
var currentId = null;
var revealed = false;
var draft = {type:'lost', cat:CATS[0], img:null};
var Q = "'";

/* ====== 票根组件 ====== */
function ticketHTML(it, opts){
  if(!opts) opts = {};
  var cls = it.type === 'lost' ? 'type-lost' : 'type-found';
  var stampCls = it.status === 'closed' ? 'closed' : 'open';
  var actions = opts.actions || '';
  var clickable = opts.clickable === false ? '' : 'onclick="openDetail(' + Q + it.id + Q + ')"';
  return ''
  + '<article class="ticket" data-id="' + it.id + '" ' + clickable + '>'
  +   '<span class="punch t"></span><span class="punch b"></span>'
  +   '<div class="tk-main">'
  +     '<div class="tk-icon ' + cls + '">' + catIcon(it.cat) + '</div>'
  +     '<div class="tk-body">'
  +       '<h3 class="tk-title">' + esc(it.title) + '</h3>'
  +       '<p class="tk-meta">' + svg(ICON.pin, 2) + '<span>' + esc(it.place) + '</span></p>'
  +       '<div class="tk-tags">'
  +         '<span class="tag ' + (it.type==='lost'?'tag-lost':'tag-found') + '">' + TYPE_TXT[it.type] + '</span>'
  +         '<span class="tag">' + esc(it.cat) + '</span>'
  +         '<span class="tag">' + relTime(it.time) + '</span>'
  +       '</div>'
  +       actions
  +     '</div>'
  +   '</div>'
  +   '<div class="stub">'
  +     '<span class="stamp ' + stampCls + '">' + statusTxt(it) + '<span class="stamp-sub">' + (it.status==='closed'?'CLOSED':'OPEN') + '</span></span>'
  +     '<span style="font-family:var(--font-mono);font-size:8.5px;color:var(--ink-3);text-align:center;line-height:1.3">' + it.id.split('-')[1] + '</span>'
  +   '</div>'
  + '</article>';
}

/* ====== 路由 ====== */
function go(key, opt){
  if(!opt) opt = {};
  if(key === current && !opt.force) { if(opt.reset) history_ = [key]; return; }
  var order = SCREENS.map(function(s){ return s.key; });
  var dir = (order.indexOf(key) >= order.indexOf(current)) ? 'fwd' : 'back';
  document.querySelectorAll('.screen').forEach(function(s){
    s.hidden = true; s.classList.remove('fwd','back');
  });
  var el = document.getElementById('s-' + key);
  el.hidden = false;
  if(!opt.silent){ void el.offsetWidth; el.classList.add(dir); }
  current = key;
  if(opt.reset) history_ = [key]; else if(history_[history_.length-1] !== key) history_.push(key);
  if(key === 'search'){ setTimeout(function(){ document.getElementById('q').focus(); }, 240); }
  renderAll();
  renderRail();
}

function back(){
  history_.pop();
  var prev = history_[history_.length-1] || 'home';
  go(prev, {force:true});
  if(history_.length === 0) history_ = [prev];
}

function openDetail(id){
  currentId = id; revealed = false; go('detail');
}

/* ====== 渲染 ====== */
function renderAll(){ renderHome(); renderSearch(); renderMine(); renderDetail(); renderRail(); }

function renderRail(){
  var ul = document.getElementById('railList');
  ul.innerHTML = SCREENS.map(function(s, i){
    return '<li style="list-style:none">'
    + '<button class="rail-item ' + (s.key===current?'on':'') + '" onclick="go(' + Q + s.key + Q + ',{force:true})">'
    +   '<span class="rail-num">0' + (i+1) + '</span>'
    +   '<span style="flex:1">' + s.name + '</span>'
    +   '<span class="rail-num" style="min-width:auto">' + (s.key===current?'●':'') + '</span>'
    + '</button></li>';
  }).join('');
}

function renderHome(){
  var f = filters.home;
  var data = DB.filter(function(it){ return f==='all' ? true : it.type===f; });
  document.getElementById('c-all').textContent = DB.length;
  document.getElementById('c-lost').textContent = DB.filter(function(i){ return i.type==='lost'; }).length;
  document.getElementById('c-found').textContent = DB.filter(function(i){ return i.type==='found'; }).length;
  var openCount = DB.filter(function(i){ return i.status==='open'; }).length;
  document.getElementById('homeCount').textContent = data.length + ' 条信息 · 按时间倒序';
  var todayCount = DB.filter(function(i){ var r = relTime(i.time); return r==='刚刚' || r.indexOf('小时')!==-1; }).length;
  document.getElementById('homeTicker').textContent = '今日新增 ' + todayCount + ' 条 · 待处理 ' + openCount + ' 件';
  var list = document.getElementById('homeList');
  list.innerHTML = data.length ? data.map(function(it){ return ticketHTML(it); }).join('') : emptyHTML('这里还没有信息', '换个分类看看，或者自己发布一条。');
}

function renderSearch(){
  var q = query.trim();
  var data = searchData(query, filters.search);
  document.getElementById('searchCount').textContent = q ? '「' + q + '」找到 ' + data.length + ' 条' : '全部 ' + data.length + ' 条 · 输入关键词精确查找';
  var list = document.getElementById('searchList');
  list.innerHTML = data.length ? data.map(function(it){ return ticketHTML(it); }).join('') :
    emptyHTML('没有找到相关信息', '换一个关键词试试，比如「校园卡」「雨伞」；也可以自己发布一条寻物信息。') +
    '<div style="padding:0 20px"><button class="btn btn-primary" onclick="go(' + Q + 'publish' + Q + ')">发布寻物信息</button></div>';
}

function renderMine(){
  var mine = DB.filter(function(i){ return i.mine; });
  var f = filters.mine;
  var data = mine.filter(function(it){ return f==='all' ? true : it.status===f; });
  document.getElementById('mineStat').innerHTML =
    '共 <b>' + mine.length + '</b> 条 · 进行中 <b>' + mine.filter(function(i){ return i.status==='open'; }).length + '</b> 条 · 已完结 <b>' + mine.filter(function(i){ return i.status==='closed'; }).length + '</b> 条';
  var list = document.getElementById('mineList');
  list.innerHTML = data.length ? data.map(function(it){
    var closeTxt = it.type==='lost' ? '标记为已找到' : '标记为已归还';
    var act = it.status==='open'
      ? '<div class="tk-actions"><button class="mini go" onclick="setStatus(' + Q + it.id + Q + ',' + Q + 'closed' + Q + ',event)">' + closeTxt + '</button><button class="mini" onclick="openDetail(' + Q + it.id + Q + ')">编辑查看</button></div>'
      : '<div class="tk-actions"><button class="mini re" onclick="setStatus(' + Q + it.id + Q + ',' + Q + 'open' + Q + ',event)">撤回状态</button><button class="mini" onclick="delItem(' + Q + it.id + Q + ',event)">删除</button></div>';
    return ticketHTML(it, {actions: act});
  }).join('') : emptyHTML('这里还是空的', '你发布的信息会出现在这里，之后可以随时更新状态。') +
    '<div style="padding:0 20px"><button class="btn btn-primary" onclick="go(' + Q + 'publish' + Q + ')">去发布一条</button></div>';
}

function renderDetail(){
  if(!currentId) return;
  var it = getItem(currentId);
  if(!it){ go('home'); return; }
  document.getElementById('detailCode2').textContent = it.id;
  var heroCls = it.type==='lost' ? 'lost' : 'found';
  var stampCls = it.status==='closed' ? 'closed' : 'open';
  var heroInner = it.img
    ? '<img src="' + it.img + '" alt="">'
    : '<div class="big-icon" style="color:var(--' + it.type + ')">' + catIcon(it.cat) + '</div>';

  document.getElementById('detailBody').innerHTML = ''
  + '<div class="hero ' + heroCls + '">'
  +   heroInner
  +   '<span class="stamp ' + stampCls + '" id="detailStamp">' + statusTxt(it) + '<span class="stamp-sub">' + (it.status==='closed'?'CLOSED':'OPEN') + '</span></span>'
  +   '<span class="code">' + it.id + '</span>'
  + '</div>'
  + '<div class="detail-head">'
  +   '<h2>' + esc(it.title) + '</h2>'
  +   '<div class="tags">'
  +     '<span class="tag ' + (it.type==='lost'?'tag-lost':'tag-found') + '">' + TYPE_TXT[it.type] + '</span>'
  +     '<span class="tag">' + esc(it.cat) + '</span>'
  +     '<span class="tag ' + (it.status==='closed'?'tag-done':'') + '">' + statusTxt(it) + '</span>'
  +     (it.mine ? '<span class="tag">我发布的</span>' : '')
  +   '</div>'
  + '</div>'
  + '<div class="specs">'
  +   '<div class="spec"><span class="k">地点</span><span class="d"></span><span class="v">' + esc(it.place) + '</span></div>'
  +   '<div class="spec"><span class="k">时间</span><span class="d"></span><span class="v mono">' + fmtTime(it.time) + '</span></div>'
  +   '<div class="spec"><span class="k">类别</span><span class="d"></span><span class="v">' + esc(it.cat) + '</span></div>'
  +   '<div class="spec"><span class="k">发布者</span><span class="d"></span><span class="v">' + esc(it.owner) + ' · ' + relTime(it.time) + '</span></div>'
  +   '<div class="spec"><span class="k">状态</span><span class="d"></span><span class="v" id="detailStatus">' + statusTxt(it) + '</span></div>'
  + '</div>'
  + '<div class="block"><h3>详细描述</h3><p>' + (esc(it.desc) || '发布者没有填写更多描述。') + '</p></div>'
  + '<div class="block"><h3>联系方式</h3>'
  +   '<div class="contact-card">'
  +     '<div class="avatar">' + (it.mine?'我':esc(it.owner[0])) + '</div>'
  +     '<div style="flex:1;min-width:0">'
  +       '<div class="who">' + (it.mine?'我发布的 · 联系方式':esc(it.owner)) + '</div>'
  +       '<div class="val ' + (revealed||it.mine?'':'blur') + '" id="contactVal">' + (esc(it.contact) || '未填写') + '</div>'
  +     '</div>'
  +     (it.mine ? '' : '<button class="btn btn-sm btn-ghost" onclick="revealContact()">' + (revealed?'已显示':'显示') + '</button>')
  +   '</div>'
  + '</div>'
  + (it.status==='closed' ? '<div class="notice">该信息已标记为「' + statusTxt(it) + '」，如有疑问仍可联系发布者核对。</div>' : '');

  // 底部操作
  var ab = document.getElementById('detailActions');
  if(it.mine){
    if(it.status === 'open'){
      var closeTxt = it.type==='lost' ? '标记为已找到' : '标记为已归还';
      ab.innerHTML = ''
      + '<button class="btn ' + (it.type==='lost'?'btn-found':'btn-lost') + '" onclick="setStatus(' + Q + it.id + Q + ',' + Q + 'closed' + Q + ')">'
      +   svg('<path d="M5 13l4 4L19 7"/>', 2.4) + closeTxt
      + '</button>'
      + '<div class="row">'
      +   '<button class="btn btn-ghost" onclick="toast(' + Q + '原型演示：编辑功能同发布页表单' + Q + ')">编辑信息</button>'
      +   '<button class="btn btn-danger" onclick="delItem(' + Q + it.id + Q + ')">删除</button>'
      + '</div>';
    } else {
      ab.innerHTML = ''
      + '<button class="btn btn-ghost" onclick="setStatus(' + Q + it.id + Q + ',' + Q + 'open' + Q + ')">恢复为「' + (it.type==='lost'?'寻找中':'待认领') + '」</button>'
      + '<div class="row"><button class="btn btn-danger" onclick="delItem(' + Q + it.id + Q + ')">删除这条信息</button></div>';
    }
  } else if(it.status === 'open'){
    ab.innerHTML = ''
    + '<button class="btn btn-primary" onclick="contactNow()">' + (it.type==='lost'?'我捡到了，联系失主':'我丢了东西，联系拾主') + '</button>'
    + '<button class="btn btn-ghost" onclick="copyContact()">复制联系方式</button>';
  } else {
    ab.innerHTML = ''
    + '<button class="btn btn-primary" onclick="contactNow()">联系发布者核对</button>'
    + '<div class="notice" style="margin:0">该信息已完结，发布者可能不再频繁查看。</div>';
  }
}

function emptyHTML(title, desc){
  return '<div class="empty">'
  + '<div class="art">' + svg('<path d="M4 8.5V19a1.5 1.5 0 001.5 1.5h13A1.5 1.5 0 0020 19V8.5"/><path d="M3 4.5h18v4H3z"/><path d="M10 12.5h4"/>', 1.5) + '</div>'
  + '<h3>' + title + '</h3><p>' + desc + '</p></div>';
}

/* ====== 行为 ====== */
function setStatus(id, status, ev){
  if(ev) ev.stopPropagation();
  var it = setStatusById(id, status);
  if(!it) return;
  renderAll();
  var stamp = document.querySelector('#s-' + current + ' .ticket[data-id="' + id + '"] .stamp') || document.getElementById('detailStamp');
  if(stamp){ stamp.classList.remove('hit'); void stamp.offsetWidth; stamp.classList.add('hit'); }
  toast(status==='closed' ? '已更新为「' + statusTxt(it) + '」' : '已恢复为「' + statusTxt(it) + '」');
}

function delItem(id, ev){
  if(ev) ev.stopPropagation();
  var it = getItem(id);
  if(!it) return;
  if(!confirm('确定删除「' + it.title + '」这条信息吗？')) return;
  deleteItem(id);
  toast('已删除该条信息');
  if(current === 'detail') back(); else renderAll();
}

function revealContact(){ revealed = true; renderDetail(); }

function contactNow(){
  revealed = true; renderDetail();
  var it = getItem(currentId);
  toast('已展开联系方式：' + it.contact);
}

function copyContact(){
  var it = getItem(currentId);
  var done = function(){ revealed = true; renderDetail(); toast('联系方式已复制'); };
  if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(it.contact).then(done, done); }
  else done();
}

/* ====== 发布 ====== */
function initPublishForm(){
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('f-time').value = now.toISOString().slice(0,16);
  document.getElementById('catChips').innerHTML = CATS.map(function(c, i){
    return '<button class="chip ' + (i===0?'on':'') + '" data-cat="' + c + '" onclick="pickCat(this)">' + c + '</button>';
  }).join('');
  document.querySelectorAll('#typePick .type-opt').forEach(function(b){
    b.onclick = function(){
      document.querySelectorAll('#typePick .type-opt').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on'); draft.type = b.dataset.t;
      var isLost = b.dataset.t === 'lost';
      document.querySelector('#s-publish .appbar h1').textContent = isLost ? '发布寻物信息' : '发布招领信息';
      document.getElementById('f-desc').placeholder = isLost
        ? '如：黑色长柄伞，伞骨有一根略微变形，伞柄挂着小黄鸭'
        : '如：白色蓝牙耳机，充电盒背面刻了一个「K」字';
    };
  });
  document.querySelector('[data-t="lost"]').click();
}

function pickCat(el){
  document.querySelectorAll('#catChips .chip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on'); draft.cat = el.dataset.cat;
}

function resetPublishForm(){
  ['f-title','f-place','f-desc','f-contact'].forEach(function(id){
    var el = document.getElementById(id);
    el.value = ''; el.classList.remove('err');
  });
  document.querySelectorAll('.err-msg').forEach(function(e){ e.classList.remove('show'); });
  var up = document.getElementById('uploadBox');
  up.classList.remove('has');
  up.innerHTML = svg('<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.6" cy="10" r="1.6"/><path d="M3.5 17l5-4.5 4 3.4 3-2.4 5 3.5"/>', 1.9) + '<span>点击上传（选填）</span>';
  draft.img = null;
  draft.cat = CATS[0];
  document.querySelectorAll('#catChips .chip').forEach(function(c, i){ c.classList.toggle('on', i===0); });
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('f-time').value = now.toISOString().slice(0,16);
}

function submitPublish(){
  var title = document.getElementById('f-title').value.trim();
  var place = document.getElementById('f-place').value.trim();
  var time  = document.getElementById('f-time').value;
  var desc  = document.getElementById('f-desc').value.trim();
  var contact = document.getElementById('f-contact').value.trim();
  var bad = null;
  function check(id, cond){
    var el = document.getElementById(id);
    var m = document.querySelector('.err-msg[data-for="' + id + '"]');
    el.classList.toggle('err', !cond);
    if(m) m.classList.toggle('show', !cond);
    if(!cond && !bad) bad = id;
  }
  check('f-title', !!title);
  check('f-place', !!place);
  check('f-time', !!time);
  check('f-contact', !!contact);
  if(bad){
    var el = document.getElementById(bad);
    el.classList.add('shake'); setTimeout(function(){ el.classList.remove('shake'); }, 400);
    el.focus(); toast('还有必填项没有填写'); return;
  }
  var item = addItem({type:draft.type, cat:draft.cat, title:title, place:place, time:time, desc:desc, contact:contact, img:draft.img});
  var isLost = item.type === 'lost';
  document.getElementById('successStamp').textContent = isLost ? '寻物已发布' : '招领已发布';
  document.getElementById('successTitle').textContent = isLost ? '寻物信息已发布' : '招领信息已发布';
  document.getElementById('successDesc').textContent = isLost
    ? '同学们现在可以搜索到它了。有人提供线索时，会通过你留下的联系方式找到你。'
    : '先别急着把东西交出去，等失主核对特征后再归还，避免误领。';
  document.getElementById('successReceipt').innerHTML = ''
  + '<div class="r"><span class="k">信息编号</span><span class="v">' + item.id + '</span></div>'
  + '<div class="r"><span class="k">类型</span><span class="v">' + TYPE_TXT[item.type] + '</span></div>'
  + '<div class="r"><span class="k">物品</span><span class="v">' + esc(item.title) + '</span></div>'
  + '<div class="r"><span class="k">当前状态</span><span class="v">' + statusTxt(item) + '</span></div>';
  resetPublishForm();
  go('success', {reset:true});
}

/* ====== 分段控件 ====== */
function initSeg(id, key){
  var seg = document.getElementById(id);
  seg.querySelectorAll('button').forEach(function(b){
    b.onclick = function(){
      seg.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on'); filters[key] = b.dataset.f;
      ({home:renderHome, search:renderSearch, mine:renderMine})[key]();
    };
  });
}

/* ====== 杂项初始化 ====== */
function initMisc(){
  document.getElementById('hotWords').innerHTML =
    ['校园卡','钥匙','耳机','雨伞','书籍'].map(function(w){
      return '<button class="chip" onclick="setQuery(' + Q + w + Q + ')">' + w + '</button>';
    }).join('');
  var q = document.getElementById('q');
  q.addEventListener('input', function(e){ query = e.target.value; renderSearch(); });
  document.getElementById('clearQ').onclick = function(){ q.value=''; query=''; renderSearch(); q.focus(); };
  document.getElementById('fileInput').addEventListener('change', function(e){
    var f = e.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(ev){
      draft.img = ev.target.result;
      var up = document.getElementById('uploadBox');
      up.classList.add('has'); up.innerHTML = '<img src="' + draft.img + '" alt="已上传图片">';
      toast('图片已添加');
    };
    r.readAsDataURL(f);
  });
  document.getElementById('resetData').onclick = function(e){
    e.preventDefault();
    resetData();
    renderAll(); go('home', {reset:true});
    toast('演示数据已重置');
  };
  // 时钟
  var tick = function(){
    var d = new Date();
    document.getElementById('clock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
  };
  tick(); setInterval(tick, 20000);
  // 键盘
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && current !== 'home') back();
    if(e.key === 'Enter' && current === 'search') document.getElementById('q').blur();
  });
}

function setQuery(w){
  query = w; document.getElementById('q').value = w; renderSearch();
  filters.search = 'all';
  document.querySelectorAll('#searchSeg button').forEach(function(b){ b.classList.toggle('on', b.dataset.f==='all'); });
}

function fit(){
  var railW = window.innerWidth > 1080 ? 236 + 34 : 0;
  var availW = window.innerWidth - railW - 40;
  var availH = window.innerHeight - 48;
  var s = Math.min(1, availH/866, availW/410);
  document.documentElement.style.setProperty('--s', Math.max(0.5, s));
  document.getElementById('phoneWrap').style.width = (410 * Math.max(0.5,s)) + 'px';
  document.getElementById('phoneWrap').style.height = (866 * Math.max(0.5,s)) + 'px';
}

/* ====== 启动 ====== */
function startApp(){
  initPublishForm();
  initSeg('homeSeg','home');
  initSeg('searchSeg','search');
  initSeg('mineSeg','mine');
  initMisc();
  fit();
  window.addEventListener('resize', fit);
  go('home', {silent:true, force:true, reset:true});
}
