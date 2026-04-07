module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbols = {
    samsung: '005930.KS',
    hynix: '000660.KS',
  };

  const fetchQuote = async (symbol) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json,text/plain,*/*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status} for ${symbol}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error(`No valid price for ${symbol}`);
    }

    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const change = typeof prevClose === 'number' ? price - prevClose : null;
    const changePct = typeof prevClose === 'number' && prevClose !== 0
      ? (change / prevClose) * 100
      : null;

    return {
      symbol,
      shortName: meta.shortName || symbol,
      currency: meta.currency || 'KRW',
      exchangeName: meta.exchangeName || 'KRX',
      marketState: meta.marketState || '',
      price,
      previousClose: prevClose,
      change,
      changePct,
      timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
    };
  };

  try {
    const [samsung, hynix] = await Promise.all([
      fetchQuote(symbols.samsung),
      fetchQuote(symbols.hynix),
    ]);

    return res.status(200).json({
      ok: true,
      updatedAt: Date.now(),
      data: {
        samsung,
        hynix,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Unknown error',
    });
  }
};
