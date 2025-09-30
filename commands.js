/**
 * IRC Bot Commands
 * Each command should be a function that takes (client, from, to, message, args)
 * - client: IRC client instance
 * - from: nickname of the user who sent the message
 * - to: channel or nick the message was sent to
 * - message: the full message text
 * - args: array of command arguments (excluding the command itself)
 */

const commands = {
  // Simple ping command
  ping: (client, from, to, message, args) => {
    client.say(to, `${from}: Pong!`);
  },

  // Echo command - repeats what the user says
  echo: (client, from, to, message, args) => {
    if (args.length === 0) {
      client.say(to, `${from}: Please provide something to echo!`);
      return;
    }
    client.say(to, `${from}: ${args.join(' ')}`);
  },

  // Help command - lists available commands
  help: (client, from, to, message, args) => {
    const commandList = Object.keys(commands).join(', ');
    client.say(to, `${from}: Available commands: ${commandList}`);
  },

  // Time command - shows current time
  time: (client, from, to, message, args) => {
    const now = new Date().toLocaleString();
    client.say(to, `${from}: Current time is ${now}`);
  },

  // Uptime command - shows bot uptime
  uptime: (client, from, to, message, args) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    client.say(to, `${from}: Bot uptime: ${hours}h ${minutes}m ${seconds}s`);
  },

  // Version command
  version: (client, from, to, message, args) => {
    const version = require('./package.json').version;
    client.say(to, `${from}: Bot version ${version} running on Node.js ${process.version}`);
  },

  // Random number generator
  random: (client, from, to, message, args) => {
    let min = 1, max = 100;
    
    if (args.length === 1) {
      max = parseInt(args[0]) || 100;
    } else if (args.length === 2) {
      min = parseInt(args[0]) || 1;
      max = parseInt(args[1]) || 100;
    }
    
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    client.say(to, `${from}: Random number between ${min} and ${max}: ${randomNum}`);
  },

  // 8ball command
  '8ball': (client, from, to, message, args) => {
    if (args.length === 0) {
      client.say(to, `${from}: Please ask a question!`);
      return;
    }
    
    const responses = [
      'It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely',
      'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good',
      'Yes', 'Signs point to yes', 'Reply hazy, try again', 'Ask again later',
      'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again',
      "Don't count on it", 'My reply is no', 'My sources say no', 'Outlook not so good',
      'Very doubtful'
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    client.say(to, `${from}: 🎱 ${response}`);
  }
};

module.exports = commands;