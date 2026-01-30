// Vercel Serverless Entry Point
// This bridges the gap between Vercel's 'Zero Config' and our backend folder
const app = require('../backend/server.js');

module.exports = app;
