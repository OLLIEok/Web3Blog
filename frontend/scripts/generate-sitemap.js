const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');

const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/home', changefreq: 'weekly', priority: 0.9 },
];

const stream = new SitemapStream({ hostname: 'https://www.0xdoomxy.top' });
const data = Readable.from(links).pipe(stream);

streamToPromise(data).then((sitemap) => 
  createWriteStream('./public/sitemap.xml').write(sitemap.toString())
); 