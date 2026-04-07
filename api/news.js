module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  async function fetchGdelt(query) {
    const params = new URLSearchParams({
      query,
      mode: 'ArtList',
      maxrecords: '10',
      format: 'json',
      sort: 'DateDesc'
    });
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json,text/plain,*/*' } });
    if (!response.ok) throw new Error(`gdelt failed ${response.status}`);
    const json = await response.json();
    const articles = Array.isArray(json?.articles) ? json.articles : [];
    return articles.slice(0, 6).map(item => ({
      title: item.title,
      url: item.url,
      source: item.domain || item.sourceCountry || 'News',
      seendate: item.seendate || null,
      seendateText: item.seendate ? item.seendate.replace('T', ' ').slice(0, 19) : null
    })).filter(x => x.title && x.url);
  }

  try {
    const [samsung, hynix] = await Promise.all([
      fetchGdelt('(samsung electronics OR 三星电子) AND (stock OR shares OR earnings OR semiconductor OR memory)'),
      fetchGdelt('("SK hynix" OR SK海力士) AND (stock OR shares OR earnings OR semiconductor OR memory)')
    ]);
    res.status(200).json({ samsung, hynix });
  } catch (error) {
    res.status(500).json({ error: error.message || 'news error' });
  }
};
