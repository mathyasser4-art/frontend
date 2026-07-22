const Pusher = require('pusher-js');

// Mock browser env for pusher-js in Node if needed, or just let it run if it supports node
Pusher.logToConsole = true;
const pusher = new Pusher('app_e4ed3fcd3045501a594c2640c4d2dd75832ff677', {
    cluster: 'us',
    wsHost: 'ws-us.apinator.io',
    wsPort: 80,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ['ws', 'wss']
});

pusher.connection.bind('connected', () => {
    console.log('Successfully connected to Pusher!');
    process.exit(0);
});
pusher.connection.bind('error', (err) => {
    console.error('Connection error:', err);
});

setTimeout(() => {
    console.log('Timeout waiting for connection');
    process.exit(1);
}, 10000);
