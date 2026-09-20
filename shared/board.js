export const REGIONS = {
  京津冀:'#d74435', 江南:'#5eaa88', 长三角:'#3889c5', 巴蜀:'#d99b2b', 岭南:'#e67b51',
  中原:'#8b68b9', 古都:'#b0804d', 海峡:'#21a9a2', 齐晉:'#8aaf54'
};
// 坐标近似采用 GeoNames 城市中心数据，详见 README。棋盘位置仅为游戏布局。
export const BOARD = [
  {type:'start',name:'起点 · 神州启程'},
  {type:'city',name:'北京',region:'京津冀',price:220,lat:39.9042,lon:116.4074},
  {type:'city',name:'天津',region:'京津冀',price:180,lat:39.0851,lon:117.1994},
  {type:'event',name:'奇遇'},
  {type:'city',name:'承德',region:'京津冀',price:140,lat:40.9730,lon:117.9364},
  {type:'rail',name:'京沪高铁',price:200},
  {type:'city',name:'杭州',region:'江南',price:190,lat:30.2741,lon:120.1551},
  {type:'city',name:'苏州',region:'江南',price:170,lat:31.2989,lon:120.5853},
  {type:'jail',name:'监狱 · 探望'},
  {type:'city',name:'上海',region:'长三角',price:260,lat:31.2304,lon:121.4737},
  {type:'city',name:'南京',region:'长三角',price:200,lat:32.0603,lon:118.7969},
  {type:'fee',name:'城市维护费',fee:120},
  {type:'city',name:'合肥',region:'长三角',price:150,lat:31.8206,lon:117.2272},
  {type:'city',name:'重庆',region:'巴蜀',price:200,lat:29.5630,lon:106.5516},
  {type:'city',name:'成都',region:'巴蜀',price:200,lat:30.5728,lon:104.0668},
  {type:'fortune',name:'财神降临'},
  {type:'park',name:'国家公园'},
  {type:'city',name:'广州',region:'岭南',price:220,lat:23.1291,lon:113.2644},
  {type:'city',name:'深圳',region:'岭南',price:240,lat:22.5431,lon:114.0579},
  {type:'city',name:'珠海',region:'岭南',price:170,lat:22.2707,lon:113.5767},
  {type:'rail',name:'广深高铁',price:200},
  {type:'city',name:'西安',region:'古都',price:190,lat:34.3416,lon:108.9398},
  {type:'city',name:'洛阳',region:'中原',price:150,lat:34.6197,lon:112.4540},
  {type:'gojail',name:'前往监狱'},
  {type:'city',name:'厦门',region:'海峡',price:180,lat:24.4798,lon:118.0894},
  {type:'city',name:'福州',region:'海峡',price:160,lat:26.0745,lon:119.2965},
  {type:'city',name:'泉州',region:'海峡',price:140,lat:24.8741,lon:118.6757},
  {type:'misfortune',name:'霉运来袭'},
  {type:'city',name:'青岛',region:'齐晉',price:190,lat:36.0671,lon:120.3826},
  {type:'city',name:'济南',region:'齐晉',price:170,lat:36.6512,lon:117.1201},
  {type:'city',name:'烟台',region:'齐晉',price:150,lat:37.4638,lon:121.4479},
  {type:'event',name:'神州奇遇'}
];
export const PLAYER_COLORS=['#f05c45','#20a894','#f4ba37','#5c8ee6'];
export const cityIds=BOARD.map((s,i)=>s.type==='city'?i:-1).filter(i=>i>=0);
export function groupIds(region){return cityIds.filter(i=>BOARD[i].region===region)}
