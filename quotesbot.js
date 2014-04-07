var config = {
	channels: ["#muhtestchannel"],
	server: "irc.freenode.net",
	botName: "QuotesBot",
	owner: "aftrumpet"
};

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {});
var Schema = mongoose.Schema;

var presentationSchema = new Schema({
	name: String,
    	quotes: [{ quote: String, author: String }]
});

presentationSchema.index({name: 1, type: -1});

var Presentation = mongoose.model('Presentation', presentationSchema);

var helpMessage = "To log a quote, message me "
	+ "in the form {QUOTE}/{AUTHOR}, with "
	+ "QUOTE replaced with the quote and "
	+ "AUTHOR replaced with the speaker of "
	+ "the quote. The /{AUTHOR} portion is "
	+ "optional. Message .quotehelp for help "
	+ "or .quotes to get a full list of quotes "
	+ "said during this presentation.";

var irc = require("irc");

var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

var currentPresentation;
var presentationActive = false;

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

var generateSampleQuotes = function(presentation, maxQuotes) {
	var sampleQuotes = "";
	if (presentation.quotes.length == 0) {
		return "No quotes sent! Boring presentation?";
	} else if (presentation.quotes.length < maxQuotes) {
		for (var i = 0; i < presentation.quotes.length; i++) {
			sampleQuotes += parseQuote(presentation.quotes[i]) + ", ";
		}
		sampleQuotes = sampleQuotes.substring(0, sampleQuotes.length - 2);
	} else {
		var indicesAlreadyUsed = [];
		for (var i = 0; i < maxQuotes; i++) {
			var newIndex = false;
			while (!newIndex) {
				var index = Math.floor(Math.random() * presentation.quotes.length);
				console.log("Trying index " + index);
				if (indicesAlreadyUsed.indexOf(index) == -1) {
					sampleQuotes += parseQuote(presentation.quotes[index]) + ", ";
					indicesAlreadyUsed.push(index);
					newIndex = true;
				} else {
					console.log("Index already taken! Drat.");
				}
			}
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
	if (!presentationActive && from == config.owner && text.indexOf(".start") == 0) {
		presentationActive = true;
		currentPresentation = new Presentation( { name: text.substring(7), quotes: [] } );
		bot.say(config.channels[0], "Presentation " + currentPresentation.name 
			+ " has been started. Send me memorable quotes in the "
			+ "format {QUOTE}/{AUTHOR} via PM! Message me .quotehelp"
			+ " to receive more info.");
	}
});

//Used to end presentation
bot.addListener("pm", function(from, text) {
	if (presentationActive && from == config.owner && text == ".end") {
		presentationActive = false;
		bot.say(config.channels[0], "Presentation " + currentPresentation.name
			+ " is over. Some of the quotes said: " + generateSampleQuotes(currentPresentation, 3)
			+ ". PM .quotes to get a full list of quotes.");
		currentPresentation.save(function (err, currentPresentation) {
			if (err) return console.error(err);
			console.log("Presentation " + currentPresentation.name + " saved.");
		});
	}
});

//Parses quotes given by audience
bot.addListener("pm", function(from, text) {
	if (presentationActive ) {
		if (text.indexOf("{") > -1) parseMessage(text, function(quote, author, error) {
			if (error) {
				bot.say(from, "ERROR: " + error);
			} else {
				currentPresentation.quotes.push({quote: quote, author: author});
				bot.say(from, "Quote \"" + quote + "\" by " + author + " added.");
			}
		});
	}
});

//Sends full list of quotes to sender
bot.addListener("pm", function(from, text) {
	if (text == ".quotes") {
		if (!presentationActive) {
			bot.say(from, "No current presentation! Maybe try getting the quotes from a past presentation?");
		} else {
			bot.say(from, generateSampleQuotes(currentPresentation, currentPresentation.quotes.length + 1));
		}
	} else if (text.indexOf(".quotes") == 0) {
		var presentationRequested = text.substring(8);
		console.log("Looking for presentation \"" + presentationRequested + "\"");
		Presentation.find({ name: presentationRequested }, function(err, items) {
			if (err) {
				console.log("DB error@");
				bot.say(from, "Sorry, there was a database error.");
			} else {
				if (items.length == 0) {
					bot.say(from, "Presentation not found.");
				} else {
					bot.say(from, generateSampleQuotes(items[0], items[0].quotes.length + 1));
				}
			}
		});
	}
});

//Sends full list of presentations to sender
bot.addListener("pm", function(from, text) {
	if (text == ".presentations") {
		Presentation.find({}, function(err, items) {
			if (err) {
				console.log("DB error!");
				bot.say(from, "Sorry, there was a database error.");
			} else {
				var presentationString = "The presentations with quotes recorded are ";
				items.forEach(function(presentation) {
					presentationString += presentation.name + ", ";
				});
				if (items.length > 0) {
					presentationString = presentationString.substring(0, presentationString.length - 2);
				} else {
					presentationString += "No presentations recorded! Why not persuade the bot master to start one?";
				}
				bot.say(from, presentationString);
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
