/**
 * utils.js —— 工具函数
 */
var TYPE_TXT = {lost:'寻物', found:'招领'};

/** 状态文字 */
function statusTxt(it){
  if(it.type === 'lost')
    return it.status === 'open' ? '寻找中' : '已找到';
  return it.status === 'open' ? '待认领' : '已归还';
}

/** 格式化时间 mm-dd HH:MM */
function fmtTime(iso){
  var d = new Date(iso);
  if(isNaN(d)) return iso;
  var p = function(n){ return String(n).padStart(2,'0'); };
  return p(d.getMonth()+1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/** 相对时间描述 */
function relTime(iso){
  var d = new Date(iso);
  if(isNaN(d)) return '';
  var diff = (Date.now() - d.getTime()) / 36e5;
  if(diff < 1) return '刚刚';
  if(diff < 24) return Math.floor(diff) + ' 小时前';
  var day = Math.floor(diff / 24);
  if(day < 30) return day + ' 天前';
  return Math.floor(day / 30) + ' 个月前';
}

/** HTML 转义，防 XSS */
function esc(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

/** Toast 提示 */
var toastTimer;
function toast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1900);
}

/** 验证发布表单，返回错误信息数组 */
function validatePublish(item){
  var errors = [];
  if(!item.type || (item.type !== 'lost' && item.type !== 'found'))
    errors.push('信息类型必须为 寻物 或 招领');
  if(!item.title || !item.title.trim())
    errors.push('请填写物品名称');
  if(item.title && item.title.length > 20)
    errors.push('物品名称不能超过 20 个字符');
  if(!item.place || !item.place.trim())
    errors.push('请填写丢失或拾获地点');
  if(!item.time)
    errors.push('请选择时间');
  if(!item.contact || !item.contact.trim())
    errors.push('请填写联系方式');
  return errors;
}
