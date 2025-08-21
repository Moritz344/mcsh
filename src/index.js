#!/usr/bin/env node

const { search, Separator, select, confirm, input, password, checkbox } = require('@inquirer/prompts');
const mineflayer = require('mineflayer');
const chalk = require('chalk').default;
var blessed = require('blessed');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { GameDig } = require('gamedig');
const { unscrambleWord } = require('./unscrambleWord.js');

const program = new Command();
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname,'package.json'),'utf-8')
);

const wordList = require("wordlist-english");
const dict = wordList["english"];

var minecraft_version = undefined;
var minecraft_host = undefined;
var minecraft_username = undefined;

// TODO: react to mc chatgames 
// TODO: option to turn off solving math questions without editing config.json
// TODO: work on error handling
// TODO: some servers gets deleted for some reason in the Scan
// TODO: messagebox

const operators = ['+', '-', '*', '/'];
const configPath = path.resolve(__dirname, 'config.json');
const configData = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configData);

const solveMathQuestions = config.chatInteraction.solveMathProblems;
const solveMathTimeout = config.chatInteraction.solveMathTimeout;
const sendMathResult = config.chatInteraction.sendAnswerAutomatically;
const ignoreMyMessages = config.chatInteraction.IgnoreOwnMessages;
const configServerList = config.server.serverList;

var server_items = [];

function HandleCommander() {
  program
    .name('mcsh')
    .description('Connect to minecraft servers via the terminal')
    .version(pkg.version);
  
  
  program
    .command('login')
    .argument('<username>',"minecraft username")
    .argument('[host]',"minecraft server name")
    .argument('[version]',"minecraft version")
    .action((username,host,version) => {
        minecraft_username = username;
        minecraft_host = host;
        minecraft_version = version;

    });

  program
    .command('addServer')
    .argument('<serverName>',"server name to add to the server list")
    .action((serverName) => {
      addServerToJson(serverName);
      process.exit(0);
    });
  program
    .command('removeServer')
    .argument('<serverName>',"server name to remove from server list ")
    .action((serverName) => {
       removeServerFromJson(serverName);
       process.exit(0);
    });
  program
    .command('showServerList')
    .action(() => {
       let showServerList = config.server.serverList;
       console.log("");
       console.log(chalk.green.bold("","Your Serverlist:"));
       console.log("");
       for (let key in showServerList) {
			   console.log("","-",showServerList[key]);
	   }
       console.log("");
       process.exit(0);
    });


  program.parse(process.argv);
}

HandleCommander();

function WriteErrorsToNotificationBox() {
  // write errors in box instead to standard input
  console.log = (... args) => {

    screen.render();
  }

}
WriteErrorsToNotificationBox()

async function checkIfMcServerExists(serverName) { 
  // check if server exists if not delete it from list 
  try {
    const state = await GameDig.query({
      type: 'minecraft',
      host: serverName
    });
    return true;
  }catch(error) {
      SendErrorNotification("Exiting program. Invalid Server in config. Should be fixed after restart.");
      setTimeout( () => {
        console.clear();
        process.exit(0);
      },10000);
      removeServerFromJson(serverName);

    return false;
  }

}

function ScanServerList() {
  const listToCheck = config.server.serverList;

  for (let i=0;i<listToCheck.length;i++) {
    checkIfMcServerExists(listToCheck[i]);
  }


}



async function addServerToJson(name) {

          if (!config.server.serverList.includes(name)) {
             config.server.serverList.push(name);
             fs.writeFileSync(configPath,JSON.stringify(config,null,2),'utf-8');
             console.log(chalk.green.bold("Added Server:",name));

             console.log(config.server.serverList);
          }




}

function removeServerFromJson(name) {
        if (config.server.serverList.includes(name)) {
          const indexJson = config.server.serverList.indexOf(name);
          config.server.serverList.splice(indexJson ,1);

          fs.writeFileSync(configPath,JSON.stringify(config,null,2),'utf-8');
          console.log(chalk.red("Removed Server:",name,));
      }else {
          console.log(chalk.red.bold("Nothing to remove!"));
      }
}

function SendErrorNotification(message,) {

      box.pushLine(`${chalk.red('Error:')}: ${message}`);
		
}

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
  title: 'mcsh'
});

var box = blessed.log({
  top: 'top',
  label: "Chat",
  left: '0',
  width: '75%',
  height: '93%',
  content: chalk.red.bold('Please wait ...'),
  mouse: true,
  scrollable: true,
  alwaysScroll: true,
  scrollback: 1000,
  vi: true,
  scrollbar: {
    ch: '|',
    inverse: true
  },
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
  label: "Serverlist",
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

if (config.server.scanForInvalidServer) {
	ScanServerList();
}

async function main(username = minecraft_username,host_name = minecraft_host,version_number = minecraft_version) {
    console.clear();


   

    if (!host_name || !version_number ) {
      host_name = configServerList[Math.floor(Math.random() * configServerList.length)];
      version_number = "auto";
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
      SendErrorNotification("Error when connecting to server.");
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
    SendNotification("You are connected to the server.");
  })

  bot.on("end", () => {
    SendNotification("You are disconnected from the server.")

  })

}

box.on("select", () => {
  box.focus();
});


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
      SendNotification(`Error ${fish} `);
    }
  }else if(item.getText() === "Exit"){
    console.clear();
    process.exit(0);
  }
  
});



  screen.append(ServerListBox);
  screen.append(inputBox);
  
  screen.append(box);
  
  //inputBox.focus();
  
  screen.render();





