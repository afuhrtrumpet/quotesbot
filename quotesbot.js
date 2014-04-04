var config = {
	channels: ["#muhtestchannel"],
	server: "irc.freenode.net",
	botName: "QuintusTheQuoter",
	owner: "aftrumpet"
};

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

bot.addListener("pm", function(from, text) {
	console.log("Message was " + text);
	console.log(presentationActive ? "Presentation is active." : "Presentation is not active.");
	if (!presentationActive && from == config.owner && text.substring(0, 6) == ".start") {
		presentationActive = true;
		presentationName = text.substring(7);
		bot.say(config.channels[0], "Presentation " + presentationName
			+ " has been started. Send me memorable quotes in the "
			+ "format {QUOTE}/{AUTHOR} via PM! Message me .quotehelp"
			+ " to receive more info.");
	} else if (presentationActive) {
		parseMessage(text, function(quote, author, error) {
			if (error) {
				bot.say(from, "ERROR: " + error);
			} else {
				presentationQuotes.push({quote: quote, author: author});
				bot.say(from, "Quote \"" + quote + "\" by " + author + " added.");			
			}
		});
	}	
});

/*bot.addListener("pm", function(from, text) {
	if (presentationActive) {
		console.log("Parsing quote.");
		parseMessage(text, function(quote, author, error) {
			if (error) {
				bot.say(from, "ERROR: " + error);
			} else {
				presentationQuotes.add({quote: quote, author: author});
				bot.say(from, "Quote \"" + quote + "\" added.");			
			}
		});
	}	
});*/

bot.addListener('error', function(message) {
	console.log('error: ', message);
});
