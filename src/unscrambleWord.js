const wordList = require("wordlist-english");
const words = wordList["english"];
var dictWithWords = words;

function unscrambleWord(word,dict) {
		
		let sorted = word.split("").sort().join("");

		for (let word of dictWithWords) {
				let sortedDict = word.split("").sort().join("");
				if (sorted === sortedDict) {
						return word;

				}
		}

}


module.exports = { unscrambleWord };
