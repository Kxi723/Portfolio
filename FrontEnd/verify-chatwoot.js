const https = require('https');

const token = 'zcd86VFZwXokBvB43nrEGJ1v';

// Based on user curl, the relevant API is under /api/v1/widget
// The first step should be creating a contact to get a session
const options = {
    hostname: 'app.chatwoot.com',
    port: 443,
    path: `/api/v1/widget/contacts?website_token=${token}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://app.chatwoot.com' // Mimic origin just in case
    }
};

const req = https.request(options, (res) => {
    console.log(`[POST ${options.path}] statusCode: ${res.statusCode}`);

    let body = '';
    res.on('data', (d) => {
        body += d;
    });

    res.on('end', () => {
        console.log('Response Body:', body.substring(0, 500));
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(JSON.stringify({
    identifier: "test-user-custom-id-" + Date.now(),
    name: "Custom Chat User"
}));
req.end();
