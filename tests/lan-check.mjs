import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const contexts=await Promise.all([0,1,2].map(()=>browser.newContext({viewport:{width:1280,height:720}})));
const pages=await Promise.all(contexts.map(c=>c.newPage()));const errors=[];pages.forEach((p,i)=>p.on('pageerror',e=>errors.push(`${i}: ${e.message}`)));
await pages[0].goto('http://localhost:4173');await pages[0].getByText('联机房间', {exact:true}).first().click();await pages[0].locator('input').first().fill('甲');await pages[0].getByText('创建房间',{exact:true}).click();
await pages[0].locator('.room-code').waitFor();const code=await pages[0].locator('.room-code').textContent();
for(let i=1;i<3;i++){await pages[i].goto(`http://localhost:4173/?room=${code}`);await pages[i].locator('input').first().fill(['','乙','丙'][i]);await pages[i].getByText('加入对局',{exact:true}).click();await pages[i].locator('.room-code').waitFor()}
console.log('room',code,await pages[0].locator('.lobby-seat strong').allTextContents());
await pages[0].getByText('开始游戏',{exact:true}).click();await Promise.all(pages.map(p=>p.locator('canvas').waitFor()));
console.log('initial',await Promise.all(pages.map(p=>p.locator('.player-money').allTextContents())));
await pages[0].getByText('掷骰前进').click();await pages[0].waitForTimeout(3100);
let phase=await pages[0].locator('.phase-note').textContent();if(phase.includes('是否购入'))await pages[0].getByText('购买',{exact:false}).first().click();else if(phase.includes('旅程'))throw Error('roll did not advance');
let balances;for(let attempt=0;attempt<15;attempt++){await pages[0].waitForTimeout(300);balances=await Promise.all(pages.map(p=>p.locator('.player-money').allTextContents()));if(balances.every(b=>JSON.stringify(b)===JSON.stringify(balances[0]))&&balances[0][0]!=='¥1,500')break}if(!balances.every(b=>JSON.stringify(b)===JSON.stringify(balances[0])))throw Error('room state differs across clients');console.log('after action',balances);
await pages[0].getByText('结束回合').click();await pages[1].getByText('掷骰前进').waitFor();console.log('next',await Promise.all(pages.map(p=>p.locator('.action-panel h2').textContent())));
await pages[1].reload();await pages[1].locator('canvas').waitFor();console.log('reconnect',await pages[1].locator('.connection').textContent());
console.log('errors',errors);await browser.close();
