module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const marketStateMap = { REGULAR:'正常交易', CLOSED:'已收盘', PRE:'盘前', POST:'盘后', PREPRE:'盘前', POSTPOST:'盘后' };

  function safeNumber(v){ return typeof v === 'number' && Number.isFinite(v) ? v : null; }
  function formatTime(ts){
    if(!ts) return null;
    try { return new Date(ts * 1000).toLocaleString('zh-CN', { hour12:false, timeZone:'Asia/Seoul' }); }
    catch { return null; }
  }

  async function fetchQuote(symbol){
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const response = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0', 'Accept':'application/json,text/plain,*/*' } });
    if(!response.ok) throw new Error(`chart failed: ${symbol} ${response.status}`);
    const json = await response.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if(!meta) throw new Error(`no meta for ${symbol}`);

    const price = safeNumber(meta.regularMarketPrice);
    const previousClose = safeNumber(meta.previousClose);
    const open = safeNumber(meta.regularMarketOpen);
    const dayHigh = safeNumber(meta.regularMarketDayHigh);
    const dayLow = safeNumber(meta.regularMarketDayLow);
    const volume = safeNumber(meta.regularMarketVolume);
    const marketCap = safeNumber(meta.marketCap);
    const trailingPE = safeNumber(meta.trailingPE);
    const change = (price != null && previousClose != null) ? price - previousClose : null;
    const changePercent = (change != null && previousClose) ? (change / previousClose) * 100 : null;

    return {
      symbol, price, previousClose, open, dayHigh, dayLow, volume, marketCap,
      marketCapText: marketCap != null ? new Intl.NumberFormat('en-US', { notation:'compact', maximumFractionDigits:2 }).format(marketCap) : null,
      trailingPE, change, changePercent,
      marketState: meta.marketState || null,
      marketStateText: marketStateMap[meta.marketState] || meta.marketState || null,
      regularMarketTime: meta.regularMarketTime || null,
      regularMarketTimeText: formatTime(meta.regularMarketTime)
    };
  }

  try {
    const [samsung, hynix] = await Promise.all([fetchQuote('005930.KS'), fetchQuote('000660.KS')]);
    res.status(200).json({ samsung, hynix });
  } catch (error) {
    res.status(500).json({ error: error.message || 'quotes error' });
  }
};
