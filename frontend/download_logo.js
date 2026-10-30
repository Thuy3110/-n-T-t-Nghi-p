const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream('public/dau_logo.png');
const options = {
  hostname: 'upload.wikimedia.org',
  path: '/wikipedia/commons/6/64/Logo_dhktdn.png',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

https.get(options, function(response) {
  if (response.statusCode === 301 || response.statusCode === 302) {
    https.get(response.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded redirect successfully');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded successfully');
    });
  }
}).on('error', function(err) {
  fs.unlink('public/dau_logo.png', () => {});
  console.error('Error:', err.message);
});
