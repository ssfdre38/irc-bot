const irc = require('irc');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error loading config.json:', error.message);
  process.exit(1);
}

// Load commands
const commands = require('./commands');

// Reconnection variables
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 30000; // 30 seconds
let reconnectTimeout = null;

// Command prefix (e.g., !ping, !help)
const commandPrefix = '!';

// Create IRC client with additional options for stability
const client = new irc.Client(config.server, config.nick, {
  channels: config.channels,
  port: config.port,
  secure: config.ssl,
  selfSigned: config.selfSigned,
  certExpired: config.certExpired,
  floodProtection: config.floodProtection,
  floodProtectionDelay: config.floodProtectionDelay,
  sasl: config.sasl,
  stripColors: config.stripColors,
  channelPrefixes: config.channelPrefixes,
  messageSplit: config.messageSplit,
  encoding: config.encoding,
  autoRejoin: config.autoRejoin,
  autoConnect: config.autoConnect,
  userName: config.userName,
  realName: config.realName,
  retryCount: 3,
  retryDelay: 2000,
  debug: false,
  showErrors: config.showErrors || false
});

// Bot startup time
const startTime = new Date();

// Event: Bot connected to server
client.addListener('registered', (message) => {
  console.log(`✓ Connected to ${config.server} as ${config.nick}`);
  console.log(`✓ Joining channels: ${config.channels.join(', ')}`);
  
  // Reset reconnection attempts on successful connection
  reconnectAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
});

// Event: Bot joined a channel
client.addListener('join', (channel, nick, message) => {
  if (nick === config.nick) {
    console.log(`✓ Joined ${channel}`);
  } else {
    console.log(`→ ${nick} joined ${channel}`);
  }
});

// Event: Someone left a channel
client.addListener('part', (channel, nick, reason, message) => {
  console.log(`← ${nick} left ${channel}${reason ? ` (${reason})` : ''}`);
});

// Event: Someone quit IRC
client.addListener('quit', (nick, reason, channels, message) => {
  console.log(`← ${nick} quit${reason ? ` (${reason})` : ''}`);
});

// Event: Received a message
client.addListener('message', (from, to, message) => {
  // Log the message
  const target = to === config.nick ? 'PM' : to;
  console.log(`[${target}] <${from}> ${message}`);
  
  // Check if message starts with command prefix
  if (message.startsWith(commandPrefix)) {
    handleCommand(from, to, message);
  }
});

// Event: Received a private message
client.addListener('pm', (from, message) => {
  console.log(`[PM] <${from}> ${message}`);
  
  // Handle commands in private messages too
  if (message.startsWith(commandPrefix)) {
    handleCommand(from, from, message);
  }
});

// Event: Error occurred
client.addListener('error', (message) => {
  console.error('IRC Error:', message);
  
  // Don't attempt reconnection on certain errors
  if (message && message.command === 'err_nicknameinuse') {
    console.error('✗ Nickname is already in use - not attempting reconnection');
    return;
  }
});

// Event: Connection lost
client.addListener('close', () => {
  console.log('✗ Connection closed');
  attemptReconnect();
});

// Event: Network error
client.addListener('netError', (exception) => {
  console.error('Network Error:', exception);
  
  // Handle specific ECONNRESET error
  if (exception.code === 'ECONNRESET') {
    console.log('🔄 Connection was reset by server, will attempt to reconnect...');
  } else if (exception.code === 'ENOTFOUND') {
    console.error('✗ Server not found - check server address');
  } else if (exception.code === 'ECONNREFUSED') {
    console.error('✗ Connection refused - check server and port');
  }
  
  // Attempt reconnection for network errors (unless shutting down)
  if (!shutdownInitiated) {
    attemptReconnect();
  }
});

