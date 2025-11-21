import wordList from 'wordlist-english';
const words = wordList["english"];
const dictWithWords = words;


export function unscrambleWord(word,dict) {
		
		let sorted = word.split("").sort().join("");

		for (let word of dictWithWords) {
				let sortedDict = word.split("").sort().join("");
				if (sorted === sortedDict) {
						return word;

				}
		}

}


