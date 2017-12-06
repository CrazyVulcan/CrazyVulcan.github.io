module.exports = [{
	type: "token",
	id: "rule_admiral",
	set: ["AdditionalRules"],
	name: "Admiral Cards",
	text: ""
}, {
	type: "token",
	id: "rule_muon_token",
	set: ["AdditionalRules"],
	name: "Muon Token",
	text: "This card explains the rules for a Muon Token and serves as a reference to remind players of its effect.\n\nA ship with a Muon Token assigned to it follows these special rules:\n\n1. A Muon Token stays with a ship until it is removed.\n\n2. During the Activation Phase, after the ship moves, the ship takes damage to its Hull equal to the number of its current Maneuver -1. The type of Maneuver does not matter, just the number.\n\n3. After the ship performs a Green or White Maneuver, it can spend an Action to remove the Muon Token."
}, {
	type: "token",
	id: "rule_regenerate",
	set: ["AdditionalRules"],
	name: "Regenerate",
	text: "Ships with the [regenerate] icon in their Action Bar may perform the Regenerate Action. A ship that performs the [regenerate] Action immediately repairs 1 damage of its choice to its Hull (critical or normal). A ship cannot attack during the round that it performs the [regenerate] Action."
}, {
	type: "token",
	id: "rule_drone_tokens",
	set: ["AdditionalRules"],
	name: "Drone Tokens",
	text: "Each Drone Token has a Drone number list on the face, as well as a Captain Skill Number listed on the back. The Drone Tokens are placed in a stack on top of the Captain Card in descending order (from highest to lowest) of their Drone numbers. \n\nNOTE: The Drone number listed on the token at the top of the stack is always considered the ship’s current Captain Skill. At the start of the game, place the Drone Token that has the starting Captain Skill beside the ship (this will be the reverse side of the Drone Token that reads “START” on the face).\n\nWhen a Drone Token is used, remove one Token from the top of the stack and flip it over. Then remove the Drone Token that is beside the ship from play and replace it with the token that you just removed from the stack. NOTE: The Captain Skill that is listed on the Token beside the ship should always be equal to the number of Drone Tokens left on the Captain Card.\n\n You may use Drone Tokens for other Upgrade effects, but not for the text on a disabled Captain if your Captain is disabled."
}, {
	type: "fleet-captain",
	id: "federation_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Federation",
	factions: ["federation"],
	text: "After you move, you may target 1 friendly Federation ship within Range 1-3 (or your own ship). The target ship immediately removes 1 Disabled Upgrade Token from 1 of its disabled Upgrades as a free Action.",
	cost: 5,
	skill: 2,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 0,
	techAdd: 1,
	weaponAdd: 1,
	crewAdd: 0
}, {
	type: "fleet-captain",
	id: "dominion_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Dominion",
	factions: ["dominion"],
	text: "After you move, you may target 1 friendly Dominion ship within Range 1-2 (or your own ship). The target ship immediately performs an Action on one of its non-disabled [tech] Upgrades as a free Action.",
	cost: 5,
	skill: 2,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 0,
	weaponAdd: 0,
	crewAdd: 1
}, {
	type: "fleet-captain",
	id: "romulan_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Romulan",
	factions: ["romulan"],
	text: "After you move, you may target 1 friendly Cloaked Romulan ship within Range 1-2 (or your own ship). The target ship immediately performs a [sensor-echo] Action as a free Action.",
	cost: 5,
	skill: 2,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 0,
	techAdd: 0,
	weaponAdd: 1,
	crewAdd: 1
}, {
	type: "fleet-captain",
	id: "klingon_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Klingon",
	factions: ["klingon"],
	text: "After you move, you may target 1 friendly Klingon ship within Range 1-2 (or your own ship). The target ship immediately performs an action on one of its non-disabled [crew] Upgrades as a free Action.",
	cost: 5,
	skill: 2,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 1,
	weaponAdd: 0,
	crewAdd: 0
}, {
	type: "fleet-captain",
	id: "independent_klingon_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Independent (Klingon)",
	factions: ["independent"],
	text: "All of your [crew] Upgrades cost -1 SP for all ships in your fleet (including your own ship).",
	cost: 5,
	skill: 1,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 0,
	weaponAdd: 0,
	crewAdd: 2
}, {
	type: "fleet-captain",
	id: "independent_federation_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Independent (Federation)",
	factions: ["independent"],
	text: "After you move, you may target 1 friendly ship within Range 1-2 (or your own ship). The target ship immediately performs an additional white \"1\" Maneuver (forward, bank or turn).",
	cost: 5,
	skill: 1,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 0,
	weaponAdd: 0,
	crewAdd: 0
}, {
	type: "fleet-captain",
	id: "independent_romulan_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Independent (Romulan)",
	factions: ["independent"],
	text: "All your [weapon] Upgrades cost -1 SP for all ships in your fleet (including your own ship).",
	cost: 5,
	skill: 1,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 0,
	weaponAdd: 2,
	crewAdd: 0
}, {
	type: "fleet-captain",
	id: "independent_dominion_collectiveop2",
	set: ["CollectiveOP2"],
	name: "Independent (Dominion)",
	factions: ["independent"],
	text: "All of your [tech] Upgrades cost -1 SP for all ships in your fleet (including your own ship).",
	cost: 5,
	skill: 1,
	upgradeSlots: [],
	isSkillModifier: true,
	showType: true,
	canEquip: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true,
	talentAdd: 1,
	techAdd: 2,
	weaponAdd: 0,
	crewAdd: 0
}, {
	type: "officer",
	id: "first_officer_collectiveop3",
	set: ["CollectiveOP3"],
	name: "First Officer",
	factions: ["independent"],
	text: "Whenever you perform a [battlestations], [scan], or [evade] Action, you may place 2 Tokens of the appropriate type beside your ship instead of 1.  If you do so, place an Auxiliary Power Token beside your ship. \n\nIf your Captain's Skill is ever reduced below 4, you may use the Skill Number on this card instead of your Captain's Skill Number.",
	cost: 3,
	upgradeSlots: [{
		type: ["crew"],
		source: "Crew to be assigned as First Officer"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "officer",
	id: "tactical_officer_collectiveop3",
	set: ["CollectiveOP3"],
	name: "Tactical Officer",
	factions: ["independent"],
	text: "Add 1 [weapon] Upgrade slot to your Upgrade Bar. \nDuring the Roll Attack Dice step of the Combat Phase, you may spend a [battlestations] Token to roll +1 attack die. \nDuring the Roll Defense Dice step of the Combat Phase, you may spend a [battlestations] Token to roll +1 defense die.",
	cost: 3,
	upgradeSlots: [{
		type: ["crew"],
		source: "Crew to be assigned as Tactical Officer"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "officer",
	id: "operations_officer_collectiveop3",
	set: ["CollectiveOP3"],
	name: "Operations Officer",
	factions: ["independent"],
	text: "Add 1 [crew] Upgrade slot to your Upgrade Bar. \nDuring the Modify Attack Dice step of the Combat Phase, you may choose one of your attack dice and re-roll that die twice. \nDuring the Modify Defense Dice step of the Combat Phase, you may choose one of your defense dice and re-roll that die twice.",
	cost: 3,
	upgradeSlots: [{
		type: ["crew"],
		source: "Crew to be assigned as Operations Officer"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "officer",
	id: "science_officer_collectiveop3",
	set: ["CollectiveOP3"],
	name: "Science Officer",
	factions: ["independent"],
	text: "Add 1 [tech] Upgrade slot to your Upgrade Bar. \nEach time you attack, if there is a [scan] Token beside your ship, the defender rolls -2 defense dice instead of -1. \nDuring the Modify Defense Dice step of the Combat Phase, you may spend a [scan] Token to add 1 [evade] result to your roll.",
	cost: 3,
	upgradeSlots: [{
		type: ["crew"],
		source: "Crew to be assigned as Science Officer"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6001",
	set: ["OP4Participation"],
	name: "Romulan",
	class: "Flagship",
	factions: ["romulan"],
	text: "When attacking, all other friendly, Romulan ships within Range 1-2 of your Flagship may choose any number of their attack dice and re-roll them once.",
	cost: 10,
	actions: ["sensor-echo"],
	upgrades: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 1,
	hull: 0,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6002",
	set: ["OP4Participation"],
	name: "Independent (Romulan)",
	class: "Flagship",
	factions: ["independent"],
	text: "When defending, all other friendly ships within Range 1 of your Flagship gain +1 defense die.",
	cost: 10,
	actions: ["battlestations"],
	upgrades: [{
		type: ["weapon"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["weapon"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 1,
	hull: 0,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6003",
	set: ["OP4Participation"],
	name: "Klingon",
	class: "Flagship",
	factions: ["klingon"],
	text: "When attacking, all other friendly Klingon ships within Range 1-2 of your Flagship may convert 1 blank result into 1 [hit] result.",
	cost: 10,
	actions: ["cloak"],
	upgrades: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 1,
	hull: 1,
	shields: 0,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6004",
	set: ["OP4Participation"],
	name: "Independent (Klingon)",
	class: "Flagship",
	factions: ["independent"],
	text: "All other friendly ships within Range 1 of your Flagship gain +1 attack die when attacking at Range 2-3.",
	cost: 10,
	actions: ["scan"],
	upgrades: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["tech"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["tech"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 1,
	hull: 1,
	shields: 0,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6005",
	set: ["OP4Participation"],
	name: "Dominion",
	class: "Flagship",
	factions: ["dominion"],
	text: "When defending, all other friendly Dominion ships within Range 1-2 of your Flagship may convert 1 blank result into 1 [evade] result.",
	cost: 10,
	actions: ["scan"],
	upgrades: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	attack: 0,
	agility: 1,
	hull: 1,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6006",
	set: ["OP4Participation"],
	name: "Independent (Dominion)",
	class: "Flagship",
	factions: ["independent"],
	text: "After your Flagship moves, you may target 1 other Friendly ship within Range 1 of your Flagship. Target ship immediately performs an extra white or green Maneuver.",
	cost: 10,
	actions: ["target-lock"],
	upgrades: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["weapon"],
		source: "Flagship"
	}
	],
	attack: 0,
	agility: 1,
	hull: 1,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6007",
	set: ["OP4Participation"],
	name: "Federation",
	class: "Flagship",
	factions: ["federation"],
	text: "When defending, all other friendly Federation ships within Range 1-2 of your Flagship may choose any number of their defense dice and re-roll them once.",
	cost: 10,
	actions: ["battlestations"],
	upgrades: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["talent"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 0,
	hull: 1,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "flagship",
	id: "6008",
	set: ["OP4Participation"],
	name: "Independent (Federation)",
	class: "Flagship",
	factions: ["independent"],
	text: "After your Flagship moves, you may target 1 other Friendly ship within Range 1 of your Flagship. Target ship immediately performs a 2nd Action listed on its Action Bar as a free Action this round.",
	cost: 10,
	actions: ["evade"],
	upgrades: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	upgradeSlots: [{
		type: ["tech"],
		source: "Flagship"
	}, {
		type: ["crew"],
		source: "Flagship"
	}
	],
	attack: 1,
	agility: 0,
	hull: 1,
	shields: 1,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "faction",
	id: "faction_federation",
	showType: true,
	name: "Federation",
	factions: ["federation"],
	text: "This card represents the Federation faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_klingon",
	showType: true,
	name: "Klingon",
	factions: ["klingon"],
	text: "This card represents the Klingon faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_romulan",
	showType: true,
	name: "Romulan",
	factions: ["romulan"],
	text: "This card represents the Romulan faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_dominion",
	showType: true,
	name: "Dominion",
	factions: ["dominion"],
	text: "This card represents the Dominion faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_borg",
	showType: true,
	name: "Borg",
	factions: ["borg"],
	text: "This card represents the Borg faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_species_8472",
	showType: true,
	name: "Species 8472",
	factions: ["species-8472"],
	text: "This card represents the Species 8472 faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_kazon",
	showType: true,
	name: "Kazon",
	factions: ["kazon"],
	text: "This card represents the Kazon faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_xindi",
	showType: true,
	name: "Xindi",
	factions: ["xindi"],
	text: "This card represents the Xindi faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_bajoran",
	showType: true,
	name: "Bajoran",
	factions: ["bajoran"],
	text: "This card represents the Bajoran faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_ferengi",
	showType: true,
	name: "Ferengi",
	factions: ["ferengi"],
	text: "This card represents the Ferengi faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_vulcan",
	showType: true,
	name: "Vulcan",
	factions: ["vulcan"],
	text: "This card represents the Vulcan faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_independent",
	showType: true,
	name: "Independent",
	factions: ["independent"],
	text: "This card represents the Independent faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_mirror_universe",
	showType: true,
	name: "Mirror Universe",
	factions: ["mirror-universe"],
	text: "This card represents the Mirror Universe faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "faction",
	id: "faction_q_continuum",
	showType: true,
	name: "Q Continuum",
	factions: ["q-continuum"],
	text: "This card represents the Q Continuum faction and is used with the Officer Exchange Program Resource.",
	cost: 0,
	unique: true,
	canEquip: true,
	canEquipFaction: true,
	intercept: {
		ship: {},
		fleet: {}
	}
}, {
	type: "ship-resource",
	id: "fleet_commander_ship",
	set: ["72280r"],
	name: "Fleet Commander",
	factions: ["independent"],
	text: "Captain Skill is increased +1.\n\nAdd +1 to either Shield or Hull value.",
	cost: 5,
	upgrades: [{
		type: ["captain"],
		source: "Fleet Commander"
	}
	],
	upgradeSlots: [{
		type: ["captain"],
		source: "Fleet Commander"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
} , {
	type: "ship-resource",
	id: "captains_chair_ship",
	set: ["72301r"],
	name: "Captains Chair",
	factions: ["independent"],
	text: "Ship with Captain skill +5",
	cost: 3,
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}, {
	type: "ship-resource",
	id: "front_line_retrofit_ship",
	set: ["72302r"],
	name: "Front Line Retrofit",
	factions: ["independent"],
	text: "Hull 4+ and adds +1 to Shield and Captain Skill values",
	cost: 5,
	upgrades: [{
		type: ["weapon"],
		source: "Retrofit Weapon"
	}
	],
	upgradeSlots: [{
		type: ["weapon"],
		source: "Retrofit Weapon"
	}
	],
	showType: true,
	canEquip: true,
	canEquipFaction: true,
	isShipModifier: true,
	intercept: {
		ship: {},
		fleet: {}
	},
	factionPenalty: 0,
	unique: true
}];
