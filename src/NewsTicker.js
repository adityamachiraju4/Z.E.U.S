import React, { useState, useEffect } from 'react';

const RSS_FEEDS = [
  'https://feeds.feedburner.com/TheHackersNews',
  'https://www.bleepingcomputer.com/feed/',
];

const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const results = await Promise.allSettled(
          RSS_FEEDS.map(feed =>
            fetch(`${CORS_PROXY}${encodeURIComponent(feed)}`)
              .then(r => r.json())
          )
        );
        const items = results
          .filter(r => r.status === 'fulfilled' && r.value.items)
          .flatMap(r => r.value.items.slice(0, 5))
          .map(item => item.title)
          .filter(Boolean);
        if (items.length > 0) setHeadlines(items);
      } catch (e) {
        console.error('RSS fetch error:', e);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const display = headlines.length > 0
    ? [...headlines, ...headlines]
    : ['ACQUIRING INTELLIGENCE FEED — CYBERSECURITY THREAT MONITOR ACTIVE'];

  return (
    <div className="news-ticker">
      <span className="ticker-label">INTEL</span>
      <div className="ticker-track">
        <div className="ticker-inner">
          {display.map((h, i) => (
            <span key={i} className="ticker-item">
              {h} <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsTicker;