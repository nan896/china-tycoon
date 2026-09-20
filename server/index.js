import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {randomBytes} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGame,applyAction} from '../shared/game.js';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dataDir=join(root,'data');mkdirSync(dataDir,{recursive:true});
const dbFile=join(dataDir,'rooms.json');
let rooms={};try{rooms=JSON.parse(readFileSync(dbFile,'utf8'))}catch{}
const save=()=>writeFileSync(dbFile,JSON.stringify(rooms));
const app=express();app.disable('x-powered-by');
app.get('/api/network',(_req,res)=>{const lans=Object.values(networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal).map(x=>x.address);res.json({port,local:`http://localhost:${port}`,lan:lans.map(ip=>`http://${ip}:${port}`)})});
const dist=join(root,'dist');
if(existsSync(dist)){app.use(express.static(dist,{dotfiles:'deny'}));app.get(/.*/,(req,res)=>res.sendFile(join(dist,'index.html')))}
else app.get('/',(_req,res)=>res.status(503).send('请先运行 npm run build'));
const http=createServer(app);const io=new Server(http,{cors:{origin:true}});
const token=()=>randomBytes(24).toString('hex');
const code=()=>{let x;do{x=randomBytes(3).toString('hex').toUpperCase()}while(rooms[x]);return x};
const cleanName=x=>String(x||'玩家').trim().slice(0,16)||'玩家';
function publicRoom(room){return {code:room.code,host:room.host,count:room.count,rounds:room.rounds,cash:room.cash,players:room.players.map(p=>({id:p.id,name:p.name,connected:p.connected,host:p.id===room.host,color:p.color})),game:room.game||null,started:!!room.game}}
function emit(room){io.to(room.code).emit('room',publicRoom(room))}
function respond(cb,value){if(typeof cb==='function')cb(value)}
function fail(cb,error){respond(cb,{ok:false,error})}
io.on('connection',socket=>{
  let active=null;
  socket.on('create',(input,cb)=>{try{const count=Math.max(2,Math.min(4,Number(input.count)||2));const roomCode=code(),identity=token();const room={code:roomCode,host:0,count,rounds:Math.max(3,Math.min(100,Number(input.rounds)||20)),cash:Math.max(500,Math.min(10000,Number(input.cash)||1500)),players:[{id:0,name:cleanName(input.name),token:identity,connected:true,color:'#f05c45'}],game:null};rooms[roomCode]=room;socket.join(roomCode);active={code:roomCode,id:0};save();respond(cb,{ok:true,token:identity,room:publicRoom(room)});emit(room)}catch(e){fail(cb,e.message)}});
  socket.on('join',(input,cb)=>{const room=rooms[String(input.code||'').toUpperCase()];if(!room)return fail(cb,'找不到房间');if(room.game)return fail(cb,'对局已经开始');if(room.players.length>=room.count)return fail(cb,'房间已满');const id=room.players.length,identity=token();const colors=['#f05c45','#20a894','#f4ba37','#5c8ee6'];room.players.push({id,name:cleanName(input.name),token:identity,connected:true,color:colors[id]});socket.join(room.code);active={code:room.code,id};save();respond(cb,{ok:true,token:identity,room:publicRoom(room)});emit(room)});
  socket.on('resume',(input,cb)=>{const room=rooms[String(input.code||'').toUpperCase()];const player=room?.players.find(p=>p.token===input.token);if(!player)return fail(cb,'身份已失效，请重新加入');player.connected=true;socket.join(room.code);active={code:room.code,id:player.id};save();respond(cb,{ok:true,room:publicRoom(room)});emit(room)});
  socket.on('start',(_input,cb)=>{const room=rooms[active?.code];if(!room||active.id!==room.host)return fail(cb,'只有房主可以开始');if(room.game)return fail(cb,'对局已经开始');if(room.players.length!==room.count)return fail(cb,'请等待所有玩家加入');room.game=createGame({count:room.count,cash:room.cash,rounds:room.rounds,seats:room.players.map(p=>({name:p.name,type:'human'}))});save();respond(cb,{ok:true});emit(room)});
  socket.on('action',(input,cb)=>{const room=rooms[active?.code];if(!room?.game)return fail(cb,'对局未开始');if(room.players[active.id]?.token!==input.token)return fail(cb,'身份校验失败');if(room.game.current!==active.id)return fail(cb,'还没轮到你');try{room.game=applyAction(room.game,input.action);save();respond(cb,{ok:true});emit(room)}catch(e){fail(cb,e.message)}});
  socket.on('disconnect',()=>{const room=rooms[active?.code],player=room?.players[active?.id];if(player){player.connected=false;save();emit(room)}});
});
const port=Number(process.env.PORT)||4173;http.listen(port,'0.0.0.0',()=>{const lans=Object.values(networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal).map(x=>x.address);console.log(`神州大富翁已启动\n本机: http://localhost:${port}\n局域网: ${lans.map(ip=>`http://${ip}:${port}`).join('  ')}\n联机范围：同一局域网`)});
