const http = require('http');

const data = JSON.stringify({
  name: "icmarket",
  broker: "metatrader",
  credentials: {
    login: "52863718",
    password: "password"
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/masters',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${responseBody}`);
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(data);
req.end();
