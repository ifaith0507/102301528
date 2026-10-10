/**
 * storage.js —— 数据层
 * 基于 localStorage 的增删改查
 */
var STORE_KEY = 'campus-lf-v1';

/** 示例数据 */
function seed(){
  return [
    {id:'LF-20260927-04', type:'found', cat:'校园卡', title:'校园卡（尾号 0421）', place:'图书馆 3 楼自习区', time:'2026-09-27T20:10',
     desc:'白色的校园卡，卡面姓名首字母 W，尾号 0421，背面贴了一张蓝色小熊贴纸。已交给我自己保管，随时可以来取。',
     contact:'微信 card-w0421', owner:'王同学', mine:false, status:'open', img:null},
    {id:'LF-20260927-03', type:'lost', cat:'雨伞', title:'黑色长柄雨伞', place:'第二教学楼 A301', time:'2026-09-27T09:40',
     desc:'黑色长柄伞，伞骨有一根略微变形，伞柄上挂着一个小黄鸭。当天上午上完第二节课就忘在教室后排了，谢谢好心人！',
     contact:'手机 138****6621', owner:'我', mine:true, status:'open', img:null},
    {id:'LF-20260926-07', type:'found', cat:'耳机', title:'白色蓝牙耳机（含充电盒）', place:'田径场看台 7 号位', time:'2026-09-26T21:05',
     desc:'白色入耳式蓝牙耳机，充电盒背面刻了一个「K」字。已经交到看台旁的体育器材室，也可以直接联系我。',
     contact:'手机 159****3308', owner:'李同学', mine:false, status:'closed', img:null},
    {id:'LF-20260926-02', type:'lost', cat:'钥匙', title:'宿舍钥匙（带毛球挂件）', place:'第四食堂二楼', time:'2026-09-26T12:30',
     desc:'一串两把钥匙，挂着灰色毛球挂件和宿舍门禁卡（4 号楼 512）。丢了以后进不去宿舍，比较着急。',
     contact:'微信 dorm512-key', owner:'陈同学', mine:false, status:'open', img:null},
    {id:'LF-20260925-11', type:'found', cat:'书籍', title:'《高等数学》上册', place:'A 座 214 教室', time:'2026-09-25T16:50',
     desc:'课本扉页写着班级和姓名（信息学院 2301 班），里面夹着几张手写笔记。现在放在 A 座一楼的失物架。',
     contact:'手机 187****0912', owner:'我', mine:true, status:'open', img:null},
    {id:'LF-20260924-01', type:'lost', cat:'校园卡', title:'校园卡（姓名 L 开头）', place:'体育馆羽毛球馆', time:'2026-09-24T19:20',
     desc:'打球时掉在场地边上，卡面有轻微磨损，已在本栋楼失物箱找到，谢谢大家的帮助。',
     contact:'手机 136****7745', owner:'我', mine:true, status:'closed', img:null}
  ];
}

/** 从 localStorage 读取数据 */
function loadData(){
  try{
    var s = localStorage.getItem(STORE_KEY);
    if(s) return JSON.parse(s);
  }catch(e){}
  var d = seed();
  saveData(d);
  return d;
}

/** 写入 localStorage */
function saveData(d){
  if(d === undefined) d = DB;
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(d)); }catch(e){}
}

/** 生成编号 */
function genId(){
  var stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  var n = DB.length + 1, id;
  do { id = 'LF-' + stamp + '-' + String(n).padStart(2,'0'); n++; } while(DB.some(function(i){ return i.id === id; }));
  return id;
}

/** 新增记录 */
function addItem(item){
  var record = {
    id: genId(),
    type: item.type,
    cat: item.cat,
    title: item.title,
    place: item.place,
    time: item.time,
    desc: item.desc || '',
    contact: item.contact,
    owner: '我',
    mine: true,
    status: 'open',
    img: item.img || null
  };
  DB.unshift(record);
  saveData();
  return record;
}

/** 按 ID 查找 */
function getItem(id){
  return DB.find(function(i){ return i.id === id; });
}

/** 更新状态 */
function setStatusById(id, status){
  var it = getItem(id);
  if(!it) return null;
  it.status = status;
  saveData();
  return it;
}

/** 删除记录 */
function deleteItem(id){
  DB = DB.filter(function(i){ return i.id !== id; });
  saveData();
}

/** 重置为示例数据 */
function resetData(){
  localStorage.removeItem(STORE_KEY);
  DB = seed();
  saveData();
}

/** 搜索：关键词 + 类型过滤 */
function searchData(q, typeFilter){
  var data = DB.filter(function(it){
    return typeFilter === 'all' ? true : it.type === typeFilter;
  });
  if(q && q.trim()){
    var kw = q.trim().toLowerCase();
    data = data.filter(function(it){
      return (it.title + it.cat + it.place + it.desc).toLowerCase().indexOf(kw) !== -1;
    });
  }
  return data;
}

// 全局数据库
var DB = loadData();
