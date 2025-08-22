const chalk = require('chalk').default;

function helperFunction() {
		console.clear();
		console.log("");
		console.log(chalk.yellow.bold("Hello Stranger.") + " This is my second tui I'm building with " + chalk.yellow.bold("javascript."));
		console.log("As I work on this project, which is still in an early stage I also learn about making tuis with blessed.");
		console.log(chalk.red.bold("Please make pull requests and send issues."));
		console.log("---------------------------------------------------------------------------------------------------------");
		console.log("");

		console.log("This tui allows you to " +  chalk.yellow.bold("join any minecraft server") + " and chat with people in it.");
		console.log("You can use the prompt to chat,the box on top to see the chat messages and on the right");
		console.log("side you can see " + chalk.yellow.bold("the server list,current server and version.") + " By clicking on a server ");
		console.log("the program will try to connect to it. ");

		console.log("");

		console.log("Here are some commands you can use in the tui. ");

		console.log("");

		console.log(chalk.green("join")," to join any server");
		console.log(chalk.green("clear"),"to clear the chat");
		console.log(chalk.green("addServer"),"to add a new server to the list");
		console.log(chalk.green("removeServer"), "to remove a server from the list");

		console.log("");

		process.exit(0);
} 



module.exports = {
		helperFunction

}

