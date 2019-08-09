var fs = require("fs");
var path = require("path");

var data = {
	sets: require("./sets"),
	rulings: require("./rulings"),
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

var filepath = path.resolve(__dirname, "../../attack_wing_2.0/data/data.json");
fs.writeFileSync(filepath, JSON.stringify(data));
