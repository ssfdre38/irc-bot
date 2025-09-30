# IRC Bot

A customizable IRC bot built with Node.js that supports configurable commands and connection settings.

## Features

- 🔧 Easy configuration via JSON file
- 🎯 Modular command system
- 🛡️ Error handling and auto-reconnection
- 📝 Comprehensive logging
- 🔄 Graceful shutdown
- 💬 Support for both channel and private messages

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the bot:**
   Edit `config.json` to set your IRC server details:
   ```json
   {
     "server": "irc.libera.chat",
     "port": 6667,
     "ssl": false,
     "nick": "MyBot",
     "userName": "mybot",
     "realName": "My IRC Bot",
     "channels": ["#test"],
     ...
   }
   ```

3. **Run the bot:**
   ```bash
   npm start
   ```
   or
   ```bash
   node bot.js
   ```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `server` | IRC server hostname | "irc.libera.chat" |
| `port` | IRC server port | 6667 |
| `ssl` | Use SSL/TLS connection | false |
| `nick` | Bot's nickname | "MyBot" |
| `userName` | Bot's username | "mybot" |
| `realName` | Bot's real name | "My IRC Bot" |
| `channels` | Array of channels to join | ["#test"] |
| `autoRejoin` | Auto-rejoin when kicked | true |
| `autoConnect` | Auto-connect on startup | true |
| `floodProtection` | Enable flood protection | true |
| `floodProtectionDelay` | Delay between messages (ms) | 1000 |

## Commands

All commands use the `!` prefix by default. Available commands:

- `!ping` - Simple ping/pong response
- `!echo <message>` - Echo back the message
- `!help` - List all available commands
- `!time` - Show current time
- `!uptime` - Show bot uptime
- `!version` - Show bot and Node.js version
- `!random [min] [max]` - Generate random number
- `!8ball <question>` - Magic 8-ball responses

## Adding New Commands

To add new commands, edit the `commands.js` file:

```javascript
const commands = {
  // Add your command here
  mycommand: (client, from, to, message, args) => {
    client.say(to, `${from}: This is my custom command!`);
  }
};
```

Command function parameters:
- `client`: IRC client instance
- `from`: Nickname of the user who sent the message
- `to`: Channel or nick the message was sent to
- `message`: The full message text
- `args`: Array of command arguments (excluding the command itself)

## Examples

### Basic Usage
```
<user> !ping
<bot> user: Pong!

<user> !echo Hello World
<bot> user: Hello World

<user> !random 1 10
<bot> user: Random number between 1 and 10: 7
```

### SSL Connection Example
```json
{
  "server": "irc.libera.chat",
  "port": 6697,
  "ssl": true,
  "secure": true,
  ...
}
```

### Multiple Channels
```json
{
  "channels": ["#channel1", "#channel2", "#mychannel"],
  ...
}
```

## Logging

The bot provides comprehensive logging:
- Connection status
- Channel joins/parts
- Command execution
- Errors and warnings

## Error Handling

- Automatic reconnection on network errors
- Graceful shutdown on SIGINT/SIGTERM
- Error logging for failed commands
- Auto-rejoin when kicked (configurable)

## Security Notes

- Never commit credentials to version control
- Consider using environment variables for sensitive data
- Use SSL/TLS for secure connections
- Implement rate limiting for production use

## License

ISC