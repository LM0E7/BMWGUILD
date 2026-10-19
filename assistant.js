/* BMW GUILD ASSISTANT. Catalog facts are mirrored from index.html; current prices sync from its public shop sheet. */
(() => {
  'use strict';
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1eXIIszAr9hC7v1PzLrcEUYla536ncidP275mTxndqgg/export?format=csv';
  const RATE = 100;
  const WA = '918797787737';
  const TG = 'JASH07X';
  const BUNDLE_ROWS = [
    ['44444','4B','4B','4B','4B','4B',0.60,'90 min','res_44444_90_price'],
    ['44444','4B','4B','4B','4B','4B',0.85,'40 min','res_44444_40_price'],
    ['44444','4B','4B','4B','4B','4B',1.60,'20 min','res_44444_20_price'],
    ['44442','4B','4B','4B','4B','2B',0.45,'','res_44442_price'],
    ['44440','4B','0','0','0','0',0.35,'','res_44440_price'],
    ['40000','4B','0','0','0','0',0.22,'','res_40000_price'],
    ['22222','2B','2B','2B','2B','2B',0.35,'','res_22222_price'],
    ['22221','2B','2B','2B','2B','1B',0.28,'','res_22221_price'],
    ['11111','1B','1B','1B','1B','1B',0.20,'','res_11111_price']
  ];
  const SUBSCRIPTIONS = [
    ['1 month','bank_c2_1m',1.10],['3 months','bank_c2_3m',3.00],
    ['6 months','bank_c2_6m',5.50],['12 months','bank_c2_12m',10.00]
  ];
  const prices = {
    leader_attack_price:3.50, customer_attack_price:2.00,
    t1_tier1_price:4.00, t1_tier2_price:6.00
  };
  let cart = readCart();
  let pending = null;
  let lastOptions = [];
  const $ = id => document.getElementById('sa-' + id);
  const log = $('log'), input = $('q'), chipBox = $('chips');
  const money = n => '$' + (Number(n)||0).toFixed(2);
  const inr = n => '₹' + Math.round((Number(n)||0)*RATE).toLocaleString('en-IN');
  const parseMoney = value => {
    const n = parseFloat(String(value ?? '').replace(/[^0-9.]/g,''));
    return Number.isFinite(n) ? n : null;
  };
  const normalize = text => String(text||'').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9!]+/g,' ').replace(/\s+/g,' ').trim();

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem('rls-cart') || '[]');
      return Array.isArray(value) ? value.filter(x => x && typeof x.n==='string' && Number(x.q)>0)
        .map(x => ({n:x.n,p:Number(x.p)||0,a:x.a?1:0,q:Math.min(99,Math.floor(Number(x.q)||1))})) : [];
    } catch (_) { return []; }
  }
  function saveCart() { try { localStorage.setItem('rls-cart',JSON.stringify(cart)); } catch (_) {} }
  function repeatEnabled() { try { return localStorage.getItem('rls-repeat')==='1'; } catch (_) { return false; } }
  function setRepeat(value) { try { localStorage.setItem('rls-repeat',value?'1':'0'); } catch (_) {} }

  function products() {
    const bundles=BUNDLE_ROWS.map(r=>({
      id:'bundle-'+r[0]+'-'+(r[7]||'standard'),kind:'bundle',code:r[0],mins:r[7].replace(' min',''),
      name:'Bundle '+r[0]+(r[7]?' · '+r[7]:'')+' (Food '+r[1]+', Stone '+r[2]+', Wood '+r[3]+', Ore '+r[4]+', Gold '+r[5]+')',
      price:prices[r[8]]??r[6],a:0,food:r[1],stone:r[2],wood:r[3],ore:r[4],gold:r[5]
    }));
    const subs=SUBSCRIPTIONS.map(([term,key,fallback])=>({id:'sub-'+term,kind:'subscription',term,name:term+' bank bot, Company 2',price:prices[key]??fallback,a:0}));
    return [...bundles,...subs,
      {id:'leader',kind:'attack',name:'Leader attack x30 (bank bot)',price:prices.leader_attack_price,a:1},
      {id:'customer',kind:'attack',name:'Customer attack (bank bot)',price:prices.customer_attack_price,a:1},
      {id:'t1a',kind:'t1',name:'Tier 1 T1 kills · 1–1,800 KD · 1B',price:prices.t1_tier1_price,a:0},
      {id:'t1b',kind:'t1',name:'Tier 2 T1 kills · 1,800–1,970 KD · 1B',price:prices.t1_tier2_price,a:0}
    ];
  }
  const allProducts=()=>products();
  function productById(id){return allProducts().find(x=>x.id===id);}
  function rememberOptions(list){lastOptions=list.map(p=>p.id);}
  function recalledOptions(){return lastOptions.map(productById).filter(Boolean);}
  function currentLines(){const rep=repeatEnabled();return cart.map(x=>({...x,u:x.a&&rep?x.p*.55:x.p}));}
  function subtotal(){return cart.reduce((s,x)=>s+x.p*x.q,0);}
  function total(){return currentLines().reduce((s,x)=>s+x.u*x.q,0);}
  function discountSavings(){return Math.max(0,subtotal()-total());}
  function updateCount(){ $('cartCount').textContent=cart.reduce((s,x)=>s+x.q,0); }
  function persistAndUpdate(){saveCart();updateCount();}
  function addProduct(product,qty=1){
    const n=Math.max(1,Math.min(99,Number(qty)||1));
    const existing=cart.find(x=>x.n===product.name);
    if(existing){existing.q=Math.min(99,existing.q+n);existing.p=product.price;existing.a=product.a?1:0;}
    else cart.push({n:product.name,p:product.price,a:product.a?1:0,q:n});
    persistAndUpdate();
    const unitPrice=product.a&&repeatEnabled()?product.price*.55:product.price;
    const discount=product.a&&repeatEnabled()?' (45% repeat discount applied)':'';
    return result('✅ Added '+n+' × '+product.name+' · '+money(unitPrice*n)+discount+'\nYour shared shop cart is updated.',{
      actions:[{t:'say',label:'🧾 View order',text:'my order'}],chips:['My order','Price list','Contact']
    });
  }
  function orderText(){
    const rows=currentLines();
    return 'Hello BMW GUILD, I want to order:\n'+rows.map(x=>'- '+x.n+' x'+x.q+' = '+money(x.u*x.q)).join('\n')+
      '\nSubtotal: '+money(subtotal())+(discountSavings()?'\nRepeat savings: -'+money(discountSavings()):'')+
      '\nTotal: '+money(total())+' ('+inr(total())+')'+(repeatEnabled()?'\n(Repeat order after 3 days, 45% off eligible bank bot attacks)':'');
  }
  function orderReply(){
    if(!cart.length)return result('Your shared shop order is empty. Add an item here or on the shop page, then return to see it here.',{
      actions:[{t:'link',label:'Open website order builder',href:'index.html#order',primary:true}],chips:['Price list','Bank bot subscription','Contact']
    });
    const rows=currentLines();
    const actions=[];
    rows.forEach(row=>{
      const product=allProducts().find(p=>p.name===row.n);
      if(product)actions.push({t:'dec-name',name:row.n,label:'− 1 '+shortName({name:row.n})});
      if(product)actions.push({t:'inc',id:product.id,label:'＋ '+shortName(product)});
      actions.push({t:'remove-name',name:row.n,label:'Remove '+shortName({name:row.n})});
    });
    const msg=orderText();
    actions.push({t:'link',label:'Send on WhatsApp',href:'https://wa.me/'+WA+'?text='+encodeURIComponent(msg),primary:true});
    actions.push({t:'link',label:'Send on Telegram',href:'https://t.me/'+TG+'?text='+encodeURIComponent(msg)});
    actions.push({t:'copy',label:'Copy order',text:msg});
    actions.push({t:'say',label:'Clear order',text:'clear order'});
    return result('🧾 Your shared shop order\n'+rows.map(x=>'• '+x.n+' ×'+x.q+' — '+money(x.u*x.q)).join('\n')+
      '\nSubtotal: '+money(subtotal())+(discountSavings()?'\nRepeat savings: −'+money(discountSavings()):'')+
      '\nTotal: '+money(total())+' ('+inr(total())+')'+
      '\n\nUse −1 / + to adjust quantities, or Remove to delete a line. This cart is shared with the website order builder in this browser. Confirm the final order and payment details with the seller.',
      {actions,chips:['Price list','Bank bot subscription','Contact']});
  }
  function shortName(p){return p.name.replace(/ \(Food.*$/,'').replace(' bank bot, Company 2',' sub').replace(' x30 (bank bot)','').replace(' · 1,800 KD · 1B','').replace(' · 1,970 KD · 1B','')}

  function editDistance(a,b){
    if(a===b)return 0;if(a.length>b.length)[a,b]=[b,a];
    let prev=Array.from({length:a.length+1},(_,i)=>i);
    for(let j=1;j<=b.length;j++){const row=[j];for(let i=1;i<=a.length;i++)row[i]=Math.min(row[i-1]+1,prev[i]+1,prev[i-1]+(a[i-1]===b[j-1]?0:1));prev=row;}
    return prev[a.length];
  }
  function phraseScore(input,phrase){
    const key=normalize(phrase);if(!key)return 0;
    if((' '+input+' ').includes(' '+key+' '))return 1.4+Math.min(key.length,30)/100;
    const words=input.split(' '),keys=key.split(' ');let hit=0;
    for(const k of keys){if(words.some(w=>w===k||(k.length>=5&&w.length>=4&&editDistance(w,k)===1)))hit++;}
    return keys.length>1?(hit/keys.length)*.74:hit?.67:0;
  }
  const INTENTS=[
    {id:'hi',keys:['hello','hi','hey','salam','namaste','good morning','good evening']},
    {id:'subscription',keys:['subscription','subscribe','monthly plan','company 2','one month','1 month','three month','3 months','six month','6 months','12 months','year plan','bank bot plan']},
    {id:'attacks',keys:['leader attack','customer attack','bank bot attack','attacks','30 leader','attack while i play']},
    {id:'bot',keys:['what is bank bot','bank bot','how bank bot works','how does it work']},
    {id:'t1',keys:['t1','t1 kills','tier 1 kills','t1 killing','kd','kill service','kills price']},
    {id:'resources',keys:['resource','resources','rss','bundle','food','stone','wood','ore','gold']},
    {id:'kvk',keys:['kvk','solo points','guild points','kvk points']},
    {id:'payment',keys:['payment','pay','upi','phonepe','paytm','binance pay','payment methods']},
    {id:'contact',keys:['contact','whatsapp','telegram','call','phone number','seller','support']},
    {id:'safety',keys:['safe','trust','legit','scam','secure','reliable']},
    {id:'commands',keys:['command','commands','guild bank command','setacc','guild bank']},
    {id:'tools',keys:['calculator','speedup','gem prediction','troop training','festival planner','player exp','wishlist','free tools']},
    {id:'hunt',keys:['monster hunt','monster hunting','hunting','lineup','hero lineup','monster lineup','heroes']},
    {id:'damage',keys:['damage type','damage types','physical','magic','weakness']},
    {id:'energy',keys:['energy','stamina','hunt energy']},
    {id:'repeat',keys:['repeat order','45% discount','discount after 3 days','repeat discount']},
    {id:'bye',keys:['bye','thanks','thank you','goodbye','appreciate it']}
  ];
  function bestIntent(input){
    const scored=INTENTS.map(intent=>({intent,score:Math.max(...intent.keys.map(k=>phraseScore(input,k)))})).sort((a,b)=>b.score-a.score);
    return scored[0]?.score>=.66?scored[0].intent.id:null;
  }
  function hasPrice(input){return /\b(price|prices|cost|costs|rate|rates|how much|what is the price)\b/.test(input);}
  function isINR(input){return /\b(inr|rs|rupees?|indian|₹)\b/.test(input);}
  function formatPrice(p,input){return money(p)+(isINR(input)?' ('+inr(p)+')':'');}

  function bundleReply(input){
    const code=(input.match(/\b(?:44444|44442|44440|40000|22222|22221|11111)\b/)||[])[0];
    if(!code)return null;
    let list=allProducts().filter(p=>p.kind==='bundle'&&p.code===code);
    const mins=input.match(/\b(90|40|20)\b/);if(mins){const chosen=list.filter(p=>p.mins===mins[1]);if(chosen.length)list=chosen;}
    rememberOptions(list);
    const text=list.map(p=>'📦 '+p.code+(p.mins?' · '+p.mins+' min':'')+'\n🌾 Food: '+p.food+'\n🪨 Stone: '+p.stone+'\n🪵 Wood: '+p.wood+'\n💎 Ore: '+p.ore+'\n🪙 Gold: '+p.gold+'\n💵 Price: '+formatPrice(p.price,input)).join('\n\n');
    const actions=list.map(p=>({t:'add',id:p.id,label:'＋ Add '+p.code+(p.mins?' · '+p.mins+' min':'')+' · '+formatPrice(p.price,input),primary:true}));
    if(input.startsWith('add ')||input.startsWith('buy ')||input.startsWith('order ')){
      const quantity=quantityOf(input);if(list.length===1)return addProduct(list[0],quantity);
      pending={kind:'bundle',list,quantity};
      return result('Bundle '+code+' has multiple delivery times. Which one would you like to add?',{actions:actions.map(a=>({...a,label:a.label.replace('＋ Add','Add')})),chips:list.map(p=>code+' '+p.mins+' min')});
    }
    return result(text,{actions,chips:['Price list','My order','Contact']});
  }
  function quantityOf(input){const m=input.match(/\bx\s*(\d{1,2})\b|\b(\d{1,2})x\b|\bquantity\s+(\d{1,2})\b|\b(\d{1,2})\s+(?:copies|units)\b|\bfor\s+(\d{1,2})\s+(?:copies|units)\b/);return m?Math.max(1,+(m[1]||m[2]||m[3]||m[4]||m[5])):1;}
  function listReply(list,title,input){
    rememberOptions(list);
    const text=title+'\n'+list.map(p=>'• '+p.name+' — '+formatPrice(p.price,input)).join('\n')+'\n\nAsk for the cheapest option, say “add the second one”, or use a button below.';
    return result(text,{actions:list.map(p=>({t:'add',id:p.id,label:'＋ Add '+shortName(p)+' · '+formatPrice(p.price,input)})),chips:['Cheapest option','Compare prices','My order']});
  }
  function compareReply(input){
    const all=allProducts();let list=null;
    if(/\b(bundle|bundles|resource|resources|rss|food|stone|wood|ore|gold)\b/.test(input))list=all.filter(p=>p.kind==='bundle');
    else if(/\b(subscription|subscriptions|month|months|plan|company 2)\b/.test(input))list=all.filter(p=>p.kind==='subscription');
    else if(/\b(attack|attacks|leader|customer)\b/.test(input))list=all.filter(p=>p.kind==='attack');
    else if(/\b(t1|tier|kills?)\b/.test(input))list=all.filter(p=>p.kind==='t1');
    else if(lastOptions.length)list=recalledOptions();
    if(!list?.length)return result('What would you like me to compare?',{chips:['Compare bundles','Compare subscriptions','Compare attacks','Compare T1 prices']});
    list.sort((a,b)=>a.price-b.price||a.name.localeCompare(b.name));
    return listReply(list,'Price comparison · lowest price first',input);
  }
  function cheapestReply(input){
    const all=allProducts();let list=null;
    if(/\b(bundle|bundles|resource|resources|rss|food|stone|wood|ore|gold)\b/.test(input))list=all.filter(p=>p.kind==='bundle');
    else if(/\b(subscription|subscriptions|month|months|plan|company 2)\b/.test(input))list=all.filter(p=>p.kind==='subscription');
    else if(/\b(attack|attacks|leader|customer)\b/.test(input))list=all.filter(p=>p.kind==='attack');
    else if(/\b(t1|tier|kills?)\b/.test(input))list=all.filter(p=>p.kind==='t1');
    else if(lastOptions.length)list=recalledOptions();
    if(!list?.length)return result('Which category should I check for the lowest price?',{chips:['Cheapest bundle','Cheapest subscription','Cheapest attack','Cheapest T1 service']});
    const item=list.sort((a,b)=>a.price-b.price||a.name.localeCompare(b.name))[0];
    return result('Lowest-priced option in these results: '+item.name+' — '+formatPrice(item.price,input)+'. Tap Add if you want it in your order.',{actions:[{t:'add',id:item.id,label:'＋ Add '+shortName(item)+' · '+formatPrice(item.price,input),primary:true}],chips:['Compare prices','My order']});
  }
  function optionReply(input){
    const options=recalledOptions();
    if(!options.length||/\b(clear|empty|reset|remove|delete|take off|my order|my cart|checkout|order summary|show order|view order)\b/.test(input))return null;
    if(/\b(price list|all prices|shop prices|prices|rates)\b/.test(input)&&!/\b(first|1st|second|2nd|third|3rd|last|that one|this one|it|option)\b/.test(input))return null;
    const add=/\b(add|buy|order)\b/.test(input),priceAsk=/\b(how much|price|cost|rate)\b/.test(input);
    if(add&&/\b(cheaper|cheapest|lowest|least expensive)\b/.test(input)){
      let pool=options.slice();
      if(/\b(bundle|resource|rss)\b/.test(input))pool=allProducts().filter(p=>p.kind==='bundle');
      else if(/\b(subscription|month|months|plan)\b/.test(input))pool=allProducts().filter(p=>p.kind==='subscription');
      else if(/\b(attack|leader|customer)\b/.test(input))pool=allProducts().filter(p=>p.kind==='attack');
      else if(/\b(t1|tier|kill)\b/.test(input))pool=allProducts().filter(p=>p.kind==='t1');
      const cheapest=pool.sort((a,b)=>a.price-b.price)[0];
      return cheapest?addProduct(cheapest,quantityOf(input)):null;
    }
    const ordinal=input.match(/\b(first|1st|second|2nd|third|3rd|last)\b/);
    const referent=/\b(that one|this one|it|them|those|option)\b/.test(input);
    if(!priceAsk&&!ordinal&&!referent)return null;
    let chosen=null;
    if(ordinal){const token=ordinal[1],index=token==='first'||token==='1st'?0:token==='second'||token==='2nd'?1:token==='third'||token==='3rd'?2:options.length-1;chosen=options[index]||null;}
    if(!chosen){const term=options.find(p=>p.term&&input.includes(normalize(p.term)));if(term)chosen=term;}
    if(!chosen){const code=(input.match(/\b(?:44444|44442|44440|40000|22222|22221|11111)\b/)||[])[0];if(code){const matches=options.filter(p=>p.code===code);const mins=input.match(/\b(90|40|20)\b/);chosen=mins?matches.find(p=>p.mins===mins[1]):matches.length===1?matches[0]:null;}}
    if(!chosen&&options.length===1)chosen=options[0];
    if(!chosen){
      return result('Which option did you mean? Choose one below, or say “first”, “second”, or “last”.',{actions:options.slice(0,8).map(p=>({t:'add',id:p.id,label:'＋ '+shortName(p)+' · '+formatPrice(p.price,input)})),chips:['Compare prices','My order']});
    }
    if(add)return addProduct(chosen,quantityOf(input));
    const qty=quantityOf(input),sum=formatPrice(chosen.price*qty,input);
    return result(chosen.name+' costs '+formatPrice(chosen.price,input)+' each. '+(qty>1?'For '+qty+': '+sum+'. ':'')+'Tap Add when you are ready.',{actions:[{t:'add',id:chosen.id,label:'＋ Add '+shortName(chosen)+(qty>1?' ×'+qty:'')+' · '+sum,primary:true}],chips:['My order','Compare prices']});
  }
  function priceList(input){
    const p=allProducts();
    rememberOptions(p);
    return result('Shop price list'+(isINR(input)?' (USD prices with approximate INR at $1 = ₹100)':'')+'\n\nRESOURCE BUNDLES\n'+
      p.filter(x=>x.kind==='bundle').map(x=>'• '+x.name.split(' (Food')[0]+' — '+formatPrice(x.price,input)).join('\n')+
      '\n\nBANK BOT SUBSCRIPTION · COMPANY 2\n'+p.filter(x=>x.kind==='subscription').map(x=>'• '+x.term+' — '+formatPrice(x.price,input)).join('\n')+
      '\n\nBANK BOT ATTACKS\n'+p.filter(x=>x.kind==='attack').map(x=>'• '+x.name+' — '+formatPrice(x.price,input)).join('\n')+
      '\n\nT1 KILLING SERVICE · PER 1B\n'+p.filter(x=>x.kind==='t1').map(x=>'• '+x.name+' — '+formatPrice(x.price,input)).join('\n')+
      '\n• Tier 3: 1,970+ KD — custom quote from seller.',
      {chips:['44444','Compare bundles','Compare subscriptions','My order']});
  }
  function subscriptionReply(input){
    let list=allProducts().filter(p=>p.kind==='subscription');
    const month=input.match(/\b(1|one|3|three|6|six|12|twelve)\s*(?:month|months|mo)\b/);
    if(month){const val=month[1];const wanted=({'one':'1','three':'3','six':'6','twelve':'12'})[val]||val;list=list.filter(p=>p.term.startsWith(wanted+' '));}
    return listReply(list,'Bank bot subscription · Company 2',input);
  }
  function t1Reply(input){
    let list=allProducts().filter(p=>p.kind==='t1');
    if(/tier\s*1|1\s*[-–]\s*1800|under 1800/.test(input))list=list.slice(0,1);
    else if(/tier\s*2|1800\s*[-–]\s*1970/.test(input))list=list.slice(1,2);
    return listReply(list,'T1 Killing Service · prices are per 1B T1 kills',input);
  }
  function attackReply(input){
    let list=allProducts().filter(p=>p.kind==='attack');
    if(/\bleader\b/.test(input))list=list.filter(p=>p.id==='leader');
    else if(/\bcustomer\b/.test(input))list=list.filter(p=>p.id==='customer');
    return listReply(list,'Bank bot attacks while you play',input);
  }
  function removeCommand(input){
    let candidates=allProducts();
    const code=(input.match(/\b(?:44444|44442|44440|40000|22222|22221|11111)\b/)||[])[0];
    if(code)candidates=candidates.filter(p=>p.kind==='bundle'&&p.code===code);
    else if(/subscription|\bsub\b|month/.test(input))candidates=candidates.filter(p=>p.kind==='subscription');
    else if(/leader|customer|attack/.test(input))candidates=candidates.filter(p=>p.kind==='attack'&&(!/leader/.test(input)||p.id==='leader')&&(!/customer/.test(input)||p.id==='customer'));
    else if(/t1|kill/.test(input))candidates=candidates.filter(p=>p.kind==='t1');
    const mins=input.match(/\b(90|40|20)\b/);if(mins)candidates=candidates.filter(p=>p.mins===mins[1]);
    const present=candidates.filter(p=>cart.some(x=>x.n===p.name));
    if(!present.length)return result('I could not find that item in your shared order. Say “my order” to see what is in it.',{chips:['My order','Price list']});
    if(present.length>1)return result('Which item would you like removed?',{actions:present.map(p=>({t:'remove-name',name:p.name,label:'Remove '+shortName(p)}))});
    cart=cart.filter(x=>x.n!==present[0].name);persistAndUpdate();return result('Removed '+present[0].name+' from your shared order.',{chips:['My order','Price list']});
  }
  function result(text,extra){return Object.assign({text},extra||{});}

  function reply(raw){
    const input=normalize(raw);if(!input)return result('Try asking about prices, subscriptions, bundles, T1 kills, tools, payment, or your order.',{chips:['Price list','My order','Contact']});
    if(pending&&pending.kind==='bundle'){
      const ordinal=input.match(/\b(first|1st|second|2nd|third|3rd)\b/);
      const explicitMinutes=input.match(/\b(90|40|20)\s*(?:min|mins|minute|minutes)\b/)||input.match(/^(90|40|20)$/);
      const index=ordinal?(ordinal[1]==='first'||ordinal[1]==='1st'?0:ordinal[1]==='second'||ordinal[1]==='2nd'?1:2):-1;
      const choice=index>=0?pending.list[index]:explicitMinutes?pending.list.find(p=>p.mins===explicitMinutes[1]):null;
      if(choice){const quantity=pending.quantity;pending=null;return addProduct(choice,quantity);}
      if(/cancel|never mind|nevermind/.test(input)){pending=null;return result('No problem — I cancelled that selection.',{chips:['Price list','My order']});}
      pending=null;
    }
    if(/\b(clear|empty|reset)\b.*\b(order|cart)\b/.test(input)){cart=[];persistAndUpdate();return result('Your shared shop order is cleared.',{chips:['Price list','Bank bot subscription']});}
    if(/\b(remove|delete|take off)\b/.test(input))return removeCommand(input);
    if(/\b(my order|my cart|cart|checkout|order summary|show order|view order)\b/.test(input))return orderReply();
    const adding=/^(add|buy|order)\b/.test(input);
    if(adding){
      const bundled=bundleReply(input);if(bundled)return bundled;
      const contextual=optionReply(input);if(contextual)return contextual;
      let item=null;
      if(/leader/.test(input))item=productById('leader');
      else if(/customer/.test(input))item=productById('customer');
      else if(/bank bot|subscription|\bsub\b|month/.test(input)){const sub=allProducts().filter(p=>p.kind==='subscription');const m=input.match(/\b(1|one|3|three|6|six|12|twelve)\s*(?:month|months|mo)\b/);if(m){const n=({'one':'1','three':'3','six':'6','twelve':'12'})[m[1]]||m[1];item=sub.find(p=>p.term.startsWith(n+' '));}}
      else if(/t1|\btier/.test(input)){const n=allProducts().filter(p=>p.kind==='t1');item=/tier\s*2|1800\s*[-–]\s*1970/.test(input)?n[1]:n[0];}
      if(item)return addProduct(item,quantityOf(input));
      if(/subscription|\bsub\b|month/.test(input))return subscriptionReply(input);
      if(/t1|\btier|kill/.test(input))return t1Reply(input);
      if(/leader|customer|attack/.test(input))return attackReply(input);
      return result('Tell me which item you want, for example “add 44444 90 x2”, “add 3 month subscription”, “add leader attack”, or “add T1 tier 1”.',{chips:['Price list','Bank bot subscription','T1 kills']});
    }
    const bundled=bundleReply(input);if(bundled)return bundled;
    if(/\bcompare\b/.test(input))return compareReply(input);
    if(/\b(cheaper|cheapest|lower priced|lowest price|least expensive)\b/.test(input))return cheapestReply(input);
    const contextual=optionReply(input);if(contextual)return contextual;
    if(/\b(price list|all prices|shop prices|prices|rates)\b/.test(input))return priceList(input);
    const intent=bestIntent(input);
    if(intent==='hi')return result('Hi! I can help with shop prices, bank bot subscriptions and attacks, resources, T1 kills, KVK quotes, site tools, or your order. What do you need?',{chips:['Price list','Bank bot subscription','T1 kills','My order']});
    if(intent==='subscription'||/\b(month|months|subscription|company 2)\b/.test(input))return subscriptionReply(input);
    if(intent==='attacks'||(/\b(leader|customer)\b/.test(input)&&hasPrice(input))||(/\bbank bot\b/.test(input)&&hasPrice(input)))return attackReply(input);
    if(intent==='bot')return result('The bank bot handles attacks while you play. The shop lists two attack services and Company 2 subscriptions. Tell me “bank bot subscription” for plan prices, or “leader attack” / “customer attack” for attack prices.',{chips:['Bank bot subscription','Leader attack','Customer attack','My order']});
    if(intent==='t1')return t1Reply(input);
    if(intent==='resources')return result('Resource bundles include Food, Stone, Wood, Ore and Gold. Type a bundle code such as 44444 or 22222 for the detailed breakdown, or ask for the full price list.',{chips:['44444','22222','Price list']});
    if(intent==='kvk')return result('Other services include KVK Solo Points and KVK Guild Points. These need a custom quote from the seller.',{actions:[{t:'link',label:'Ask on WhatsApp',href:'https://wa.me/'+WA,primary:true},{t:'link',label:'Ask on Telegram',href:'https://t.me/'+TG}],chips:['Price list','Contact']});
    if(intent==='payment')return result('The shop lists UPI payments through PhonePe, Paytm or another UPI app. The website shows UPI ID 8797787737@ptyes (Radhe Verma). Binance Pay is listed, but its payment details are temporarily unavailable. Please confirm your final order and payment details with the seller before paying.',{actions:[{t:'link',label:'Open order builder',href:'index.html#order'},{t:'link',label:'Contact seller',href:'https://wa.me/'+WA,primary:true}],chips:['My order','Contact']});
    if(intent==='contact')return result('Contact the seller:\n• WhatsApp / call: +91 87977 87737\n• Telegram: @JASH07X',{actions:[{t:'link',label:'WhatsApp',href:'https://wa.me/'+WA,primary:true},{t:'link',label:'Telegram',href:'https://t.me/'+TG},{t:'link',label:'Call',href:'tel:+91'+WA}],chips:['Price list','My order']});
    if(intent==='safety')return result('The website describes the shop as direct from the seller with no middleman. Confirm your order and payment details directly with the seller before paying.',{chips:['Contact','Payment methods','Price list']});
    if(intent==='commands')return result('The Guild Bank Command Center on the main site includes 67 commands with examples. For a player name with a space, use an underscore or quotes: !setacc Player_1 or !setacc "Player 1".',{actions:[{t:'link',label:'Open Guild Bank Command Center',href:'index.html#commands',primary:true}],chips:['Contact','Price list']});
    if(intent==='tools')return result('The site includes a Speedup Calculator, Gem Prediction, Troop Training Calculator, Guild Festival Planner, Player EXP Calculator, Gems Wishlist, and Monster Hunting Lineups. Which one are you looking for?',{actions:[{t:'link',label:'Speedup calculator',href:'index.html#calculator'},{t:'link',label:'Training calculator',href:'training.html'},{t:'link',label:'Festival planner',href:'festival.html'},{t:'link',label:'Player EXP calculator',href:'player-exp-calculator.html'},{t:'link',label:'Gems Wishlist',href:'gems-wishlist.html'},{t:'link',label:'Monster hunting',href:'hunting.html'}],chips:['Monster lineup','Contact']});
    if(intent==='hunt')return result('Monster Hunting Lineups are available on the site, with recommended heroes, damage types and hunting images. This assistant links you to that full lineup catalog rather than guessing a lineup.',{actions:[{t:'link',label:'Open Monster Hunting',href:'hunting.html',primary:true}],chips:['Price list','Contact']});
    if(intent==='damage')return result('Monster damage types and hero recommendations depend on the monster. Open the Monster Hunting page and choose the monster to see its lineup and damage details.',{actions:[{t:'link',label:'Open Monster Hunting',href:'hunting.html',primary:true}],chips:['Monster lineup','Contact']});
    if(intent==='energy')return result('Hunting uses Energy, which regenerates over time. Match your heroes to the monster’s weaknesses; the site’s Monster Hunting page contains the lineup details.',{actions:[{t:'link',label:'Open Monster Hunting',href:'hunting.html',primary:true}],chips:['Monster lineup']});
    if(intent==='repeat')return result('The website offers 45% off bank bot attacks for a repeat order after 3 days. Use the repeat-order checkbox above to apply it to eligible attacks; the seller confirms eligibility. It does not discount subscriptions, resource bundles or T1 services.',{chips:['My order','Bank bot subscription','Contact']});
    if(intent==='bye')return result('You’re welcome. BMW GUILD ASSISTANT!',{chips:['Price list','My order']});
    return result('I’m not sure I understood that yet. Try asking about “price list”, a bundle code like 44444, “bank bot subscription”, T1 kills, KVK points, payment, or “my order”.',{chips:['Price list','Bank bot subscription','T1 kills','Contact']});
  }

  function bubble(text,who){
    const row=document.createElement('div');row.className='row '+who;
    if(who==='bot'){const av=document.createElement('span');av.className='mini-avatar';av.textContent='Z';av.setAttribute('aria-hidden','true');row.appendChild(av);}
    const box=document.createElement('div');box.className='bubble';box.textContent=text;row.appendChild(box);log.appendChild(row);log.scrollTop=log.scrollHeight;return box;
  }
  function setChips(list){
    chipBox.textContent='';(list||['Price list','Bank bot subscription','T1 kills','My order','Contact']).forEach(label=>{
      const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>ask(label));chipBox.appendChild(b);
    });
  }
  function fallbackCopy(text,done){const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{if(document.execCommand('copy'))done();}catch(_){}area.remove();}
  function copyText(text,button){const old=button.textContent;const done=()=>{button.textContent='Copied';setTimeout(()=>button.textContent=old,1400);};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(done,()=>fallbackCopy(text,done));else fallbackCopy(text,done);}
  function decrementProduct(name){
    const item=cart.find(x=>x.n===name);if(!item)return result('That item is no longer in your shared order.',{chips:['My order','Price list']});
    if(item.q<=1)cart=cart.filter(x=>x.n!==name);else item.q--;
    persistAndUpdate();return result('Removed one unit of '+name+' from your shared order.',{chips:['My order','Price list']});
  }
  function performRemove(name){cart=cart.filter(x=>x.n!==name);persistAndUpdate();return result('Removed '+name+' from your shared order.',{chips:['My order','Price list']});}
  function show(r){
    const box=bubble(r.text,'bot');
    if(r.img){const img=document.createElement('img');img.src=r.img;img.alt=r.text.split('\n')[0];img.className='pic';img.onerror=()=>img.remove();box.appendChild(img);}
    if(r.actions?.length){const actions=document.createElement('div');actions.className='acts';r.actions.forEach(a=>{
      const el=a.t==='link'?document.createElement('a'):document.createElement('button');
      if(a.t==='link'){el.href=a.href;el.target=a.href.startsWith('http')?'_blank':'_self';el.rel='noopener noreferrer';}
      else{el.type='button';el.addEventListener('click',()=>{
        if(a.t==='add'){const product=productById(a.id);if(!product)return;const qty=pending?.kind==='bundle'?pending.quantity:1;pending=null;show(addProduct(product,qty));}
        else if(a.t==='inc'){const p=productById(a.id);if(p)show(addProduct(p,1));}
        else if(a.t==='dec-name')show(decrementProduct(a.name));
        else if(a.t==='remove-name')show(performRemove(a.name));
        else if(a.t==='say')ask(a.text);
        else if(a.t==='copy')copyText(a.text,el);
      });}
      el.className='act'+(a.primary?' primary':'');el.textContent=a.label;actions.appendChild(el);
    });box.appendChild(actions);}
    setChips(r.chips);log.scrollTop=log.scrollHeight;
  }
  function ask(text){if(!text)return;bubble(text,'me');const wait=bubble('Checking…','bot');wait.style.opacity='.65';setTimeout(()=>{wait.parentElement?.remove();show(reply(text));},160);}
  $('f').addEventListener('submit',event=>{event.preventDefault();const text=input.value.trim();if(!text)return;input.value='';ask(text);input.focus();});
  $('orderBtn').addEventListener('click',()=>ask('my order'));
  function setAssistantOpen(open){
    const app=document.getElementById('sa-app'),reopen=document.getElementById('sa-reopen');
    if(!app||!reopen)return;
    app.hidden=!open;reopen.hidden=open;
    document.body.classList.toggle('assistant-collapsed',!open);
    document.getElementById('sa-closeBtn')?.setAttribute('aria-expanded',String(open));
    document.getElementById('sa-reopenBtn')?.setAttribute('aria-expanded',String(open));
    if(open)setTimeout(()=>$('q').focus(),50);else document.getElementById('sa-reopenBtn')?.focus();
  }
  document.getElementById('sa-closeBtn')?.addEventListener('click',()=>setAssistantOpen(false));
  document.getElementById('sa-reopenBtn')?.addEventListener('click',()=>setAssistantOpen(true));
  const launcher=document.getElementById('assistantLauncher');
  if(launcher)launcher.addEventListener('click',()=>{if(document.body.classList.contains('assistant-collapsed'))setAssistantOpen(true);setTimeout(()=>$('q').focus(),450);});
  const assistantSection=document.getElementById('assistant');
  if(assistantSection&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      document.body.classList.toggle('assistant-visible',entries.some(entry=>entry.isIntersecting));
    },{threshold:0.04});
    observer.observe(assistantSection);
  }
  $('repeatToggle').checked=repeatEnabled();
  $('repeatToggle').addEventListener('change',event=>{setRepeat(event.target.checked);window.dispatchEvent(new Event('zax-cart-updated'));});
  window.addEventListener('storage',event=>{
    if(event.key==='rls-cart'){cart=readCart();updateCount();}
    if(event.key==='rls-repeat')$('repeatToggle').checked=repeatEnabled();
  });
  window.addEventListener('zax-cart-updated',()=>{updateCount();});
  updateCount();
  bubble('Hi! I’m the BMW GUILD ASSISTANT. I can compare current prices, explain shop services, and help manage the same order cart used on the main website. Try “compare subscriptions”, “add the second one”, “44444”, or “my order”.','bot');
  setChips(['Price list','Compare prices','Bank bot subscription','My order','Contact']);

  function parseCsv(csv){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<csv.length;i++){const c=csv[i];if(quoted){if(c==='"'&&csv[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
    if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    const head=rows.shift()||[];return rows.map(r=>Object.fromEntries(head.map((key,i)=>[key.trim(),(r[i]||'').trim()])));
  }
  async function syncPrices(){
    const status=$('priceStatus');
    try{
      const response=await fetch(SHEET_CSV_URL,{cache:'no-store'});if(!response.ok)throw new Error('sheet unavailable');
      const rows=parseCsv(await response.text());const values=Object.fromEntries(rows.map(r=>[r.key,r.value]));
      for(const [key,value] of Object.entries(values)){const price=parseMoney(value);if(price!==null)prices[key]=price;}
      status.textContent='Live prices synced';status.title='Synced from the shop price sheet';status.style.color='var(--green)';
    }catch(_){status.textContent='Offline prices';status.title='Could not reach the price sheet; using built-in shop prices';}
  }
  syncPrices();
})();
