const CATEGORIES = [
  { id:"protein", name:"Protein" },
  { id:"groceries", name:"Groceries" },
  { id:"delivery", name:"Delivery" },
  { id:"bills", name:"Bills" },
  { id:"clothes", name:"Clothes" },
  { id:"vacations", name:"Vacations" },
  { id:"electronics", name:"Electronics" }
];

let currency = "ILS";
const RECENT_DAYS = 3;

const fmt = (n) =>
  new Intl.NumberFormat(undefined,{style:"currency",currency}).format(Math.abs(n||0));

function todayISO(){
  const d=new Date();
  return d.toISOString().slice(0,10);
}

function monthKey(d=new Date()){
  return d.toISOString().slice(0,7);
}

function load(){
  return JSON.parse(localStorage.getItem("data")||"{}");
}

function save(data){
  localStorage.setItem("data",JSON.stringify(data));
}

function getMonthData(m){
  const data=load();
  return (data.transactions||[]).filter(t=>t.month===m);
}

function addTransaction(t){
  const data=load();
  data.transactions=data.transactions||[];
  data.transactions.push(t);
  save(data);
}

function undoLastTransaction(){
  const data=load();
  const txs=data.transactions||[];
  if(!txs.length) return false;
  txs.pop();
  data.transactions=txs;
  save(data);
  return true;
}

function resetCurrentMonth(category=null){
  const data=load();
  const m=monthKey();
  const txs=data.transactions||[];

  data.transactions=txs.filter(t=>{
    if(t.month!==m) return true;
    if(!category) return false;
    return t.category!==category;
  });

  save(data);
}

function refresh(){
  const m=monthKey();
  document.getElementById("monthLabel").textContent="Month: "+m;

  const txs=getMonthData(m);
  const total=txs.reduce((s,x)=>s+x.amount,0);
  const savings=txs.reduce((s,x)=>s+x.couponSavings,0);

  document.getElementById("monthSpending").textContent=fmt(total);
  document.getElementById("monthSavings").textContent=fmt(savings);

  document.getElementById("entriesCount").textContent=txs.length+" entries";

  const list=document.getElementById("entriesList");
  list.innerHTML="";
  txs.forEach(t=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<div>${t.category}</div><div>${fmt(t.amount)}</div>`;
    list.appendChild(div);
  });

  renderCategories(txs);
  renderSnapshots();
}

function renderCategories(txs){
  const wrap=document.getElementById("categoryBreakdown");
  wrap.innerHTML="";
  CATEGORIES.forEach(c=>{
    const total=txs.filter(x=>x.category===c.id)
      .reduce((s,x)=>s+x.amount,0);
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<div>${c.name}</div><div>${fmt(total)}</div>`;
    wrap.appendChild(div);
  });
}

function renderSnapshots(){
  const data=load();
  const all=data.transactions||[];
  const months=[...new Set(all.map(x=>x.month))].sort().reverse();
  const list=document.getElementById("snapshotsList");
  list.innerHTML="";
  months.slice(0,12).forEach(m=>{
    const txs=all.filter(x=>x.month===m);
    const total=txs.reduce((s,x)=>s+x.amount,0);
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<div>${m}</div><div>${fmt(total)}</div>`;
    list.appendChild(div);
  });
}

document.getElementById("quickProteinBtn").onclick=()=>{
  const amount=prompt("Protein amount?");
  if(!amount)return;
  const value=Math.round(parseFloat(amount)*100)/100;
  addTransaction({
    id:Date.now(),
    category:"protein",
    amount:-Math.abs(value),
    couponSavings:0,
    date:todayISO(),
    month:monthKey()
  });
  refresh();
};

document.getElementById("addExpenseBtn").onclick=()=>{
  const cat=prompt("Category id: protein, groceries, delivery, bills, clothes, vacations, electronics");
  if(!cat)return;
  const amount=prompt("Amount?");
  if(!amount)return;
  const value=Math.round(parseFloat(amount)*100)/100;
  addTransaction({
    id:Date.now(),
    category:cat,
    amount:-Math.abs(value),
    couponSavings:0,
    date:todayISO(),
    month:monthKey()
  });
  refresh();
};

document.getElementById("undoLastBtn").onclick=()=>{
  const ok=confirm("Undo last transaction?");
  if(!ok) return;
  const changed=undoLastTransaction();
  if(!changed){
    alert("No transactions to undo.");
    return;
  }
  refresh();
};

document.getElementById("resetBtn").onclick=()=>{
  const input=prompt("Type category id to reset only that category for this month, or leave empty to reset the whole month.");
  if(input===null) return;
  const category=input.trim()||null;

  if(category && !CATEGORIES.some(c=>c.id===category)){
    alert("Invalid category id.");
    return;
  }

  const ok=confirm(
    category
      ? `Reset current month entries for "${category}"?`
      : "Reset ALL current month entries?"
  );
  if(!ok) return;

  resetCurrentMonth(category);
  refresh();
};

refresh();