// Function to attempt reconnection
function attemptReconnect() {
  if (shutdownInitiated) {
    console.log('🛑 Shutdown initiated, not attempting reconnection');
    return;
  }
  
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error(`✗ Maximum reconnection attempts (${maxReconnectAttempts}) reached. Giving up.`);
    gracefulShutdown();
    return;
  }
  
  reconnectAttempts++;
  console.log(`🔄 Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay/1000} seconds...`);
  
  reconnectTimeout = setTimeout(() => {
    try {
      console.log(`🔗 Reconnection attempt ${reconnectAttempts}...`);
      client.connect();
    } catch (error) {
      console.error('Reconnection failed:', error.message);
      attemptReconnect();
    }
  }, reconnectDelay);
}

// Event: Bot was kicked from channel
client.addListener('kick', (channel, nick, by, reason, message) => {
  if (nick === config.nick) {
    console.log(`✗ Kicked from ${channel} by ${by}${reason ? `: ${reason}` : ''}`);
    // Auto-rejoin if enabled
    if (config.autoRejoin) {
      setTimeout(() => {
        console.log(`↻ Attempting to rejoin ${channel}...`);
        client.join(channel);
      }, 5000);
    }
  } else {
    console.log(`← ${nick} was kicked from ${channel} by ${by}${reason ? `: ${reason}` : ''}`);
  }
});

// Function to handle commands
function handleCommand(from, to, message) {
  // Remove the command prefix and split into command and arguments
  const args = message.slice(commandPrefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  
  // Check if command exists
  if (commands[command]) {
    try {
      console.log(`⚡ Command "${command}" executed by ${from} in ${to}`);
      commands[command](client, from, to, message, args);
    } catch (error) {
      console.error(`Error executing command "${command}":`, error);
      client.say(to, `${from}: Error executing command "${command}"`);
    }
  } else {
    // Unknown command
    console.log(`⚠ Unknown command "${command}" from ${from} in ${to}`);
    client.say(to, `${from}: Unknown command "${command}". Type !help for available commands.`);
  }
}

// Handle graceful shutdown on connection errors too
let shutdownInitiated = false;
let sigintCount = 0;

// Function to gracefully shutdown the bot
function gracefulShutdown() {
  if (shutdownInitiated) {
    console.log('🚨 Shutdown already in progress, forcing exit...');
    process.exit(1);
    return;
  }
  
  shutdownInitiated = true;
  console.log('\n🛑 Shutting down bot...');
  
  // Clear any pending reconnection attempts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
    console.log('🚫 Cancelled pending reconnection');
  }
  
  // Set a timeout to force exit if disconnect takes too long
  const shutdownTimeout = setTimeout(() => {
    console.log('⚠ Forced shutdown (disconnect timeout)');
    process.exit(0);
  }, 3000); // 3 second timeout
  
  try {
    // Check if client is in a state where disconnect will work
    if (client.conn && client.conn.readyState === 'open') {
      client.disconnect('Bot shutting down', () => {
        clearTimeout(shutdownTimeout);
        console.log('✓ Bot disconnected');
        process.exit(0);
      });
    } else {
      // Client not properly connected, just exit
      clearTimeout(shutdownTimeout);
      console.log('⚠ Client not connected, exiting directly');
      process.exit(0);
    }
  } catch (error) {
    // If disconnect fails, just exit
    clearTimeout(shutdownTimeout);
    console.log('⚠ Disconnect failed, forcing exit:', error.message);
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  sigintCount++;
  if (sigintCount === 1) {
    console.log('\n⚡ Received SIGINT (Ctrl+C)');
    gracefulShutdown();
  } else {
    console.log('\n🚨 Force exit on second Ctrl+C');
    process.exit(130); // Standard exit code for Ctrl+C
  }
});

process.on('SIGTERM', () => {
  console.log('\n⚡ Received SIGTERM');
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('🤖 IRC Bot starting...');
console.log(`📡 Connecting to ${config.server}:${config.port} as ${config.nick}`);
console.log(`🎯 Command prefix: ${commandPrefix}`);
console.log(`📋 Available commands: ${Object.keys(commands).join(', ')}`);