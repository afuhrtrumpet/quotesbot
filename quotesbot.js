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

bot.addListener("pm", function(from, text, message) {
	console.log("Message was " + text);
	if (from == config.owner && text.substring(0, 6) == ".start") {
		presentaionActive = true;
		presentationName = text.substring(7);
		bot.say(config.channels[0], "Presentation " + presentationName
			+ " has been started. Send me memorable quotes in the "
			+ "format {QUOTE}/{AUTHOR} via PM! Message me .quotehelp"
			+ " to receive more info.");
	}
});
