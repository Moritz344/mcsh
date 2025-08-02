const { search, Separator, select, confirm, input, password, checkbox } = require('@inquirer/prompts');
const mineflayer = require('mineflayer');
const chalk = require('chalk').default;

// TODO: react to mc chatgames / solve math games // Linux dic: fs.readFileSync('/usr/share/dict/words')
// TODO: save server cahts in file
// TODO: user can also chat


const operators = ['+', '-', '*', '/'];
const solveMathQuestions = false;

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

    // show reason why bot disconnected

    bot.on('end', (reason) => {
      console.log('Bot has disconnected from the server.');
      console.log("Reson:", reason);
    });
  });

}

//SpawnBot(bot);





function solveMathQuestion(question,bot) {
  if (/\d/.test(question)) {
    for (let operator of operators) {
      if (question.includes(operator)) {
        let match = question.match(/\d+\s*[\+\-\*\/]\s*\d+/);
        var result = eval(match[0]);
        bot.chat(result.toString());
      }

    }
  }


}
async function ListenForChat(bot) {

  bot.on('chat', (username, message) => {
    if (message === 'gg') {
      bot.chat('gg');
    }else if (message === "o/" ) {
      bot.chat('o/');
    }else if (message === "gn") {
      bot.chat('gn');
    }

    if (solveMathQuestions) {
      try {
        solveMathQuestion(message,bot);
      }catch (error) {
        console.error('Error solving math question:', error);
      }

    }



    console.log(chalk.yellow(`${username}` + chalk.white(': ') + chalk.green(message)));


  });

  try {

  while (true) {
    const userMessage = await input({
      message: '',
      validate: (value) => {
        return value ? true : 'Message cannot be empty';
      }
    });

    if (userMessage.toLowerCase() === 'exit') {
      bot.quit();
      process.exit(0);
    }


    console.log(chalk.blue(`You: ${userMessage}`));
    bot.chat(userMessage);
  }

  } catch (error) {
    console.error(chalk.red('Exited Prompt. You can no longer chat'));
  }

}

//ListenForChat();

async function ListenForErrors(bot) {
  bot.on('kicked', (reason) => {
    console.error('Kicked from the server:', reason);
  });

}
