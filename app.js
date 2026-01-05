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


year.innerText=new Date().getFullYear();

function openFiatLeak(){
  document.getElementById("fiatModal").style.display = "flex";
}
function closeFiatLeak(){
  document.getElementById("fiatModal").style.display = "none";
}

/* =================================================
   TICKER — SMART FALLBACK (SunSwap → CoinGecko → Text)
================================================= */
async function loadCryptoTicker(){
  const ticker = document.getElementById("tickerContent");
  ticker.innerHTML = "";

  /* ===== 1️⃣ TRY SUNSWAP (TRONLINK READY) ===== */
  try{
    if (window.tronWeb?.ready) {

      const idcPrice = await getPriceFromLP(IDC_LP, IDC_TOKEN, IDC_DEC);
      const aecPrice = await getPriceFromLP(AEC_LP, AEC_TOKEN, AEC_DEC);

      ticker.innerHTML = `
        <div class="ticker-item">
          <img src="assets/logo.png">
          <span class="ticker-symbol">IDC</span>
          <span class="ticker-price">$${idcPrice.toFixed(4)}</span>
          <span style="color:#4caf50;">LIVE</span>
        </div>

        <div class="ticker-item">
          <img src="assets/aecoin.png">
          <span class="ticker-symbol">AEC</span>
          <span class="ticker-price">$${aecPrice.toFixed(4)}</span>
          <span style="color:#4caf50;">LIVE</span>
        </div>
      `;

      ticker.innerHTML += ticker.innerHTML;
      return;
    }
  } catch(e){
    console.warn("SunSwap not ready");
  }

  /* ===== 2️⃣ FALLBACK COINGECKO (NO WALLET NEEDED) ===== */
  try{
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=20&page=1"
    );
    const data = await res.json();

    ticker.innerHTML = `
      <div class="ticker-item">
        <img src="assets/logo.png">
        <span class="ticker-symbol">IDC</span>
        <span class="ticker-price">$1.00</span>
        <span style="color:#4caf50;">PEG</span>
      </div>

      <div class="ticker-item">
        <img src="assets/aecoin.png">
        <span class="ticker-symbol">AEC</span>
        <span class="ticker-price">$0.27</span>
        <span style="color:#4caf50;">REF</span>
      </div>
    `;

    data.forEach(c=>{
      ticker.innerHTML += `
        <div class="ticker-item">
          <img src="${c.image}">
          <span class="ticker-symbol">${c.symbol.toUpperCase()}</span>
          <span class="ticker-price">$${c.current_price.toLocaleString()}</span>
        </div>
      `;
    });

    ticker.innerHTML += ticker.innerHTML;
    return;

  } catch(e){
    console.warn("CoinGecko fallback failed");
  }

  /* ===== 3️⃣ LAST RESORT TEXT ===== */
  ticker.innerHTML = `
    <div class="ticker-item">
      🌍 Global Crypto Market • Stable • Secure • Transparent • Powered by TRON
    </div>
    <div class="ticker-item">
      🌍 Global Crypto Market • Stable • Secure • Transparent • Powered by TRON
    </div>
  `;
}


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

/* ================= BACKGROUND MUSIC ================= */
const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
const soundGate = document.getElementById("soundGate");

// volume aman
bgMusic.volume = 0.3;

// play after user interaction
soundGate.addEventListener("click", () => {
  bgMusic.play();
  soundGate.style.display = "none";
  musicBtn.innerText = "🔊";
});

// toggle on/off
musicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.innerText = "🔊";
  } else {
    bgMusic.pause();
    musicBtn.innerText = "🔇";
  }
});

loadCryptoTicker();
setInterval(loadCryptoTicker, 30000);




