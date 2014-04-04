var config = {
	channels: ["#muhtestchannel"],
	server: "irc.freenode.net",
	botName: "QuotesBot",
	owner: "aftrumpet"
};

var helpMessage = "To log a quote, message me "
	+ "in the form {QUOTE}/{AUTHOR}, with "
	+ "QUOTE replaced with the quote and "
	+ "AUTHOR replaced with the speaker of "
	+ "the quote. The /{AUTHOR} portion is "
	+ "optional.";

var irc = require("irc");

var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

var presentationActive = false;
var presentationName = "";
var presentationQuotes = [];

var parseMessage = function(message, callback) {
	if (message.indexOf("{") == -1) {
		callback("", "", "Missing beginning bracket.");
		return;
	} 
	message = message.substring(message.indexOf("{") + 1);
	if (message.indexOf("}") == -1) {
		callback("", "", "Missing closing bracket.");
		return;
	} 
	var quote = message.substring(0, message.indexOf("}"));
	var author = "";
	if (message.indexOf("/") > -1) {
		message = message.substring(message.indexOf("/"));
		if (message.indexOf("{") == -1) {
			callback("", "", "Missing beginning bracket of author.");
			return;
		} 
		message = message.substring(message.indexOf("{") + 1);
		if (message.indexOf("}") == -1) {
			callback("", "", "Missing closing bracket of author.");
			return;
		} 
		author = message.substring(0, message.indexOf("}"));
	}
	callback(quote, author, false);
}

var parseQuote = function(quote) {
	var result = "\"" + quote.quote + "\"";
	if (quote.author) {
		result += " by " + quote.author;
	}
	return result;
}

var generateSampleQuotes = function(maxQuotes) {
	var sampleQuotes = "";
	if (presentationQuotes.length == 0) {
		return "No quotes sent! Boring presentation?";
	} else if (presentationQuotes.length < maxQuotes) {
		for (var i = 0; i < presentationQuotes.length; i++) {
			sampleQuotes += parseQuote(presentationQuotes[i]) + ", ";
		}
		sampleQuotes = sampleQuotes.substring(0, sampleQuotes.length - 2);
	} else {
		for (var i = 0; i < maxQuotes; i++) {
			sampleQuotes += parseQuote(presentationQuotes[Math.floor(Math.random() * presentationQuotes.length)]) + ", ";
		}
		sampleQuotes = sampleQuotes.substring(0, sampleQuotes.length - 2);
	}
	return sampleQuotes;
}

//Logs all PMs sent
bot.addListener("pm", function(from, text) {
	console.log("Message was " + text);
});

//Used to start presentation
bot.addListener("pm", function(from, text) {
	if (!presentationActive && from == config.owner && text.substring(0, 6) == ".start") {
		presentationActive = true;
		presentationName = text.substring(7);
		presentationQuotes = [];
		bot.say(config.channels[0], "Presentation " + presentationName
			+ " has been started. Send me memorable quotes in the "
			+ "format {QUOTE}/{AUTHOR} via PM! Message me .quotehelp"
			+ " to receive more info.");
	}
});

//Used to end presentation
bot.addListener("pm", function(from, text) {
	if (presentationActive && from == config.owner && text == ".end") {
		presentationActive = false;
		bot.say(config.channels[0], "Presentation " + presentationName
			+ " is over. Some of the quotes said: " + generateSampleQuotes(3));
	}
});

//Parses quotes given by audience
bot.addListener("pm", function(from, text) {
	if (presentationActive ) {
		if (text.indexOf("{") > -1) parseMessage(text, function(quote, author, error) {
			if (error) {
				bot.say(from, "ERROR: " + error);
			} else {
				presentationQuotes.push({quote: quote, author: author});
				bot.say(from, "Quote \"" + quote + "\" by " + author + " added.");			
			}
		});
	}
});

//Used to send a help message to a user
bot.addListener("pm", function(from, text) {
	if (text == ".quotehelp") {
		bot.say(from, helpMessage);	
	}
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});
