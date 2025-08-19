// Dev-only local seed example (no network) to simulate fetch handlers.
// In a real environment, the dashboard API should respond at /api/forge/*

console.log('Seed script: This plugin expects server endpoints:');
console.log('- GET    /api/forge/feed          -> Feed posts');
console.log('- POST   /api/forge/feed          -> Create post');
console.log('- GET    /api/forge/courses       -> Courses');
console.log('- GET    /api/forge/events        -> Events');
console.log('- GET    /api/forge/agents        -> Agents');
console.log('- GET    /api/forge/xp            -> XP summary');
console.log('- WS     /api/forge/chat          -> WebSocket for chat (JSON messages)');
console.log('- GET    /api/forge/feed/stream   -> SSE for feed updates');
console.log('\nMock these routes in your dev server or proxy to your backend.');
