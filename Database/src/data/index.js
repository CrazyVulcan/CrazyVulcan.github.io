var fs = require("fs");
var path = require("path");

var data = {
	sets: require("./sets"),
	missionSets: require("./missionSets"),
	missions: require("./missions"),
	ships: require("./ships"),
	shipClasses: require("./ship_classes"),
	captains: require("./captains"),
	admirals: require("./admirals"),
	upgrades: require("./upgrades"),
	resources: require("./resources"),
	others: require("./others")
};

var filepath = path.resolve(__dirname, "../../staw-utopia/data/data.json");
fs.writeFileSync(filepath, JSON.stringify(data));