async function SpawnBot(bot) {
  return new Promise((resolve, reject) => {
    bot.on('spawn', () => {
      SendNotification('You spawned in the game.');
      inputBox.focus();
      resolve();
    });



    bot.on('error', (err) => {
      if (err.name === "PartialReadError") {
        SendNotification("PartialReadError");
        return;
      }else{
        SendNotification("Error",err);
      }

    });


    bot.on('end', (reason) => {
      SendNotification("Bot disconnected :( ",reason);

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
        SendNotification(`${chalk.green.bold(match[0])} = ${chalk.yellow.bold(result)}`);
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

function ListenForUnscramble(message) {
	  let result = unscrambleWord(message,dict);
		if (result === undefined) {
	  	  return;
	  	}else {
	  	  SendNotification(`Unscrambled word: ${result}`);
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
      box.scroll(1);
      screen.render();





  });

  inputBox.removeAllListeners("submit");
  inputBox.on('submit', (value) => {
    let message = value.trim();
    if (value.trim() === "exit") {
          process.exit(0);
    }else if(value.trim().startsWith("addServer")) {
      const parts = value.trim().split(' ');
      if (parts.length >= 2) {
        let server = parts[1];
        checkIfMcServerExists(server).then(( exists) => {
          if (exists && !server_items.includes(server)) {
            SendNotification(`Added Server: ${server}`);

            config.server.serverList.splice(server_items.length - 1,0,server);
            server_items.splice(server_items.length - 1,0,server);
            serverList.setItems(server_items);

            screen.render();
            fs.writeFileSync(configPath,JSON.stringify(config,null,2),'utf-8');
		    inputBox.clearValue();
          }else if (server_items.includes(server)){
            SendNotification("This server is already in the list.");
          }
          inputBox.focus();
        });
      }
      inputBox.focus();
    }else if (value.trim().startsWith("removeServer")){
      const parts = value.trim().split(' ');
      let serverToRemove = parts[1];
      if (parts.length >= 2 && server_items.includes(serverToRemove)) {
        const indexLocal = server_items.indexOf(serverToRemove);
        const indexJson = server_items.indexOf(serverToRemove);

        config.server.serverList.splice(indexJson - 2,1);
        server_items.splice(indexLocal ,1);
        serverList.setItems(server_items);

        SendNotification(`Removed Server '${serverToRemove}' `);


		inputBox.clearValue();
        screen.render();
        fs.writeFileSync(configPath,JSON.stringify(config,null,2),'utf-8');
      }else{
        if (serverToRemove === undefined) {
          serverToRemove = "";
        }
        SendNotification(`Server: '${serverToRemove}' not found! `);

	  }
        inputBox.focus();
    }else if (value.trim().startsWith("join")){
			  const parts = value.trim().split(' ');
			  if (parts.length >= 2) {
				const serverName = parts[1];
				ConnectToServer(serverName,config.user.name);
				inputBox.clearValue();

         }
		 inputBox.focus();
		 screen.render();
    }else if(value.trim().startsWith("clear")){
			box.setContent('');
			inputBox.focus();
		    inputBox.clearValue();

	}else if (value.trim().startsWith("unscramble") && config.chatInteraction.UnscrambleWords){
		  const parts = value.trim().split(' ');
		  if (parts.length >= 2) {
				const message = parts[1];
				ListenForUnscramble(message);
				inputBox.clearValue();
				inputBox.focus();
		}
	}else {
      SendChatMessage(bot,message);
	}


    });


}


async function ListenForErrors(bot) {

  
  if (config.user.name === "") {
    if (!process.argv[1] || !process.argv[2] ) {
      SendErrorNotification("Please atleast enter a username. Ignore this if you are already logged in. ");
    }

  }

  bot.on('kicked', (reason) => {
      SendErrorNotification(`Kicked from the server: ${reason}`);
  });

  bot.on('error', (err) => {
    if (err.name === "PartialReadError") {
      return;
    }else{
      SendErrorNotification(`Error: ${err}`);
    }
  });


  process.on('uncaughtException', (err) => {
      SendErrorNotification(`Uncaught: ${err.message}`);
  });
  
  process.on('unhandledRejection', (reason) => {
      SendErrorNotification(`Unhandled: ${reason}`);
  });

  bot._client.on('error', (err) => {
    if (err.code === "ENOTFOUND") {
      SendErrorNotification("Server not found!");
      screen.render();
    }
    return;


  });

}

