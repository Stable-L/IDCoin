/* ================= WALLET SETUP ================= */

let tronWeb = null;
let user = null;

const IDC = "TTyhFvHphvhbtWuTCKWPYt1mLTa4NjrRVQ";
const DEC = 6;

// bind element (WAJIB)
const walletAddress = document.getElementById("walletAddress");
const walletStatus  = document.getElementById("walletStatus");
const idcBalance    = document.getElementById("idcBalance");
const connectBtn    = document.getElementById("connectBtn");
const sendBtn       = document.getElementById("sendBtn");
const sendTo        = document.getElementById("sendTo");
const sendAmount    = document.getElementById("sendAmount");
const txStatus      = document.getElementById("txStatus");

/* ================= WAIT TRONLINK ================= */
function waitTron(){
  return new Promise(resolve=>{
    const t = setInterval(()=>{
      if(window.tronWeb && window.tronWeb.ready){
        clearInterval(t);
        resolve(window.tronWeb);
      }
    },300);
  });
}

/* ================= CONNECT WALLET ================= */
async function connectWallet(){
  try{
    tronWeb = await waitTron();

    await tronWeb.request({ method:"tron_requestAccounts" });

    user = tronWeb.defaultAddress.base58;

    walletAddress.innerText = user;
    walletStatus.innerText  = "Connected";

    await loadBalance();

  }catch(err){
    console.error("Connect wallet error:", err);
    walletStatus.innerText = "Connection failed";
  }
}

/* ================= LOAD BALANCE ================= */
async function loadBalance(){
  try{
    const contract = await tronWeb.contract().at(IDC);
    const balance  = await contract.balanceOf(user).call();

    idcBalance.innerText =
      (Number(balance) / 10 ** DEC).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:6
      });

  }catch(err){
    console.error("Load balance error:", err);
    idcBalance.innerText = "Error";
  }
}

/* ================= SEND TOKEN ================= */
sendBtn.addEventListener("click", async ()=>{
  try{
    if(!tronWeb || !user){
      alert("Connect wallet first");
      return;
    }

    const amount = Number(sendAmount.value);
    if(amount <= 0){
      alert("Invalid amount");
      return;
    }

    const contract = await tronWeb.contract().at(IDC);

    const tx = await contract.transfer(
      sendTo.value,
      BigInt(amount * 10 ** DEC)
    ).send();

    txStatus.innerText = "Transaction sent";
    await loadBalance();

  }catch(err){
    console.error("Send token error:", err);
    txStatus.innerText = "Transaction failed";
  }
});

/* ================= BUTTON ================= */
connectBtn.addEventListener("click", connectWallet);


/* ================= VISITOR COUNTER (SAFE MODE) ================= */
document.addEventListener("DOMContentLoaded", async () => {

  const visitorsEl = document.getElementById("visitors");
  if (!visitorsEl) return;

  try{
    const res = await fetch(
      "https://api.countapi.xyz/get/idcoin-idc/visits",
      { cache: "no-store" }
    );

    if(!res.ok) throw new Error("API blocked");

    const data = await res.json();
    visitorsEl.textContent = (data.value || 0).toLocaleString();

  }catch(err){
    console.warn("Visitor counter disabled:", err);
    visitorsEl.textContent = "0";
  }

});


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








