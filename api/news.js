module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  function decodeXml(str){
    return String(str || '')
      .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  function textBetween(source, startTag, endTag){
    const start = source.indexOf(startTag);
    const end = source.indexOf(endTag);
    if(start === -1 || end === -1 || end <= start) return null;
    return source.slice(start + startTag.length, end).trim();
  }
  function parseItems(xml){
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, 6).map(item => {
      const title = decodeXml(textBetween(item, '<title>', '</title>') || '');
      const link = decodeXml(textBetween(item, '<link>', '</link>') || '');
      const pubDate = decodeXml(textBetween(item, '<pubDate>', '</pubDate>') || '');
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const source = decodeXml(sourceMatch?.[1] || '');
      return { title, link, source: source || 'Google News', pubDate, pubDateText: pubDate ? new Date(pubDate).toLocaleString('zh-CN', { hour12:false }) : null };
    }).filter(x => x.title && x.link);
  }

  async function fetchNews(query){
    const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
    const response = await fetch(rss, { headers:{ 'User-Agent':'Mozilla/5.0' } });
    if(!response.ok) throw new Error(`rss failed ${response.status}`);
    const xml = await response.text();
    return parseItems(xml);
  }

  try {
    const [samsung, hynix] = await Promise.all([
      fetchNews('Samsung Electronics OR 三星电子 stock'),
      fetchNews('SK hynix OR SK海力士 stock')
    ]);
    res.status(200).json({ samsung, hynix });
  } catch (error) {
    res.status(500).json({ error: error.message || 'news error' });
  }
};
