const { search, Separator, select, confirm, input, password, checkbox } = require('@inquirer/prompts');
const mineflayer = require('mineflayer');
const chalk = require('chalk').default;
var blessed = require('blessed');
const fs = require('fs');
const path = require('path');

// TODO: react to mc chatgames / solve math games // Linux dic: fs.readFileSync('/usr/share/dict/words')
// TODO: save server cahts in file
// TODO: user can also chat


const operators = ['+', '-', '*', '/'];
// get json data
const configPath = path.resolve(__dirname, 'config.json');
const configData = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configData);

const solveMathQuestions = config.chatInteraction.solveMathProblems;
const solveMathTimeout = config.chatInteraction.solveMathTimeout;
const sendMathResult = config.chatInteraction.sendAnswerAutomatically;
const ignoreMyMessages = config.chatInteraction.IgnoreOwnMessages;



var screen = blessed.screen({
  smartCSR: true,
  title: 'Mineflayer Bot'
});

var box = blessed.box({
  top: 'top',
  left: 'center',
  width: '100%',
  height: '95%',
  content: 'Connecting to the server...',
  scrollable: true,
  alwaysScroll: true,
  vi: true,
  border: {
    type: 'line',
    fg: 'cyan'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'cyan'
    }
  }
});


var icon = blessed.box({
  top: '0',
  left: '0',
  width: '1',
  height: '1',
  content: '🤖',
  style: {
    fg: 'white',
    bg: 'black'
  }
});

box.focus();

screen.render();

var inputBox = blessed.textbox({
  bottom: '0',
  left: '0',
  width: '100%',
  height: 'shrink',
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'cyan'
    }
  }
});

screen.append(inputBox);
screen.append(icon);
screen.append(box);

inputBox.focus();

async function main() {
  console.clear();

  const testServer = "eu.minemen.club";
  const testUsername = "pennti";
  const testVersion = "1.8.9";
  const testAuth = "microsoft";


    const bot = mineflayer.createBot({
      host: process.argv[2],
      username: process.argv[3],
      auth: process.argv[4],
      version: process.argv[5],
    });
    console.log('Connecting to the server...');
    await SpawnBot(bot);
    await ListenForChat(bot);
    await ListenForErrors(bot);

}

main();


function SendNotification(message) {
  box.pushLine(`${chalk.green('Notification')}: ${message}`);
  screen.render();
}


async function SpawnBot(bot) {
  return new Promise((resolve, reject) => {
    bot.on('spawn', () => {
      SendNotification('Bot has spawned in the game.');
      resolve();
    });


    bot.on('error', (err) => {
      console.error('Error occurred:', err);
    });


    bot.on('end', (reason) => {
      console.log(chalk.red.bold('Bot has disconnected from the server.'));
      console.log("Reason:", reason);
      setTimeout(() => {
        process.exit(0);
      }, 5000);


    });
  });

}






function solveMathQuestion(question,bot) {
  if (/\d/.test(question)) {
    for (let operator of operators) {
      if (question.includes(operator)) {
        let match = question.match(/\d+\s*[\+\-\*\/]\s*\d+/);
        var result = eval(match[0]);
        if (sendMathResult) {
          setTimeout(() => {
            SendChatMessage(bot, result);
          }, solveMathTimeout);
        }
        SendNotification(`Solved math question: ${chalk.green.bold(match[0])} = ${chalk.yellow.bold(result)}`);
      }

    }
  }


}

async function SendChatMessage(bot,message) {
   box.pushLine(`${chalk.yellow(bot.username)}: ${message}`);
   bot.chat(message);
   inputBox.focus();
   inputBox.clearValue();
   screen.render();

}

function ListenForMathQuestions(bot,message) {
      if (solveMathQuestions) {
        try {
          solveMathQuestion(message,bot);
        }catch (error) {
          SendNotification(`Error solving math question: ${chalk.red.bold(error.message)}`);
        }

      }
}

async function ListenForChat(bot) {

  bot.on('chat', (username, message) => {
    //if (message === 'gg') {
    //  SendChatMessage(bot, 'gg');
    //}else if (message === "o/" ) {
    //  SendChatMessage(bot, 'o/');
    //}else if (message === "gn") {
    //  SendChatMessage(bot, 'gn');
    //}

    if (ignoreMyMessages ) {
      if (username === bot.username) {
        ListenForMathQuestions(bot,message);
        return; // Ignore own messages
      };
    }
      box.pushLine(`${chalk.blue(username)}: ${message}`);
      box.scroll(1.0);
      screen.render();



      ListenForMathQuestions(bot,message);

  });

  inputBox.on('submit', (value) => {
    let message = value.trim();
    SendChatMessage(bot,message);
    if (value.trim() === "exit") {
          process.exit(0);
    }

    });


}


async function ListenForErrors(bot) {
  bot.on('kicked', (reason) => {
    SendNotification(`Kicked from the server: ${reason}`);
  });

}

