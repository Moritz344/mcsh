const { search, Separator, select, confirm, input, password, checkbox } = require('@inquirer/prompts');
const mineflayer = require('mineflayer');
const chalk = require('chalk').default;

async function main() {
  console.clear();

  const testServer = "eu.minemen.club";
  const testUsername = "pennti";
  const testVersion = "1.8.9";
  const testAuth = "microsoft";

  if (!process.argv.length > 2) {

    console.log(process.argv.length);


    const server = await input({
      message: 'Enter the Minecraft server IP:',
      validate: (value) => {
        return value ? true : 'Server IP cannot be empty';
      }


    });
    const username = await input({
      message: 'Enter the bot username:',
      validate: (value) => {
        return value ? true : 'Username cannot be empty';
      }
    });

    const versionNumber = await input({
      message: 'Enter the Minecraft version:',
      validate: (value) => {
        return value ? true : 'Version cannot be empty';
      }
    })

    const authType = await select({
      message: 'Select authentication type:',
      choices: [
        { name: 'Microsoft Account', value: 'microsoft' },
      ],
      validate: (value) => {
        return value ? true : 'Authentication type cannot be empty';
      }
    });
    const bot = mineflayer.createBot({
      host: server  ,
      username: username ,
      auth: authType  ,
      version: versionNumber  ,
    });
    console.log('Connecting to the server...');
    await SpawnBot(bot);
    await ListenForChat(bot);
    await ListenForErrors(bot);
  }else {
    console.log('Connecting to the server...');
    const bot = mineflayer.createBot({
      host: process.argv[2],
      username: process.argv[3],
      auth: process.argv[4] ,
      version: process.argv[5] ,
    });
    await SpawnBot(bot);
    await ListenForChat(bot);
    await ListenForErrors(bot);
  }








}

main();




async function SpawnBot(bot) {
  return new Promise((resolve, reject) => {
    bot.on('spawn', () => {
      console.log(`Bot ${bot.username} has spawned in the game.`);
      resolve();
    });

    bot.on('error', (err) => {
      console.error('Error occurred:', err);
    });

    bot.on('end', () => {
      console.log('Bot has disconnected from the server.');
    });
  });

}

//SpawnBot(bot);

async function ListenForChat(bot) {
  bot.on('chat', (username, message) => {
    console.log(chalk.yellow(`${username}` + chalk.white(': ') + chalk.green(message)));
    if (message === 'gg') {
      bot.chat('gg');
    }else if (message === "o/" ) {
      bot.chat('o/');
    }else if (message === "gn") {
      bot.chat('gn');
    }
  });
}

//ListenForChat();

async function ListenForErrors(bot) {
  bot.on('kicked', (reason) => {
    console.error('Kicked from the server:', reason);
  });

}
