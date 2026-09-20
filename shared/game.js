import {BOARD, PLAYER_COLORS, groupIds} from './board.js';
export const MAX_JAIL_TURNS=3;
const EVENTS=[
  {title:'生意兴隆',text:'特色商铺人气高涨，收入 ¥160。',kind:'income',value:160,art:'wealth'},
  {title:'城市分红',text:'城市经营表现优秀，获得 ¥120。',kind:'income',value:120,art:'wealth'},
  {title:'文旅热潮',text:'游客纷至沓来，获得 ¥200。',kind:'income',value:200,art:'wealth'},
  {title:'房屋维修',text:'设施维护支出 ¥90。',kind:'expense',value:90,art:'repair'},
  {title:'公益捐赠',text:'参与社区建设，支出 ¥70。',kind:'expense',value:70,art:'repair'},
  {title:'城市奖章',text:'经营有方，获得 ¥110。',kind:'income',value:110,art:'wealth'},
  {title:'重返起点',text:'乘高铁返回起点，领取 ¥200。',kind:'start',value:200,art:'travel'},
  {title:'财神眷顾',text:'获得 ¥100，并在接下来 3 回合增加收租和起点收入。',kind:'fortune',value:100,art:'fortune'},
  {title:'霉运缠身',text:'支出 ¥80，接下来 3 回合支付更多过路费。',kind:'misfortune',value:80,art:'misfortune'},
  {title:'迷路入狱',text:'被送入监狱，等待掷出对子或支付保释金。',kind:'jail',value:0,art:'jail'},
  {title:'投资新机遇',text:'获得创业扶持 ¥140。',kind:'income',value:140,art:'wealth'},
  {title:'交通整修',text:'道路整修支出 ¥100。',kind:'expense',value:100,art:'repair'}
];
export {EVENTS};
export function createGame(config={}){
  const count=Math.min(4,Math.max(2,Number(config.count)||2));
  const cash=Math.max(500,Number(config.cash)||1500);
  const seats=Array.from({length:count},(_,i)=>({id:i,name:String(config.seats?.[i]?.name||`玩家 ${i+1}`).slice(0,16),type:config.seats?.[i]?.type||'human',color:PLAYER_COLORS[i],cash,pos:0,jailed:0,jailTries:0,fortune:0,misfortune:0,bankrupt:false}));
  return {players:seats,properties:{},current:0,round:1,maxRounds:Math.max(3,Number(config.rounds)||20),phase:'roll',pending:null,event:null,lastDice:null,seq:0,history:[`第 1 轮开始：${seats[0].name}行动`],winner:null};
}
export function linked(state,owner,region){return groupIds(region).every(id=>state.properties[id]?.owner===owner&&!state.properties[id]?.mortgaged)}
export function rent(state,id){const tile=BOARD[id],p=state.properties[id];if(!p||p.mortgaged)return 0;if(tile.type==='rail')return Object.values(state.properties).filter(x=>x.owner===p.owner&&x.rail&&!x.mortgaged).length*35;let value=Math.round(tile.price*(0.11+0.12*p.level));if(linked(state,p.owner,tile.region))value=Math.round(value*1.5);return value}
export function wealth(state,player){return player.cash+Object.entries(state.properties).reduce((n,[id,p])=>n+(p.owner===player.id?Math.round(BOARD[id].price*(p.mortgaged?.5:1)+p.level*BOARD[id].price*.55):0),0)}
export function canBuild(state,id){const p=state.properties[id],t=BOARD[id];return !!(p&&t.type==='city'&&p.owner===state.current&&!p.mortgaged&&p.level<3)}
export function buildCost(id,level){return Math.round(BOARD[id].price*(.45+level*.2))}
function log(s,message){s.history=[message,...s.history].slice(0,60)}
function pay(s,from,amount,to=null){const p=s.players[from],available=Math.max(0,p.cash);p.cash-=amount;if(to!==null)s.players[to].cash+=Math.min(available,amount);if(p.cash<0){s.pending={kind:'debt',amount:-p.cash,creditor:to};s.phase='debt'}return amount}
function gain(s,id,amount){const p=s.players[id],owed=s.phase==='debt'&&s.pending?.creditor!==null?Math.min(amount,Math.max(0,-p.cash)):0;p.cash+=amount;if(owed)s.players[s.pending.creditor].cash+=owed}
function effect(s,event){const p=s.players[s.current];s.event=event;switch(event.kind){case'income':gain(s,p.id,event.value);break;case'expense':pay(s,p.id,event.value);break;case'start':p.pos=0;gain(s,p.id,event.value);break;case'fortune':gain(s,p.id,event.value);p.fortune=3;p.misfortune=0;break;case'misfortune':pay(s,p.id,event.value);p.misfortune=3;p.fortune=0;break;case'jail':p.pos=8;p.jailed=1;p.jailTries=0;break;}log(s,`${p.name}：${event.title} ${event.value?`¥${event.value}`:''}`)}
function land(s,id,random){const tile=BOARD[id],p=s.players[s.current],prop=s.properties[id];s.phase='finish';if(tile.type==='city'||tile.type==='rail'){if(!prop){s.phase='decision';s.pending={kind:'buy',id};log(s,`${p.name} 到达 ${tile.name}，可购买 ¥${tile.price}`)}else if(prop.owner!==p.id&&!prop.mortgaged&&!s.players[prop.owner].bankrupt){let charge=rent(s,id);if(p.misfortune)charge=Math.round(charge*1.3);let bonus=s.players[prop.owner].fortune?Math.round(charge*.25):0;pay(s,p.id,charge,prop.owner);if(bonus)gain(s,prop.owner,bonus);log(s,`${p.name} 向 ${s.players[prop.owner].name} 支付 ${tile.name} 过路费 ¥${charge}`)}else log(s,`${p.name} 到达 ${tile.name}`);return}
 if(tile.type==='start'){log(s,`${p.name} 回到起点`)}
 if(tile.type==='event'){effect(s,EVENTS[Math.floor(random()*EVENTS.length)])}
 if(tile.type==='fortune'){effect(s,{title:'财神降临',text:'财运当头！获得 ¥150，未来 3 回合收租和经过起点均有加成。',kind:'fortune',value:150,art:'fortune'})}
 if(tile.type==='misfortune'){effect(s,{title:'霉运来袭',text:'意外支出 ¥100，未来 3 回合支付更多过路费。',kind:'misfortune',value:100,art:'misfortune'})}
 if(tile.type==='fee'){pay(s,p.id,tile.fee);s.event={title:'城市维护费',text:`支付公共设施维护费 ¥${tile.fee}。`,kind:'expense',value:tile.fee,art:'repair'};log(s,`${p.name} 支付维护费 ¥${tile.fee}`)}
 if(tile.type==='gojail'){p.pos=8;p.jailed=1;p.jailTries=0;s.event={title:'前往监狱',text:'你被送入监狱。下一回合可支付保释金，或尝试掷出对子。',kind:'jail',art:'jail'};log(s,`${p.name} 被送入监狱`)}
 if(tile.type==='park'||tile.type==='jail')log(s,`${p.name} 在${tile.name}小憩`)
}
function next(s){const old=s.current;let id=old;for(let i=0;i<s.players.length;i++){id=(id+1)%s.players.length;if(!s.players[id].bankrupt)break}if(id<=old)s.round++;s.current=id;s.phase='roll';s.pending=null;s.event=null;s.lastDice=null;const p=s.players[id];if(p.fortune)p.fortune--;if(p.misfortune)p.misfortune--;log(s,`第 ${s.round} 轮 · ${p.name}行动`);const alive=s.players.filter(x=>!x.bankrupt);if(alive.length===1||s.round>s.maxRounds){s.phase='gameover';s.winner=[...alive].sort((a,b)=>wealth(s,b)-wealth(s,a))[0]?.id??null;log(s,`对局结束，${s.players[s.winner]?.name||'无'}获胜`)}}
export function applyAction(state,action,random=Math.random){const s=structuredClone(state),p=s.players[s.current];if(!p||s.phase==='gameover')throw Error('对局已结束');let changed=true;switch(action.type){
 case'roll':{if(s.phase!=='roll')throw Error('现在不能掷骰');let d1=Math.floor(random()*6)+1,d2=Math.floor(random()*6)+1;s.lastDice=[d1,d2];if(p.jailed){p.jailTries++;if(d1===d2||p.jailTries>=MAX_JAIL_TURNS){p.jailed=0;p.jailTries=0;log(s,`${p.name} 掷出 ${d1}+${d2}，离开监狱`)}else{s.phase='finish';log(s,`${p.name} 未掷出对子，留在监狱（${p.jailTries}/${MAX_JAIL_TURNS}）`);break}}const old=p.pos,steps=d1+d2;p.pos=(old+steps)%32;if(old+steps>=32){const reward=200+(p.fortune?80:0);gain(s,p.id,reward);log(s,`${p.name} 经过起点，获得 ¥${reward}`)}log(s,`${p.name} 掷出 ${d1} + ${d2}，到达 ${BOARD[p.pos].name}`);land(s,p.pos,random);break}
 case'bail':{if(s.phase!=='roll'||!p.jailed)throw Error('现在不能保释');pay(s,p.id,100);p.jailed=0;p.jailTries=0;if(s.phase!=='debt')log(s,`${p.name} 支付 ¥100 保释金`);break}
 case'buy':{if(s.phase!=='decision'||s.pending?.kind!=='buy')throw Error('没有可购买的地块');const id=s.pending.id,t=BOARD[id];if(p.cash<t.price)throw Error('现金不足');p.cash-=t.price;s.properties[id]={owner:p.id,level:0,mortgaged:false,rail:t.type==='rail'};s.pending=null;s.phase='finish';log(s,`${p.name} 买下 ${t.name}，花费 ¥${t.price}`);break}
 case'skip':{if(s.phase!=='decision')throw Error('现在不能跳过');log(s,`${p.name} 放弃购买 ${BOARD[s.pending.id].name}`);s.pending=null;s.phase='finish';break}
 case'build':{const id=Number(action.id);if(!['roll','finish'].includes(s.phase)||!canBuild(s,id))throw Error('现在不能升级这块地产');const prop=s.properties[id],cost=buildCost(id,prop.level);if(p.cash<cost)throw Error('现金不足');p.cash-=cost;prop.level++;log(s,`${p.name} 将 ${BOARD[id].name} 升级为 ${['平房','小楼','公寓','大厦'][prop.level]}，花费 ¥${cost}`);break}
 case'sell':{const id=Number(action.id),prop=s.properties[id];if(!['roll','finish','debt'].includes(s.phase)||prop?.owner!==p.id||prop.level===0)throw Error('不能变卖');const value=Math.round(buildCost(id,prop.level-1)*.5);prop.level--;gain(s,p.id,value);log(s,`${p.name} 变卖 ${BOARD[id].name} 建筑，收回 ¥${value}`);if(s.phase==='debt'&&p.cash>=0){s.phase='finish';s.pending=null}break}
 case'mortgage':{const id=Number(action.id),prop=s.properties[id];if(!['roll','finish','debt'].includes(s.phase)||prop?.owner!==p.id||prop.mortgaged||prop.level>0)throw Error('不能抵押');prop.mortgaged=true;const value=Math.round(BOARD[id].price*.5);gain(s,p.id,value);log(s,`${p.name} 抵押 ${BOARD[id].name}，获得 ¥${value}`);if(s.phase==='debt'&&p.cash>=0){s.phase='finish';s.pending=null}break}
 case'redeem':{const id=Number(action.id),prop=s.properties[id];if(!['roll','finish'].includes(s.phase)||prop?.owner!==p.id||!prop.mortgaged)throw Error('不能赎回');const cost=Math.round(BOARD[id].price*.6);if(p.cash<cost)throw Error('现金不足');p.cash-=cost;prop.mortgaged=false;log(s,`${p.name} 赎回 ${BOARD[id].name}，花费 ¥${cost}`);break}
 case'bankrupt':{if(s.phase!=='debt')throw Error('没有待处理负债');p.bankrupt=true;p.cash=0;Object.keys(s.properties).forEach(id=>{if(s.properties[id].owner===p.id)delete s.properties[id]});log(s,`${p.name} 宣告破产，地产回收`);s.pending=null;s.phase='finish';next(s);break}
 case'end':{if(s.phase!=='finish')throw Error('当前回合尚未结束');next(s);break}
 default:changed=false;throw Error('未知操作')
}if(changed)s.seq++;return s}
