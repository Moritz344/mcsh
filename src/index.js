const { search, Separator, select, confirm, input, password, checkbox } = require('@inquirer/prompts');
const mineflayer = require('mineflayer');
const chalk = require('chalk').default;
var blessed = require('blessed');
const fs = require('fs');
const path = require('path');

// TODO: react to mc chatgames / solve math games // Linux dic: fs.readFileSync('/usr/share/dict/words')
// TODO: timeout at start so bot can connect/cooldown for switching servers 
// TODO: startscreen option without params




const operators = ['+', '-', '*', '/'];
// get json data
const configPath = path.resolve(__dirname, 'config.json');
const configData = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configData);

const solveMathQuestions = config.chatInteraction.solveMathProblems;
const solveMathTimeout = config.chatInteraction.solveMathTimeout;
const sendMathResult = config.chatInteraction.sendAnswerAutomatically;
const ignoreMyMessages = config.chatInteraction.IgnoreOwnMessages;
const configServerList = config.server.serverList;
let configUsername = config.user.name;

var server_items = [];

function SendNotification(message) {
    if (message.length >= 300) {
      const safeText = message.slice(0,300);
      message = safeText;
    }else{
      box.pushLine(`${chalk.green('Notification')}: ${message}`);
    }
    screen.render();

}

var screen = blessed.screen({
  smartCSR: true,
  title: 'Mineflayer Bot'
});

var box = blessed.box({
  top: 'top',
  left: '0',
  width: '75%',
  height: '93%',
  content: chalk.red.bold('Please wait ...'),
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



if (process.argv[2]) {
  box.focus();
  screen.render();

}

var inputBox = blessed.textbox({
  bottom: '0',
  left: '0',
  width: '100%',
  height: 'shrink',
  inputOnFocus: true,
  border: {
    type: "line",
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'cyan'
    }
  }
});



var ServerListBox = blessed.box({
  right: '0',
  width: '25%',
  height: "93%",
  mouse: true,
  vi: true,
  scrollable: true,
  border: {
    type: "line",
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'white'
    }
  }

})

var server_list = configServerList;
for (let i=0;i<server_list.length;i++) {
  server_items.push(server_list[i]);
}
if (!server_list.includes(chalk.red.bold("Exit")) ) {
  server_items.push(chalk.red.bold("Exit"));
}


serverList = blessed.list({
  parent: ServerListBox,
  width: "100%",
  height: "100%",
  keys: true,
  mouse: true,
  vi: true,
  style: {
    selected: {bg: "green", fg: "black" },
  },
  items: server_items,
});

async function main(username = process.argv[2],host_name = process.argv[3],version_number = process.argv[5]) {
    console.clear();
   

    if (!host_name || !version_number ) {
      host_name = "eu.minemen.club";
      version_number = "1.21";
    }


    


    var bot = mineflayer.createBot({
      host: host_name,
      username: username,
      auth: "microsoft",
    });


    serverList.clearItems();
    server_items.unshift(`Version: ${chalk.green.bold(version_number)}`);
    server_items.unshift(`Server: ${chalk.yellow.bold(host_name)}`);
    serverList.setItems(server_items);
    screen.render();

    await SpawnBot(bot);
    await ListenForChat(bot);
    await ListenForErrors(bot);


    return bot;

}


  (async () => {
    bot = await main();
    config.user.name = bot.username;
    fs.writeFileSync(configPath,JSON.stringify(config,null,2),'utf-8');
  })();




async function ConnectToServer(host,name) {
  if (bot) {
    try {
      bot.quit("Connecting");
      bot.removeAllListeners('all');

    }catch(err) {
      SendNotification("Error when changing to new bot");
    }

  }


    bot = mineflayer.createBot({
      host: host,
      username: name,
      auth: "microsoft",
    });


  await ListenForChat(bot);
  await ListenForErrors(bot);

  bot.once('login', () => {
    SendNotification(`Bot-Version: ${bot.version}`);
    serverList.clearItems();
    server_items[0] = `Server: ${chalk.yellow.bold(host)}`;
    server_items[1] = `Version: ${chalk.green.bold(bot.version)}`;
    serverList.setItems(server_items);
    screen.render();

    
  });

  bot.on("login",() => {
    SendNotification("bot decided to live");
  })

  bot.on("end", () => {
    SendNotification("bot decided not to live anymore");
  })

}


serverList.on('select', async(item,index) => {
  if (item.getText() !== "Exit" && server_items.includes(item.getText())) {
    try {
      await SendNotification("Selected a new server => " + item.getText())
      const server_host = item.getText();
      await ConnectToServer(server_host,bot.username);
      screen.render();

    }catch(fish) {
      if (fish.name === "ReferencedError") {
        SendNotification(`I said wait`);
      }
      SendNotification(`Error catching fish ${fish} `);
    }
  }else if(item.getText() === "Exit"){
    console.clear();
    process.exit(0);
  }
});



  screen.append(ServerListBox);
  screen.append(inputBox);
  
  screen.append(box);
  
  inputBox.focus();
  
  screen.render();





async function SpawnBot(bot) {
  return new Promise((resolve, reject) => {
    bot.on('spawn', () => {
      SendNotification('Bot has spawned in the game.');
      resolve();
    });


    bot.on('error', (err) => {
      if (err.name === "PartialReadError") {
        SendNotification("PartialReadError");
        return;
      }else{
        SendNotification(err);
      }

    });


    bot.on('end', (reason) => {
      SendNotification(reason);


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


  bot.removeAllListeners("chat");
  bot.on('chat', (username, message) => {

    if (ignoreMyMessages ) {
      if (username === bot.username) {
        ListenForMathQuestions(bot,message);
        return;
      };
    }
      box.pushLine(`${chalk.blue(username)}: ${message}`);
      box.scroll(1.0);
      screen.render();




      ListenForMathQuestions(bot,message);

  });

  inputBox.removeAllListeners("submit");
  inputBox.on('submit', (value) => {
    let message = value.trim();
    SendChatMessage(bot,message);
    if (value.trim() === "exit") {
          process.exit(0);
    }


    });


}


async function ListenForErrors(bot) {
  
  if (!process.argv[1] || !process.argv[2] ) {
    SendNotification("Please atleast enter a username. Ingore this if you are already logged in. ");
  }

  bot.on('kicked', (reason) => {
    SendNotification(`Kicked from the server: ${reason}`);
  });

  bot.on('error', (err) => {
    if (err.name === "PartialReadError") {
      return;
    }else{
      SendNotification(err);
    }
  });


  process.on('uncaughtException', (err) => {
    SendNotification(`Uncaught: ${err.message}`);
  });
  
  process.on('unhandledRejection', (reason) => {
    SendNotification(`Unhandled: ${reason}`);
  });

  bot._client.on('error', (err) => {
    SendNotification(`Protocol Error: ${err.name} - ${err.message}`);
  });

}

