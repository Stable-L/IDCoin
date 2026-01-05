let tronWeb,user;
const IDC="TTyhFvHphvhbtWuTCKWPYt1mLTa4NjrRVQ";
const DEC=6;

async function waitTron(){
return new Promise((r,j)=>{
let t=setInterval(()=>{
if(window.tronWeb?.ready){clearInterval(t);r(tronWeb)}
},300);
});
}

async function connectWallet(){
tronWeb=await waitTron();
await tronWeb.request({method:"tron_requestAccounts"});
user=tronWeb.defaultAddress.base58;
walletAddress.innerText=user;
walletStatus.innerText="Connected";
loadBalance();
}

async function loadBalance(){
const c=await tronWeb.contract().at(IDC);
const b=await c.balanceOf(user).call();
idcBalance.innerText=(b/10**DEC).toLocaleString();
}

sendBtn.onclick=async()=>{
const c=await tronWeb.contract().at(IDC);
await c.transfer(sendTo.value,tronWeb.toSun(sendAmount.value,DEC)).send();
txStatus.innerText="Transaction sent";
};

connectBtn.onclick=connectWallet;

// Visitor
fetch("https://api.countapi.xyz/hit/idcoin-idc/visits")
.then(r=>r.json()).then(d=>visitors.innerText=d.value);

// Music
const music=bgMusic,gate=soundGate;
gate.onclick=()=>{
music.play();gate.style.display="none";musicBtn.innerText="🔊";
};
musicBtn.onclick=()=>{
music.paused?music.play():music.pause();
};

year.innerText=new Date().getFullYear();

function openFiatLeak(){
  document.getElementById("fiatModal").style.display = "flex";
}
function closeFiatLeak(){
  document.getElementById("fiatModal").style.display = "none";
}

/* =================================================
   TICKER TOP 100 CRYPTO — SMOOTH VERSION
   Source: CoinGecko (no API key)
================================================= */
async function loadCryptoTicker(){
  try{
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc" +
      "&per_page=100&page=1&sparkline=false"
    );

    const data = await res.json();
    const ticker = document.getElementById("tickerContent");

    ticker.innerHTML = "";

    data.forEach(c=>{
      const item = document.createElement("div");
      item.className = "ticker-item";

      item.innerHTML = `
        <img src="${c.image}" alt="${c.symbol}">
        <span class="ticker-symbol">${c.symbol.toUpperCase()}</span>
        $${c.current_price.toLocaleString()}
        <span style="color:${c.price_change_percentage_24h>=0?'#4caf50':'#ff5252'}">
          ${c.price_change_percentage_24h?.toFixed(2)}%
        </span>
      `;

      ticker.appendChild(item);
    });

    /* DUPLIKASI ISI → LOOP HALUS */
    ticker.innerHTML += ticker.innerHTML;

  }catch(err){
    console.error("Ticker error:", err);
    document.getElementById("tickerContent").innerText =
      "Market data unavailable";
  }
}

/* LOAD SEKALI */
loadCryptoTicker();

/* UPDATE DATA TIAP 5 MENIT (AMAN) */
setInterval(loadCryptoTicker, 300000);

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".main-nav a[href^='#']");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(sec => {
    const top = window.scrollY;
    if (top >= sec.offsetTop - 120) {
      current = sec.getAttribute("id");
    }
  });

  navLinks.forEach(a => {
    a.classList.remove("nav-active");
    if (a.getAttribute("href") === "#" + current) {
      a.classList.add("nav-active");
    }
  });
});

/* =================================================
   CRYPTO NEWS — STABLE + FALLBACK
================================================= */
async function fetchRSS(rssUrl){
  const api = "https://api.allorigins.win/get?url=" + encodeURIComponent(rssUrl);
  const res = await fetch(api);
  const data = await res.json();
  return new window.DOMParser().parseFromString(data.contents, "text/xml");
}

async function loadCryptoNews(){
  const container = document.getElementById("newsContainer");
  container.innerHTML = "Loading latest crypto news...";

  const sources = [
    "https://feeds.feedburner.com/CoinDesk",
    "https://cointelegraph.com/rss"
  ];

  for (const src of sources){
    try{
      const xml = await fetchRSS(src);
      const items = xml.querySelectorAll("item");

      container.innerHTML = "";

      items.forEach((item, i)=>{
        if(i >= 6) return;

        const title = item.querySelector("title")?.textContent;
        const link  = item.querySelector("link")?.textContent;
        const date  = item.querySelector("pubDate")?.textContent;

        const card = document.createElement("div");
        card.className = "news-card";

        card.innerHTML = `
          <a href="${link}" target="_blank" rel="noopener noreferrer">
            ${title}
          </a>
          <div class="news-source">
            ${new Date(date).toLocaleDateString()} • Crypto News
          </div>
        `;

        container.appendChild(card);
      });

      // kalau berhasil, STOP loop
      if(container.children.length > 0) return;

    }catch(e){
      console.warn("News source failed:", src);
    }
  }

  // kalau semua gagal
  container.innerHTML = `
    <div class="news-card">
      Crypto news temporarily unavailable.
      <br><small>Please refresh later.</small>
    </div>
  `;
}

/* LOAD SAAT HALAMAN DIBUKA */
loadCryptoNews();

// ===== BACKGROUND MUSIC CONTROL =====
const music = document.getElementById("bgMusic");
const gate  = document.getElementById("soundGate");
const btn   = document.getElementById("musicBtn");

// start music only after click
gate.onclick = () => {
  music.play();
  gate.style.display = "none";
  btn.innerText = "🔊";
};

// toggle music on/off
btn.onclick = () => {
  if (music.paused) {
    music.play();
    btn.innerText = "🔊";
  } else {
    music.pause();
    btn.innerText = "🔇";
  }
};

