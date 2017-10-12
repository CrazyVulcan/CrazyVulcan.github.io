var module = angular.module("utopia-card-rules", ["utopia-valueof"]);

module.filter( "shipCardNamed", [ "$filter", function($filter) {
	
	var upgradeSlotsFilter = $filter("upgradeSlots");
	
	return function( ship, name ) {

		if( ship.name == name )
			return ship;
		
		if( ship.captain && ship.captain.name == name )
			return ship.captain;
		
		var match = false;
		$.each( upgradeSlotsFilter(ship), function(i, slot) {
			if( slot.occupant && slot.occupant.name == name ) {
				match = slot.occupant;
				return false;
			}
		});
		
		return match;

	}

}]);

module.filter( "fleetCardNamed", [ "$filter", function($filter) {

	var shipCardNamed = $filter("shipCardNamed");

	return function( fleet, name ) {
		
		if( !fleet ) {
			return false;
		}

		var match = false;
		$.each( fleet.ships, function(i, ship) {
			match = shipCardNamed(ship, name);
			if( match )
				return false;
		});
		
		return match;

	}

}]);

module.factory( "$factions", [ "$filter", function($filter) {
	var valueOf = $filter("valueOf");
	var factions = {
		hasFaction: function(card, faction, ship, fleet) {
			if( !card )
				return false;
			return $.inArray( faction, valueOf(card,"factions",ship,fleet) ) >= 0;
		},
		match: function(card, other, ship, fleet) {
			var match = false;
			$.each( valueOf(card,"factions",ship,fleet), function(i, cardFaction) {
				$.each( valueOf(other,"factions",ship,fleet), function(i, otherFaction) {
					if( cardFaction == otherFaction ) {
						match = true;
						return false;
					}
				});
				if( match )
					return false;
			});
			return match;
		},
		list: [ "Federation", "Klingon", "Romulan", "Dominion", "Borg", "Species 8472", "Kazon", "Xindi", "Bajoran", "Ferengi", "Vulcan", "Independent", "Mirror Universe", "Q Continuum" ],
	}
	factions.listCodified = $.map( factions.list, function(name) {
		return name.toLowerCase().replace(/ /g,"-");
	} );
	return factions;
}]);

module.factory( "cardRules", [ "$filter", "$factions", function($filter, $factions) {

	var valueOf = $filter("valueOf");

	var onePerShip = function(name) {
		return function(upgrade,ship,fleet) {
			
			var alreadyEquipped = false;
			var slots = $filter("upgradeSlots")(ship);
			$.each( slots, function(i,slot) {
				if( slot.occupant && slot.occupant != upgrade && slot.occupant.name == name ) {
					alreadyEquipped = true;
				}
			});
			return !alreadyEquipped;
			
		};
	};
	
	var upgradeTypes = ["crew","weapon","tech","talent","question","borg"];
	
	var isUpgrade = function(card) {
		return $.inArray( card.type, upgradeTypes ) >= 0;
	};
	
	var resolve = function(card,ship,fleet,value) {
		return value instanceof Function ? value(card,ship,fleet) : value;
	};
	
	var hasFaction = $factions.hasFaction;
	
	var cloneSlot = function(count, slot) {
		var slots = [slot];
		for( var i = 1; i < count; i++ )
			slots.push( angular.copy(slot) );
		return slots;
	};
	
	var createFirstMajeSlot = function() {
		return {
			type: ["talent"],
			rules: "First Maje Only",
			hide: function(slot,ship,fleet) {
				return !hasFaction(ship.captain,"kazon",ship,fleet);
			},
			intercept: {
				ship: {
					canEquip: function(card,ship,fleet,canEquip) {
						console.log(canEquip);
						if( card.name != "First Maje" )
							return false;
						return canEquip;
					}
				}
			}
		}
	}
	
	var getSlotType = function(upgrade,ship) {
		var type = ["weapon"];
		$.each( $filter("upgradeSlots")(ship), function(i, slot) {
			if( slot.occupant && slot.occupant.name == upgrade.source ) {
				console.log(slot.type, i);
				type = slot.type;
				return false;
				}
			}
		);
		
		return type;
	}
	
	return {
	
	//Generic Captains
		//Federation
		"captain:2003":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Bajoran
		"captain:bajoran_captain_op6prize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Vulcan
		"captain:vulcan_captain_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}
		},
		//independent
		"captain:drone_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Ferengi
		"captain:2027":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Kazon
		"captain:kazon_captain_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Xindi
		"captain:xindi_captain_72003p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}
		},

	//Core Starter Set :71120
		"ship:1001":{
			upgradeSlots: [
				{
					type: ["resource"]
				}
			]
		},
		//Will Riker 5
		"captain:2002":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Jean-Luc Picard 9
		"captain:2001":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Engage
		"talent:3001":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Worf
		"crew:3002":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Miles O'Brien
		"crew:3003":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Geordi La Forge
		"crew:3004":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Data
		"crew:3005":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Photon Torpedoes
		"weapon:3006":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Antimatter Mines
		"weapon:3007":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
	//Gor Portas : 71128
		// Thot Gor
		"captain:2023": {
			// Reduce cost of all weapons by 1 SP
			intercept: {
				ship: {
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					}
				}
			}
		},
		//Energy Dissipator
		"weapon:3059": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Breen") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//Kraxon :71127
	
	//IKS Negh'var :71126
		// Photon Torpedoes (Negh'var Bonus)
		"weapon:3051": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Negh'var Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
	
	//IKS Gr'oth :71125
	
	//RIS Apnex :71124
		// Varel
		"crew:3039": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Romulan Science Vessel" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		// Muon Feedback Wave
		"tech:3041": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Science Vessel";
			}
		},
		
		
	//IRW Valdore :71123
	
	//USS Enterprise :71122
		// Christopher Pike
		"captain:2012": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			// Reduce cost of all crew by 1 SP
			intercept: {
				ship: {
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					}
				}
			}
		},
		// James T. Kirk
		"captain:2011": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			// Two talent slots. Cost is overridden to be 3.
			upgradeSlots: cloneSlot( 2 ,
				{
					type: ["talent"],
					rules: "Fed Talents Cost Exactly 3 SP",
					faceDown: true,
					intercept: {
						ship: {
							cost: {
								priority: 100,
								fn: function(upgrade, ship, fleet, cost) {
									if( hasFaction(upgrade,"federation",ship,fleet) )
										return 3;
									return cost;
								}
							},
							// TODO Check if faction penalty should be applied
							factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
								if( hasFaction(upgrade,"federation",ship,fleet) )
									return 0;
								return factionPenalty;
							}
						}
					}
				}
			)
		},
		//Cheat Death
		"talent:3025":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Cochrane Deceleration Maneuver
		"talent:3026":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Corbomite Maneuver
		"talent:3027":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Leonard McCoy
		"crew:3028":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Hikaru Sulu
		"crew:3029":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Mr. Spock
		"crew:3030":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Nyota Uhura
		"crew:3031":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Montgomery Scott
		"crew:3032":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Photon Torpedoes
		"weapon:3024":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//USS Reliant :71121
		//Clark Terell 2010
		"captain:2010":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		// Khan Singh
		"captain:2008": {			
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				ship: {
					// No faction penalty for upgrades
					factionPenalty: function(card, ship, fleet, factionPenalty) {
						if( isUpgrade(card) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		//I Stab at Thee 
		"talent:3018":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Superior Intellect 
		"talent:3019":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Kyle 
		"crew:3020":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Pavel Chekov 
		"crew:3021":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Follower of Khan 
		"crew:3022":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Joachim 
		"crew:3023":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		
	
	//GenCon 2013 Promo
		//Khan Singh
		"captain:2009":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},

	
	//Krayton
	"captain:2026":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
	"talent:3060":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
	"crew:3062":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
	"weapon:3063":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
	"tech:3061":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//5th Wing Patrol Ship :71271
		// Luaran
		"captain:2035": {
			// One Dominion upgrade is -2 SP. Argh.
			// This is a messy implementation. It requires recalculation of the candidate for each upgrade on the ship.
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						
						var candidate = false;
						var candCost = 0;
						
						// Find the upgrade with the highest cost
						$.each( $filter("upgradeSlots")(ship), function(i, slot) {
							if( slot.occupant && $factions.hasFaction(slot.occupant,"dominion", ship, fleet) ) {
								// Note: This doesn't account for other cost modifiers. Can't use valueOf without huge recursion.
								var occCost = resolve(slot.occupant,ship,fleet,slot.occupant.cost);
								if( occCost > candCost ) {
									candidate = slot.occupant;
									candCost = occCost;
								}
							}
						});

						// Modify cost only if this is the candidate upgrade
						if( upgrade == candidate )
							cost = candCost - 2;
						
						return cost;
						
					}
				}
			}
		},
		// Suicide Attack
		"tech:3080": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
		// Phased Polaron Beam
		"weapon:3081": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Jem'Hadar") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		// Omet'Iklan
		"crew:3082": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
		// Virak'Kara
		"crew:3083": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
		// Toman'Torax
		"crew:3084": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
	
	
	//I.R.W. Praetus :71270
		
	//I.K.S. Kronos One :71269
	
	//U.S.S. Defiant :71268
		//Kira Nerys
		"captain:2030":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Benjamin Sisko
		"captain:2029":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Quantum Torpedoes
		"weapon:3067":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Cloaking Device (Defiant)
		"tech:3068": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.name != "U.S.S. Defiant" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Worf
		"crew:3069":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Attack Pattern Delta
		"talent:3088":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Attack Pattern Omega
		"talent:3071":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Jadzia Dax
		"crew:3089":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Miles O'Brien
		"crew:3090":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//Red Shirt Crew
		"crew:3091":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//IKS Ch'tang :OP2Prize
	
	//P.W.B. Aj'Rmr :OP3Prize
	
	//Koranak :71275
		// Enhanced Weaponry
		"weapon:3096": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class.indexOf("Keldon Class") >= 0 )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		// Cloaking Device (Keldon)
		"tech:3099": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Keldon Class") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//R.I.S. Vo :71274
	
	//I.K.S. Koraga :71273
	
	//U.S.S. Excelsior :71272
		// Styles
		"captain:3106": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				{
					type: ["tech"]
				}
			]
		},
		//Hikaru Sulu
		"captain:2046":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Feint
		"talent:3107":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Dmitri Valtane
		"crew:3108":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Janice Rand
		"crew:3109":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Lojur
		"crew:3110":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Positron Beam
		"tech:3112":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Transwarp Drive
		"tech:3113":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//U.S.S. Sutherland :OP4Prize
		//Data
		"captain:2043":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Disobey Orders
		"talent:3134":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Christopher Hobson
		"crew:3135":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Secondary Torpedo Launcher
		"weapon:3136":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//High Energy Sensor Sweep
		"tech:3137":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
	
	//I.K.S. Somraw :71448
		// Klingon Honor
		"talent:klingon_honor_71448": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"klingon", ship, fleet);
			}
		},
		// Shockwave
		"tech:shockwave_71448": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Raptor Class";
			}
		},
		// Tactical Sensors
		"tech:tactical_sensors_71448": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Raptor Class";
			}
		},
	
	
	//4th Division Battleship :71279
		"captain:weyoun_71279": {
			// Two crew slots, each with -1 SP if equipped with Dominion crew
			upgradeSlots: [{/* Existing Talent Slot */} ].concat( cloneSlot( 2 ,
				{
					type: ["crew"], 
					rules: "-1 SP if Dominion",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								if( $factions.hasFaction(upgrade,"dominion", ship, fleet) )
									return resolve(upgrade, ship, fleet, cost) - 1;
								return cost;
							}
						}
					}
				}
			))
		},
		// Kudak'Etan
		"crew:kudak_etan_71279": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
		// Ikat'Ika
		"crew:ikat_ika_71279": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Jem'Hadar") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		// Photon Torpedoes (Jem'Hadar Battleship Bonus)
		"weapon:photon_torpedoes_71279": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Jem'Hadar Battleship" )
							return resolve(upgrade,ship,fleet,attack) + 2;
						return attack;
					}
				}
			}
		},
		// Phased Polaron Beam
		"weapon:phased_polaron_beam_71279": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Jem'Hadar") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//I.R.W. Gal Gath'thong :71278
	
	//U.S.S. Equinox :71276
		//Maxwell Burke
		"captain:maxwell_burke_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Rudolph Ransom
		"captain:rudolph_ransom_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Marla Gilmore
		"crew:marla_gilmore_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Noah Lessing
		"crew:noah_lessing_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Emergency Medical Hologram
		"crew:emergency_medical_hologram_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		"tech:emergency_medical_hologram_tech_upgrade_lines71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Navigational Deflector
		"tech:navigational_deflector_71276":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//Rav Laerst :OP5Prize
		// Cold Storage Unit
		"tech:cold_storage_unit_op5prize": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				},
				{ 
					type: ["weapon"]
				}
			]
		},
		
		
	//Akorem :OP6Prize
		//Kira Nerys
		"captain:kira_nerys_op6prize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Tahna Los
		"captain:tahna_los_op6prize": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			// Add a Tech slot. Cost = 3. Can't have a ship/class specific restriction
			// TODO Add check for ship/class restriction. Woe is me.
			upgradeSlots: [
				{/* Existing Talent Slot */},
				{
					type: ["tech"],
					rules: "Costs exactly 3 SP",
					intercept: {
						ship: {
							cost: {
								priority: 100,
								fn: function(upgrade, ship, fleet, cost) {
									return 3;
								}
							},
							// TODO Does this invoke faction penalty?
							factionPenalty: function() { return 0; }
						}
					}
				}
			]
		},
		//Blockade
		"talent:blockade_op6prize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// I Am Kohn-Ma
		"talent:i_am_kohn_ma_op6prize": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet);
			}
		},
		//Li Nalas
		"crew:li_nalas_op6prize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Day Kannu
		"crew:day_kannu_op6prize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Borg Sphere 4270 :71283
		// Cutting Beam
		"tech:cutting_beam_71283": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		
		
	//Nistrim Raider :71282
		"ship:nistrim_raider_71282": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		//Raider Generic
		"ship:kazon_raider_71282": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		//Rettik
		"captain:rettik_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Culluh
		"captain:culluh_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Kazon Raiding Party
		"crew:kazon_raiding_party_71282": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon", ship, fleet);
			}
		},
		// Masking Circuitry
		"tech:masking_circuitry_71282": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"kazon", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Seska
		"crew:seska_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Tierna
		"crew:tierna_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Photonic Charges
		"weapon:photonic_charges_71282":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Bioship Alpha :71281
		// Bio-Electric Interference
		"tech:bio_electric_interference_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		// Extraordinary Immune Response
		"tech:extraordinary_immune_response_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		// Quantum Singularity
		"tech:quantum_singularity_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		// The Weak Will Perish
		"talent:the_weak_will_perish_71281": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"species-8472", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		// Biological Attack
		"weapon:biological_attack_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		// Energy Blast
		"weapon:energy_blast_71281": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Species 8472 Bioship" )
							return resolve(upgrade,ship,fleet,attack) + 2;
						return attack;
					}
				}
			}
		},
		// Energy Focusing Ship
		"weapon:energy_focusing_ship_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		
		
	//U.S.S. Voyager :71280
		//Chakotay
		"captain:chakotay_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Kathryn Janeway
		"captain:kathryn_janeway_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Ablative Generator
		"tech:ablative_generator_71280": {
			// Equip only on Voyager
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "U.S.S. Voyager";
			}
		},
		// B'elanna Torres
		"crew:b_elanna_torres_71280": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			name: "B'Elanna Torres",
			upgradeSlots: [ { type: ["weapon"] }, { type: ["tech"] } ]
		},
		//Bio-Neural Circuitry
		"tech:bio_neural_circuitry_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Harry Kim
		"crew:harry_kim_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Sacrifice
		"talent:sacrifice_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Seven of Nine
		"crew:seven_of_nine_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//The Doctor
		"crew:the_doctor_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"tech:the_doctor_tech_71280":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Transphasic Torpedoes
		"weapon:transphasic_torpedoes_71280": {
			// Equip only on Voyager
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "U.S.S. Voyager";
			}
		},
		
		
	//Red Alert Talent
		"talent:red_alert_opwebparticipation":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Tholia One :OPWebPrize
		//Loskene
		"captain:Loskene":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Tholian Punctuality
		"talent:tholian_punctuality_opwebprize": {
			canEquipFaction: function(upgrade,ship,fleet) {
				// TODO Tholians are Independent so can't easily tell their race
				return ship.captain && ( ship.captain.name == "Loskene" || ship.captain.name.indexOf("Tholian") >= 0 );
			}
		},
		// Energy Web
		"weapon:energy_web_opwebprize": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Tholian Vessel";
			}
		},
		//Plasma Torpedoes
		"weapon:plasma_torpedoes_opwebprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
	
	//Full Alert Talent
		"talent:full_alert_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
	
	
	//S'Gorn :OPArenaPrize
		//Gorn Commander
		"captain:gorn_commander_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Jammed Communications
		"tech:jammed_communications_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Gorn Pilot
		"crew:gorn_pilot_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Impulse Overload
		"tech:impulse_overload_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Faked Messages
		"talent:faked_messages_oparenaprize":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//D'Kyr :71446
		// Tavek
		"captain:tavek_71446": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			},
			// Add one crew slot
			upgradeSlots: [
				{
					type: ["crew"]
				}
			]
		},
		//Soval
		"captain:soval_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Muroc
		"crew:muroc_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//T'Pol
		"crew:t_pol_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Auxiliary Control Room
		"tech:auxiliary_control_room_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Sensor Grid
		"tech:sensor_grid_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		// Vulcan High Command
		"talent:vulcan_high_command_71446": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain &&  $factions.hasFaction(ship,"vulcan", ship, fleet) &&  $factions.hasFaction(ship.captain,"vulcan", ship, fleet);
			},
			upgradeSlots: cloneSlot( 2 , { type: ["tech","crew"] } )
		},
		//Photonic Weapon
		"weapon:photonic_weapon_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Aft Particle Beam
		"weapon:aft_particle_beam_71446":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Interceptor 5 :71445
		//Lenaris Holem"
		"captain:lenaris_holem_71445":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Hazar
		"captain:hazar_71445":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Neela
		"crew:neela_71445":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Anara
		"crew:anara_71445":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Warp Drive Refit
		"tech:warp_drive_refit_71445": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				if ( ship && ship.classData && ship.classData.maneuvers && ship.classData.maneuvers.max )
					return ( ship.classData.maneuvers.max < 4 );
				return false;
			}
		},
		// Maneuverability
		"tech:maneuverability_71445": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Bajoran Interceptor" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Militia
		"talent:militia_71445":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Phaser Strike
		"weapon:phaser_strike_71445": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Bajoran Interceptor" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//Tactical Cube :71444
		"ship:tactical_cube_138_71444": {
			intercept: {
				ship: {
					// Reduce cost of Borg Ablative Hull Armor
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.name == "Borg Ablative Hull Armor" )
							return resolve(upgrade, ship, fleet, cost) - 3;
						return cost;
					}
				}
			}
		},
		// Assimilated Access Codes
		"talent:assimilated_access_codes_71444": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"borg", ship, fleet);
			}
		},
		// Full Assault
		"weapon:full_assault_71444": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Borg Tactical Cube" )
							return resolve(upgrade,ship,fleet,attack) + 3;
						return attack;
					}
				}
			}
		},
		// Borg Missile
		"weapon:borg_missile_71444": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		
		
	//3rd Wing Attack Ship :3rd_wing_attack_ship
		// First Strike
		"talent:first_strike_3rd_wing_attack_ship": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			}
		},
		// Ion Thrusters
		"tech:ion_thrusters_3rd_wing_attack_ship": {
			// Only one per ship
			canEquip: onePerShip("Ion Thrusters")
		},
		
		
	//Gavroche :gavroche
		//Michael Eddington
		"captain:michael_eddington_gavroche":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Lon Suder
		"crew:lon_suder_gavroche":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Sakonna
		"crew:sakonna_gavroche": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			],
			intercept: {
				ship: {
					cost: {
						// Run this interceptor after all other penalties and discounts
						priority: 100,
						fn: function(upgrade,ship,fleet,cost) {
							if( upgrade.type == "weapon" ) {
								cost = resolve(upgrade,ship,fleet,cost);
								if( cost <= 5 )
									cost -= 2;
							}
							return cost;
						}
					}
				}
			}
		},
		//Hijack
		"talent:hijack_gavroche":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Focused Particle Beam
		"weapon:focused_particle_beam_gavroche":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//I.K.S. B'Moth :i_k_s_b_moth
	
	//I.R.W. Vorta Vor :i_r_w_vorta_vor
	
	//U.S.S. Yeager :u_s_s_yaeger
		//Benjamin Maxwell
		"captain:benjamin_maxwell_u_s_s_yaeger":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Preemptive Strike
		"talent:preemptive_strike_u_s_s_yaeger":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Elizabeth Shelby
		"crew:elizabeth_shelby_u_s_s_yaeger":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Reginald Barclay
		"crew:reginald_barclay_u_s_s_yaeger":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes - Yeager
		"weapon:photon_torpedoes_u_s_s_yaeger":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Ti'Mur :71508
		// Vanik
		"captain:vanik_71508": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				ship: {
					// All Vulcan/Federation tech is -2 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "tech" && ( $factions.hasFaction(upgrade,"vulcan", ship, fleet) || $factions.hasFaction(upgrade,"federation", ship, fleet) ) )
							return resolve(upgrade, ship, fleet, cost) - 2;
						return cost;
					},
				}
			}
		},
		// Combat Vessel Variant
		"tech:combat_vessel_variant_71508": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Suurok Class";
			},
			intercept: {
				ship: {
					attack: function(card,ship,fleet,attack) {
						if( card == ship )
							return resolve(card,ship,fleet,attack) + 1;
						return attack;
					},
					hull: function(card,ship,fleet,hull) {
						if( card == ship )
							return resolve(card,ship,fleet,hull) + 1;
						return hull;
					}
				}
			}
		},
		//Tractor Beam
		"tech:tractor_beam_71508":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Diplomacy
		"talent:diplomacy_71508":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Koss
		"crew:koss_71508":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
	
	
	//2nd Division Cruiser :71524
		// Unnecessary Bloodshed
		"talent:unnecessary_bloodshed_71524": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"dominion", ship, fleet);
			}
		},
		// Volley of Torpedoes
		"weapon:volley_of_torpedoes_71524": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Jem'Hadar Battleship" || ship.class == "Jem'Hadar Battle Cruiser";
			}
		},
	

	//U.S.S. Enterprise (Refit) :71523
		//Will Decker
		"captain:will_decker_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Mr. Spock
		"captain:mr_spock_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//James T. Kirk
		"captain:james_t_kirk_cap_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:james_t_kirk_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//The Needs of the Many...
		"talent:the_needs_of_the_many__71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Leonard McCoy
		"crew:leonard_mccoy_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Saavik
		"crew:saavik_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Ilia
		"crew:ilia_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Hikaru Sulu
		"crew:hikaru_sulu_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Self-Destruct Sequence
		"talent:self_destruct_sequence_71523": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		//Montgomery Scott
		"crew:montgomery_scott_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Pavel Chekov
		"crew:pavel_chekov_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Nyota Uhura
		"crew:nyota_uhura_71523":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
	
	
	//Soong :71522
		// Hugh
		"captain:hugh_71522": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				ship: {
					// All crew cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},
					// No faction penalty for borg upgrades
					factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
						if( isUpgrade(upgrade) && $factions.hasFaction(upgrade,"borg", ship, fleet) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		// Lore
		"captain:lore_71522": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				// Existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"]
				}
			],
			intercept: {
				ship: {
					canEquipFaction: {
						priority: 100,
						fn: function(card,ship,fleet,canEquipFaction) {
							if( card.type == "talent" )
								return true;
							return canEquipFaction;
						}
					},
					factionPenalty: {
						priority: 100,
						fn: function(card,ship,fleet,factionPenalty) {
							if( card.type == "talent" )
								return 0;
							return factionPenalty;
						}
					}
				}
			}
		},
		//Goval
		"crew:goval_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Bosus
		"crew:bosus_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Crosis
		"crew:crosis_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Torsus
		"crew:torsus_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Diversionary Tactics
		"talent:diversionary_tactics_71522":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Experimental Link
		"talent:experimental_link_71522": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"borg", ship, fleet);
			}
		},
		// Transwarp Conduit
		"borg:transwarp_conduit_71522": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		// Photon Torpedoes (Borg)
		"weapon:photon_torpedoes_71522": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && $factions.hasFaction(ship,"borg", ship, fleet) )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		// Forward Weapons Array
		"weapon:forward_weapons_array_71522": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"borg", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//U.S.S. Raven :71509
		// Magnus Hansen
		"captain:magnus_hansen_71509": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		// Multi-Adaptive Shields
		"tech:mutli_adaptive_shields_71509": {
			name: "Multi-Adaptive Shields",
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet);
			}
		},
		// Reinforced Structural Integrity
		"tech:reinforced_structural_integrity_71509": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.name != "U.S.S. Raven" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Research Mission
		"talent:research_mission_71509":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Erin Hansen
		"crew:erin_hansen_71509":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
	
	
	//DS9 GenCon Promo
		//Benjamin Sisko
		"captain:benjamin_sisko_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Quark
		"crew:quark_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Odo
		"crew:odo_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Vic Fontaine
		"crew:vic_fontaine_crew_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		"tech:vic_fontaine_tech_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Julian Bashir
		"crew:julian_bashir_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		
	//Assimilation Target Prime
		"ship:u_s_s_enterprise_d_71510b": {
			// Restore class on card text
			class: "Galaxy Class",
			// TODO use this field to pick the correct maneuver card
			classId: "galaxy__class_mu",
		},
		"ship:mirror_universe_starship_71510b": {
			// Restore class on card text
			class: "Galaxy Class",
			// TODO use this field to pick the correct maneuver card
			classId: "galaxy__class_mu",
		},
		"ship:assimilation_target_prime_71510b": {
			// Restore class on card text
			class: "Galaxy Class",
			// TODO use this field to pick the correct maneuver card
			classId: "galaxy__class_mu",
		},
		"ship:mirror_universe_borg_starship_71510b": {
			// Restore class on card text
			class: "Galaxy Class",
			// TODO use this field to pick the correct maneuver card
			classId: "galaxy__class_mu",
		},
		// Fire All Weapons
		"weapon:fire_all_weapons_71510b": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !(ship.class == "Galaxy Class" || ship.class == "Intrepid Class" || ship.class == "Sovereign Class") )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//U.S.S. Stargazer :71510
		// Jean-Luc Picard 6
		"captain:jean_luc_picard_71510": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"]
				}
			]
		},
		//Secondary Impulse Reactor
		"tech:secondary_impulse_reactor_71510":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Jack Crusher
		"crew:jack_crusher_71510":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Picard Maneuver
		"talent:picard_maneuver_71510":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Tactical Station
		"weapon:tactical_station_71510": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			]
		},
		
		
	//Ni'Var :71527
		//Kuvak
		"captain:kuvak_71527":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//V'Las
		"captain:v_las_cap_71527":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		"admiral:v_las_71527":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		// Sopek
		"captain:sopek_71527": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"]
				}
			]
		},
		// Vulcan Commandos
		"crew:vulcan_commandos_71527": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "vulcan", ship, fleet );
			}},
		// Combat Vessel Variant
		"tech:combat_vessel_variant_71527": {			
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				{
					type: ["weapon"],
				}
			],
			canEquip: function(upgrade,ship,fleet) {
				
				if( ship.class != "Suurok Class" )
					return false;
					
				// Only one per ship
				return onePerShip("Combat Vessel Variant")(upgrade,ship,fleet);
				
			},
			intercept: {
				ship: {
					attack: function(card,ship,fleet,attack) {
						if( card == ship )
							return resolve(card,ship,fleet,attack) + 1;
						return attack;
					},
					hull: function(card,ship,fleet,hull) {
						if( card == ship )
							return resolve(card,ship,fleet,hull) + 1;
						return hull;
					},
					// Prevent other CVV while this one equipped
					canEquip: function(upgrade,ship,fleet) {
						return upgrade.name != "Combat Vessel Variant";
					}
				}
			}
		},
		//Tractor Beam
		"tech:tractor_beam_71527":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Decisive Action
		"talent:decisive_action_71527":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Enterprise NX-01 :71526
		"ship:enterprise_nx_01_71526": {
			upgradeSlots: [ {
				type: ["tech"],
				rules: "Free EHP Only",
				canEquip: function(upgrade) {
					return upgrade.name == "Enhanced Hull Plating";
				},
				intercept: {
					ship: {
						cost: function() { return 0; }
					}
				}
			} ]
		},
		//J. Hayes
		"captain:j_hayes_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Maxwell Forrest
		"captain:maxwell_forrest_cap_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:maxwell_forrest_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Jonathan Archer
		"captain:jonathan_archer_71526": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"]
				}
			]
		},
		// Enhanced Hull Plating
		"tech:enhanced_hull_plating_71526": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			// Only one per ship
			canEquip: onePerShip("Enhanced Hull Plating"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		// T'Pol
		"crew:t_pol_71526": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["tech"], 
				}
			]
		},
		//Malcolm Reed
		"crew:malcolm_reed_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Hoshi Sato
		"crew:hoshi_sato_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Charles Tucker III
		"crew:charles_tucker_iii_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Travis Mayweather
		"crew:travis_mayweather_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Phlox
		"crew:phlox_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Tactical Alert
		"talent:tactical_alert_71526":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Scout Cube 608 :71525
		"ship:scout_608_71525": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet,canEquip) {
						if( upgrade.type == "borg" && valueOf(upgrade,"cost",ship,fleet) > 5 )
							return false;
						return canEquip;
					}
				}
			}
		},
		"ship:borg_starship_71525": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet,canEquip) {
						if( upgrade.type == "borg" && valueOf(upgrade,"cost",ship,fleet) > 5 )
							return false;
						return canEquip;
					}
				}
			}
		},
		"captain:third_of_five_71525": {
			// Can't equip if fleet contains Hugh
			canEquip: function(upgrade, ship, fleet) {
				return !$filter("fleetCardNamed")(fleet, "Hugh");
			},
			// While equipped, can't equip a card named Hugh on any ship
			intercept: {
				fleet: {
					canEquip: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Hugh" )
							return false;
						return canEquip;
					},
					canEquipCaptain: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Hugh" )
							return false;
						return canEquip;
					}
				}
			}
		},
		// Third of Five
		"crew:third_of_five_71525": {
			// Can't equip if fleet contains Hugh
			canEquip: function(upgrade, ship, fleet) {
				return !$filter("fleetCardNamed")(fleet, "Hugh");
			},
			// While equipped, can't equip a card named Hugh on any ship
			intercept: {
				fleet: {
					canEquip: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Hugh" )
							return false;
						return canEquip;
					},
					canEquipCaptain: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Hugh" )
							return false;
						return canEquip;
					}
				}
			}
		},
		// Scavenged Parts
		"borg:scavenged_parts_71525": {
			// Only one per ship
			canEquip: onePerShip("Scavenged Parts")
		},
		// Magnetometric Guided Charge
		"weapon:magnetometric_guided_charge_71525": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg");
			}
		},
		
		
	//Bok's Marauder : 71646a
		//Bok
		"captain:bok_71646a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Thought Maker
		"tech:thought_maker_71646a": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"ferengi", ship, fleet);
			}
		},
		// Vengeance
		"talen:vengeance_71646a": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"ferengi", ship, fleet) && $factions.hasFaction(ship,"ferengi", ship, fleet);
			}
		},
		//Kazago
		"crew:kazago_71646a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes Ferengi
		"weapon:photon_torpedoes_71646a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
	
	
	//Prakesh :71646b
		// Cloaking Device (Mirror)
		"tech:cloaking_device_71646b": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"mirror-universe", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//Relora-Sankur :71646c
		"ship:kazon_starship_71646c": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		
		"ship:relora_sankur_71646c": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		// Haron
		"captain:haron_71646c": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				// Add one weapon slot
				{
					type: ["weapon"]
				}
			],
			intercept: {
				ship: {
					// All Kazon weapons are -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon" && $factions.hasFaction(upgrade,"kazon", ship, fleet) ) {
							return resolve(upgrade, ship, fleet, cost) - 1;
						}
						return cost;
					},
				}
			}
		},
		//Tersa
		"crew:tersa_71646c":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Tractor Beam
		"tech:tractor_beam_71646c": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			// Only one per ship
			canEquip: onePerShip("Tractor Beam")
		},
		// Photonic Charges
		"weapon:photonic_charges_71646c": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Predator Class" )
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			}
		},
		//Particle Beam Weapon
		"weapon:particle_beam_weapon_71646c":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Scout 255 :71646d
		"ship:scout_255_71646d": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet,canEquip) {
						if( upgrade.type == "borg" && valueOf(upgrade,"cost",ship,fleet) > 5 )
							return false;
						return canEquip;
					}
				}
			}
		},
		// Proton beam
		"weapon:proton_beam_71646d": {
			name: "Proton Beam",
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"borg", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//Tal'Kir :71646e
		//Solok
		"captain:solok_71646e":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		// Vulcan Logic
		"talent:vulcan_logic_71646e": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"vulcan", ship, fleet) && $factions.hasFaction(ship,"vulcan", ship, fleet);
			}
		},
		//Kov
		"crew:kov_71646e":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Power Grid
		"tech:power_grid_71646e":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Photonic Weapon
		"weapon:photonic_weapon_71646e":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Avatar of Tomed :71511
		// Hive Mind
		"borg:hive_mind_71511": {
			// Only one per ship
			canEquip: onePerShip("Hive Mind")
		},
		// Borg Alliance
		"talent:borg_alliance_71511": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && !$factions.hasFaction(ship.captain,"borg", ship, fleet) && !$factions.hasFaction(ship,"borg", ship, fleet);
			},
			upgradeSlots: [ 
				{ 
					type: ["borg"]
				}
			]
		},
		
		
	//U.S.S. Enterprise-E :71531
		//Matthew Dougherty
		"captain:matthew_dougherty_cap_71531":{},
		"admiral:matthew_dougherty_71531":{},
		// Picard 8
		"captain:jean_luc_picard_b_71531": {
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["crew","tech","weapon","talent"]
				}
			]
		},
		// Advanced Shields
		"tech:advanced_shields_71531": {
			// Only one per ship
			canEquip: onePerShip("Advanced Shields")
		},
		//Fire At Will!
		"talent:fire_at_will__71531":{},
		//Make It So
		"talent:make_it_so_71531":{},
		//Data
		"crew:data_71531":{},
		// William T. Riker (Ent-E)
		"crew:william_t_riker_71531": {
			upgradeSlots: [ 
				{ 
					type: ["crew"]
				}
			]
		},
		// Geordi LaForge
		"crew:geordi_la_forge_71531": {
			upgradeSlots: [
				{
					type: ["tech"]
				}
			]
		},
		//Beverly Crusher
		"crew:beverly_crusher_71531":{},
		//Deanna Troi
		"crew:deanna_troi_71531":{},
		// Photon Torpedoes (Sovereign)
		"weapon:photon_torpedoes_71531": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Sovereign Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		// Dorsal Phaser Array
		"weapon:dorsal_phaser_array_71531": {
			attack: 0,
			// Equip only on a Federation ship with hull 4 or more
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) && ship.hull >= 4;
			},
			intercept: {
				self: {
					// Attack is same as ship primary
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet);
						return attack;
					},
					// Cost is primary weapon + 1
					cost: function(upgrade,ship,fleet,cost) {
						if( ship )
							return resolve(upgrade,ship,fleet,cost) + valueOf(ship,"attack",ship,fleet) + 1;
						return cost;
					}
				}
			}
		},
		
		
	//Queen Vessel Prime :71530
		// Transwarp Signal
		"borg:transwarp_signal_71530": {
			// Only one per ship
			canEquip: onePerShip("Transwarp Signal"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		// Borg Shield Matrix
		"borg:borg_shield_matrix_71530": {
			// Only one per ship
			canEquip: onePerShip("Borg Shield Matrix")
		},
		// Multi Kinetic Neutronic Mines
		"weapon:multi_kinetic_neutronic_mines_71530": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"borg", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		
	//Val Jean :71528
		// Calvin Hudson
		"captain:calvin_hudson_71528": {
			upgradeSlots: [ 
				{ 
					type: ["tech","weapon","crew"]
				}
			],
			// Reduce cost of all Upgrades by 1 SP if on Independent ship
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( $factions.hasFaction(ship,["independent","ferengi","kazon","xindi"], ship, fleet) && isUpgrade(upgrade) )
							return resolve(upgrade,ship,fleet,cost) - 1;
						return cost;
					}
				}
			}
		},
		
		
		
		//Federation
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Bajoran
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		//Vulcan
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}
		},
		
		//independent
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Ferengi
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Kazon
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Xindi
		":":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}
		},

		
		
		"ship:korok_s_bird_of_prey_71512": {
			// Can't join fleet with AV80279 in it
			canJoinFleet: function(ship, ship2, fleet) {
				var canJoin = true;
				$.each( fleet.ships, function(i, other) {
					if( other.name == "Assimilated Vessel 80279" ) {
						canJoin = false;
						return false;
					}
				});
				return canJoin;
			},
			// If in fleet, don't allow AV80279 to join
			intercept: {
				fleet: {
					canJoinFleet: function(ship, ship2, fleet) {
						return ship.name != "Assimilated Vessel 80279";
					}
				}
			}
		},
		
		"ship:trager_71513b": {
			// Can't join fleet with AV64758 in it
			canJoinFleet: function(ship, ship2, fleet) {
				var canJoin = true;
				$.each( fleet.ships, function(i, other) {
					if( other.name == "Assimilated Vessel 64758" ) {
						canJoin = false;
						return false;
					}
				});
				return canJoin;
			},
			// If in fleet, don't allow AV64758 to join
			intercept: {
				fleet: {
					canJoinFleet: function(ship, ship2, fleet) {
						return ship.name != "Assimilated Vessel 64758";
					}
				}
			}
		},
		
		// Regent's Flagship
		"ship:regent_s_flagship_71535": {
			class: "Negh'var Class",
			classId: "negh_var_class_mirror"
		},
		"ship:mirror_universe_starship_71535": {
			class: "Negh'var Class",
			classId: "negh_var_class_mirror"
		},
		
		// ISS Defiant
		"ship:i_s_s_defiant_71529": {
			class: "Defiant Class",
			classId: "defiant_class_mirror"
		},
		"ship:mirror_universe_starship_71529": {
			class: "Defiant Class",
			classId: "defiant_class_mirror"
		},
		
		// Only Gareb or Romulan Drone Pilot as Captain
		"ship:prototype_01_71536": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" || captain.name == "Romulan Drone Pilot";
					}
				}
			}
		},
		
		"ship:romulan_starship_71536": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" || captain.name == "Romulan Drone Pilot";
					}
				}
			}
		},
		
		"ship:sakharov_71997p": {
			upgradeSlots: [
				{
					type: ["crew","tech"],
					rules: "This Upgrade costs -2 SP",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								return resolve(upgrade, ship, fleet, cost) - 2;
							}
						}
					}
				}
			]
		},
		
		
		
		
		
		// CAPTAINS
		
		
		
		// Khan Singh (GenCon)
		"captain:2009": {
			intercept: {
				ship: {
					// No faction penalty for Khan or Talents
					factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
						return upgrade.type == "captain" || upgrade.type == "talent" ? 0 : factionPenalty;
					}
				}
			}
		},
		

		
		
		
		
		
		
		
		
		
		
		
		
		// Chakotay 6
		"captain:chakotay_71528": {
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["weapon","crew"]
				}
			]
		},
		
		
		
		// Miles O'Brien MU
		"captain:miles_o_brien_71529": {
			upgradeSlots: [ 
				{}, // Existing talent slot
				{ 
					type: ["tech"]
				}
			]
		},
		
		// Borg Queen
		"captain:borg_queen_71513a": {
			upgradeSlots: [ 
				{}, // Existing talent slot
				{ 
					type: ["borg"]
				}
			]
		},
		
		// Locutus
		"captain:locutus_71792": {
			// Can't equip if fleet contains Jean-Luc Picard
			canEquipCaptain: function(upgrade, ship, fleet) {
				return !$filter("fleetCardNamed")(fleet, "Jean-Luc Picard");
			},
			// While equipped, can't equip a card named Jean-Luc Picard on any ship
			intercept: {
				fleet: {
					canEquip: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Jean-Luc Picard" )
							return false;
						return canEquip;
					},
					canEquipCaptain: function(upgrade, ship, fleet, canEquip) {
						if( upgrade.name == "Jean-Luc Picard" )
							return false;
						return canEquip;
					}
				}
			}
		},
		
		// Gareb
		"captain:gareb_71536": {
			// Add a slot for another Captain
			upgradeSlots: [ 
				{ 
					type: ["captain"], 
					rules: "Captain to place under Gareb",
					intercept: {
						ship: {
							// No cost for this card
							cost: function() {
								return 0;
							},
							// Add talent slots for each talent on the chosen Captain
							onEquip: function(upgrade, ship, fleet) {
								upgrade.upgradeSlots = [];
								for( var i = 0; i < upgrade.talents; i++ )
									upgrade.upgradeSlots.push({
										type: ["talent"],
										source: "Gareb"
									});
								// TODO Check if this is correct
								upgrade.unique = false;
								upgrade.text = "(Place underneath Gareb)";
								upgrade.name = upgrade.name + " (Gareb)";
							},
							// Avoid any restrictions
							canEquip: function() {
								return true;
							},
							canEquipFaction: function() {
								return true;
							},
							factionPenalty: function() {
								return 0;
							}
						}
					}
				}
			],
			// Set skill to chosen Captain's skill
			skill: function(captain,ship,fleet) {
				if( captain.upgradeSlots[0].occupant )
					return captain.upgradeSlots[0].occupant.skill;
				return 0;
			},
			
			// Set cost to chosen Captain's cost minus 3 SP
			// TODO This should be a self intercept. Also should take into account faction penalty etc?
			cost: function(captain,ship,fleet) {
				var cost = 0;
				if( captain.upgradeSlots[0].occupant ) {
					cost = captain.upgradeSlots[0].occupant.cost - 3;
				}
				return cost;
			},
			
			// Equip only on a Romulan Drone Ship
			canEquipCaptain: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			}

		},
		
		// Romulan Drone Pilot
		"captain:romulan_drone_pilot_71536": {
			// Equip only on a Romulan Drone Ship
			canEquipCaptain: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			}
		},
		
		// Valdore
		"captain:valdore_71536": {
			upgradeSlots: [ 
				{/* Talent */},
				{ 
					type: ["tech"]
				}
			]
		},
		
		// Slar
		"captain:slar_71797": {
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					rules: "Salvage Only",
					canEquip: function(upgrade) {
						return upgrade.name == "Salvage";
					}
				}
			]
		},
		
		
		
		
		
		
		// UPGRADES
		
		// Prototype Cloaking Device - +5 SP for any non-Romulan ship, one per ship only
		"tech:prototype_cloaking_device_jazkel": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Romulan") < 0)
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					},
					canEquip: function(upgrade,ship,fleet) {
						return onePerShip("Prototype Cloaking Device")(upgrade,ship,fleet);
					}
				}
			}
		},
		
		// Photon Torpedoes (Vor'cha Bonus)
		"weapon:3010": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Vor'cha Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		
		
		
		

		
		
		
		
		
		
		
		
		
		
		
		
		
		// legendary hero
		"talent:legendary_hero_denorious": {
			canEquipFaction: function(upgrade,ship,fleet) {
				//console.log(factions.hasFaction(ship,"bajoran", ship, fleet))
				return (ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet)) && $factions.hasFaction(ship,"bajoran", ship, fleet);
			}
		},	
		
		
		// tachyon eddies denorious 
		"tech:tachyon_eddies_denorious": {
			
			canEquip: function(upgrade,ship,fleet) {
				//console.log(onePerShip("TACHYON EDDIES")(upgrade,ship,fleet), ship.class)
				
				return onePerShip("TACHYON EDDIES")(upgrade,ship,fleet);
				
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				//console.log(onePerShip("TACHYON EDDIES")(upgrade,ship,fleet), ship.class)
				//console.log(factions.hasFaction(ship,"bajoran", ship, fleet))
				return ( ship && ship.class == "BAJORAN SOLAR SAILOR" );
			}
		},	
		// Kazon Gurad
		"crew:kazon_gurad_Halik": {
			
			canEquip: function(upgrade,ship,fleet) {
								
				return onePerShip("Kazon Gurad")(upgrade,ship,fleet);
				
			}
			
		},	
		// MAINSAILS
		"tech:mainsails_denorious": {
			
			canEquip: function(upgrade,ship,fleet) {
				//console.log(onePerShip("TACHYON EDDIES")(upgrade,ship,fleet), ship.class)
				
				return onePerShip("MAINSAILS")(upgrade,ship,fleet);
				
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				
				return ( ship && ship.class == "BAJORAN SOLAR SAILOR" );
			}
		},	

		// SOLAR SAIL POWERED
		"tech:solar_sail_powered_denorious": {
			
			
			canEquipFaction: function(upgrade,ship,fleet) {
				
				return ( ship && ship.class == "BAJORAN SOLAR SAILOR" );
			}
		},			
		// D'Jarras
		"talent:djarras_denorious": {
			canEquipFaction: function(upgrade,ship,fleet) {
				//console.log(factions.hasFaction(ship,"bajoran", ship, fleet))
				return (ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet)) && $factions.hasFaction(ship,"bajoran", ship, fleet);
			}
		},	
		
		
		
		
		
		
		
		
		
		
		

	
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		// geordi la forge
		"crew:geordi_la_forge_71201": {

			intercept: {
				ship: {
					cost: {
						// Run this interceptor after all other penalties and discounts
						priority: 100,
						fn: function(upgrade,ship,fleet,cost) {
							if( upgrade.type == "tech" ) {
								cost = resolve(upgrade,ship,fleet,cost);
								
									cost -= 1;
							}
							return cost;
						}
					}
				}
			}
		},
		

		
		
		// Quark
		"crew:quark_71786": {
			text: "At the start of the game, place 1 non-Borg [tech] or [weapon] Upgrade with a cost of 5 or less face down beneath this card. At any time, you may discard Quark to flip the Upgrade that is beneath this card face up and deploy it to your ship, even if it exceeds your ship's restrictions.",
			upgradeSlots: [ 
				{ 
					type: ["weapon","tech"], 
					rules: "Non-Borg, 5SP or less",
					faceDown: true,
					intercept: {
						ship: {
							canEquip: function(upgrade,ship,fleet) {
								// TODO Prevent use of upgrades without a defined cost (e.g. Dorsal Phaser Array)
								var cost = valueOf(upgrade,"cost",ship,fleet);
								return cost <= 5;
							},
							canEquipFaction: function(upgrade,ship,fleet) {
								return !$factions.hasFaction(upgrade,"borg", ship, fleet);
							},
							free: function() {
								return true;
							}
						}
					}
				}
			]
		},
		// wesley crusher
		"crew:wesley_crusher_71201": {
			//text: "place up to 3 federation tech Upgrades, each 4 SP or less, face down under this card",
			upgradeSlots: cloneSlot( 3 , 
				{ 
					type: ["tech"], 
					rules: "FEDERATION TECH UPGRADES, 4SP OR LESS",
					faceDown: true,
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(card,ship,fleet,canEquip) {
								console.log(!$factions.hasFaction( card, "federation", ship, fleet ), valueOf(card,"cost",ship,fleet) > 4 )
								if( $factions.hasFaction( card, "federation", ship, fleet ) && (valueOf(card,"cost",ship,fleet) < 5) )
									return canEquip;
								return false;
							}
						}
					}
				}
			),
			//factionPenalty: 0
		},	
		
		// AKOREM LAAN
		"captain:akorem_laan_denorious": {
			//text: "place up to 3 federation tech Upgrades, each 4 SP or less, face down under this card",
			upgradeSlots: cloneSlot( 2 , 
				{ 
					type: ["talent"], 
					rules: "Bajoran upgrades",
					faceDown: true,
					intercept: {
						ship: {
							
							
							canEquip: function(card,ship,fleet,canEquip) {
								//console.log(!$factions.hasFaction( card, "federation", ship, fleet ), valueOf(card,"cost",ship,fleet) > 4 )
								if( $factions.hasFaction( card, "bajoran", ship, fleet ) )
									return canEquip;
								return false;
							}
						}
					}
				}
			),
			//factionPenalty: 0
		},	
		// tim watters
		"captain:tim_watters_valiant" : {
					upgradeSlots : [{}, {
							type : ["crew"]
						}
					],

				},
		// Vic Fontaine
		"crew:vic_fontaine_crew_71786": {
			factionPenalty: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"federation", ship, fleet) ? 0 : 1;
			}
		},
		
		// Vic Fontaine
		"tech:vic_fontaine_tech_71786": {
			factionPenalty: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}
		},
		
		// T'Rul
		"crew:t_rul_71786": {
			upgradeSlots: [ 
				{ 
					type: ["tech"], 
				}
			]
		},
		
		// Elim Garak
		"crew:elim_garak_71786": {
			//talents: 1,
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					rules: "No Faction Penalty",
					intercept: {
						ship: {
							factionPenalty: function() { return 0; }
						}
					}
				}
			],
			factionPenalty: 0
		},

		// Biogenic Charge
		// TODO Implement occupying two slots somehow?

		// Ramming Attack
		"weapon:ramming_attack_71528": {
			// Equip only on a ship with hull 3 or less
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			}
		},

		// Data Node
		"borg:data_node_71512": {
			// Only one per ship
			canEquip: onePerShip("Data Node")
		},

		// Warrior Spirit
		"talent:warrior_spirit_71512": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"klingon", ship, fleet);
			}
		},

		// Command Interface
		"borg:command_interface_71513a": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"borg", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},

		// Interplexing Beacon
		"borg:interplexing_beacon_71513a": {
			// Only one per ship
			canEquip: onePerShip("Interplexing Beacon")
		},
		
		// Prototype Cloaking Device
		"tech:prototype_cloaking_device_71532": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Klingon Bird-of-Prey";
			}
		},
		
		// Cry Havoc
		"talent:cry_havoc_71532": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"klingon", ship, fleet);
			}
		},
		
		// Jennifer Sisko
		"crew:jennifer_sisko_71529": {
			upgradeSlots: [ 
				{ 
					type: ["tech"]
				}
			]
		},
		
		// Shinzon Romulan Talents
		"talent:shinzon_romulan_talents_71533": {
			upgradeSlots: cloneSlot( 4 , 
				{ 
					type: ["talent"], 
					rules: "Romulan Talent Only",
					faceDown: true,
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(card,ship,fleet,canEquip) {
								if( !$factions.hasFaction( card, "romulan", ship, fleet ) )
									return false;
								return canEquip;
							}
						}
					}
				}
			),
			canEquip: function(upgrade,ship,fleet) {
				return ship.captain && ship.captain.name == "Shinzon";
			},
			factionPenalty: 0
		},
		
		// Secondary Shields
		"tech:secondary_shields_71533": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Reman Warbird";
			}
		},
		
		// Improved Cloaking Device
		"tech:improved_cloaking_device_71533": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Reman Warbird" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Thalaron Weapon
		"weapon:thalaron_weapon_71533": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Reman Warbird";
			}
		},
		
		// Photon Torpedoes (Reman Warbird)
		"weapon:photon_torpedoes_71533": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Reman Warbird" )
							return resolve(upgrade,ship,fleet,attack) + 2;
						return attack;
					}
				}
			}
		},
		
		// Hypothermic Charge
		"weapon:hypothermic_charge_71534": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf( "Vidiian" ) >= 0;
			}
		},
		
		// Cover Fire
		"squadron:cover_fire_71754": {
			// Only one per ship
			canEquip: onePerShip("Cover Fire")
		},
		
		// Flanking Attack
		"squadron:flanking_attack_71754": {
			// Only one per ship
			canEquip: onePerShip("Flanking Attack")
		},
		
		// Support Ship
		"squadron:support_ship_71754": {
			// Only one per ship
			canEquip: onePerShip("Support Ship")
		},
		
		// Aft Disruptor Wave Cannons
		"squadron:aft_disruptor_wave_cannons_71754": {
			// Only one per ship
			canEquip: onePerShip("Aft Disruptor Wave Cannons")
		},
		
		// Galor Class Phaser Banks
		"squadron:galor_class_phaser_banks_71754": {
			// Only one per ship
			canEquip: onePerShip("Galor Class Phaser Banks")
		},
		
		// Truce
		"talent:truce_71513b": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.captain && ship.captain.skill > 5 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Elim Garak (Mirror)
		"crew:elim_garak_71535": {
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain && $factions.hasFaction(ship,"mirror-universe", ship, fleet) )
							skill = resolve(upgrade,ship,fleet,skill) + 2;
						return skill;
					}
				}
			}
		},
		
		// Cloaking Device (Regent's Flagship)
		"tech:cloaking_device_71535": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.name != "Regent's Flagship" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Photon Torpedoes (Negh'var Bonus) (Mirror)
		"weapon:photon_torpedoes_71535": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Negh'var Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		
		// Monotanium Armor Plating
		"tech:monotanium_armor_plating_71808": {
			// Only one per ship
			canEquip: onePerShip("Monotanium Armor Plating")
		},
		
		// Sensor Network
		"tech:sensor_network_71808": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf( "Hirogen" ) >= 0;
			}
		},
		
		// Intercept Course
		"talent:intercept_course_71808": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf( "Hirogen" ) >= 0;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.captain && ship.captain.name != "Karr" && ship.captain.name.indexOf("Hirogen") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Subnucleonic Beam
		"weapon:subnucleonic_beam_71808": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf( "Hirogen" ) < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Defensive Maneuvers
		"squadron:defensive_maneuvers_71753": {
			// Only one per ship
			canEquip: onePerShip("Defensive Maneuvers")
		},
		
		// Support Ship
		"squadron:support_ship_71753": {
			// Only one per ship
			canEquip: onePerShip("Support Ship")
		},
		
		// Attack Wave
		"squadron:attack_wave_71753": {
			// Only one per ship
			canEquip: onePerShip("Attack Wave")
		},
		
		// Attack Formation
		"squadron:attack_formation_71753": {
			// Only one per ship
			canEquip: onePerShip("Attack Formation")
		},
		
		// Cover Fire
		"squadron:cover_fire_71753": {
			// Only one per ship
			canEquip: onePerShip("Cover Fire")
		},
		
		// Coordinated Attack
		"squadron:coordinated_attack_71753": {
			// Only one per ship
			canEquip: onePerShip("Coordinated Attack")
		},
		
		// Maneuvering Thrusters
		"tech:maneuvering_thrusters_71536": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Romulan Drone Ship" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},

		// Multi-Spectral Emitters
		"tech:multi_spectral_emitters_71536": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			}
		},
		
		// Backup Sequencer
		"tech:backup_sequencer_71536": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			}
		},
		
		// Triphasic Emitter
		"weapon:triphasic_emitter_71536": {
			name: "Triphasic Emitters",
			range: false,
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					rules: "Non-Borg, 5SP or less",
					intercept: {
						ship: {
							free: function() { return true; },
							canEquip: function(upgrade, ship, fleet, canEquip) {
								if( hasFaction(upgrade,"borg", ship, fleet) || valueOf(upgrade,"cost",ship,fleet) > 5 )
									return false;
								return canEquip;
							}
						}
						
					}
				}
			]
		},
		
		// William T. Riker (Pagh)
		"crew:william_t_riker_71996": {
			talents: 1,
			factionPenalty: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"klingon", ship, fleet) ? 0 : 1;
			},
			upgradeSlots: [
				{
					type: ["talent"]
				}
			]
		},
		
		// Tunneling Neutrino Beam
		"tech:tunneling_neutrino_beam_71996": {
			factionPenalty: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"klingon", ship, fleet) ? 0 : 1;
			}
		},
		
		// Phaser Array Retrofit
		"weapon:phaser_array_retrofit_71996": {
			// Only one per ship
			canEquip: onePerShip("Phaser Array Retrofit")
		},
		
		// Turanj
		"crew:turanj_71808": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			]
		},
		
		// Tholian Assembly
		"talent:tholian_assembly_71795": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.class.indexOf("Tholian") >= 0 && 
						ship.captain && ( ship.captain.name == "Loskene" || ship.captain.name.indexOf("Tholian") >= 0 );
			}
		},
		
		// Karden
		"crew:karden_71793": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon", ship, fleet);
			}
		},
		
		// Haliz
		"crew:haliz_71793": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon", ship, fleet);
			}
		},
		
		// Romulan Helmsman
		"crew:romulan_helmsman_71794": {
			// Only one per ship
			canEquip: onePerShip("Romulan Helmsman")
		},
		
		// Make Them See Us!
		"talent:make_them_see_us__71794": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"romulan", ship, fleet) && ship.captain && $factions.hasFaction(ship.captain,"romulan", ship, fleet);
			}
		},
		
		// Romulan Sub Lieutenant
		"crew:romulan_sub_lieutenant_71794": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "romulan", ship, fleet );
			}
		},
		
		// Romulan Security Officer
		// TODO Limit to max +3
		"crew:romulan_security_officer_71794": {
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + 1;
						return skill;
					}
				}
			}
		},
		
		// Tricobalt Warhead
		"weapon:tricobalt_warhead_71795": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Tholian") < 0 )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Disruptor Pulse
		"weapon:disruptor_pulse_71794": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction( ship, "romulan", ship, fleet ) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Improved Deflector Screens
		"tech:improved_deflector_screens_71797": {
			// Only one per ship and hull <= 3
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3 && onePerShip("Improved Deflector Screens")(upgrade,ship,fleet);
			}
		},
		
		// Targeted Phaser Strike
		"weapon:targeted_phaser_strike_71797": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Gorn Raider" )
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			}
		},
		
		// Coded Messages
		"talent:coded_messages_71798": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "dominion", ship, fleet );
			}
		},
		
		// Aft Weapons Array
		"weapon:aft_weapons_array_71798": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull >= 4;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "dominion", ship, fleet );
			}
		},
		
		// Marlena Moreau
		"crew:marlena_moreau_71796": {
			// One Talent is -1 SP.
			// Like Luaran, this reduces the cost of Marlena rather than the talent.
			// TODO Find a better way?
			cost: function(upgrade,ship,fleet) {
				
				if( !ship )
					return 3;
				
				var candidate = false;
				var candCost = 0;
				
				// Find a talent on the ship
				$.each( $filter("upgradeSlots")(ship), function(i, slot) {
					if( slot.occupant && slot.occupant != upgrade && slot.occupant.type == "talent" ) {
						var occCost = valueOf(slot.occupant,"cost",ship,fleet);
						// Stop as soon as we have a Talent with cost > 0
						if( occCost > 0 ) {
							candidate = slot.occupant;
							candCost = occCost;
							return false;
						}
					}
				});
				
				// Subtract 1 from Marlena's cost
				return candCost > 0 ? 2 : 3;
				
			}
		},
		
		// Tantalus Field
		"talent:tantalus_field_71796": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "I.S.S. Enterprise";
			}
		},
		
		// Escape Transporter
		"tech:escape_transporter_71997p": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf("Shuttlecraft") >= 0;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		
		// Warp Drive
		"tech:warp_drive_71997p": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf("Shuttlecraft") >= 0 && onePerShip("Warp Drive")(upgrade,ship,fleet);
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		
		
		
		
		// WAVE 14
		
		// Kyana
		
		"captain:annorax_71799": {
			upgradeSlots: [
				{}, // Existing talent slot
				{ 
					type: ["tech"]
				}
			]
		},
		
		// Causality Paradox
		"talent:causality_paradox_71799": {
			// Only equip on krenim weapon ship with Annorax or other Krenim captain.
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.class == "Krenim Weapon Ship" && ship.captain && (ship.captain.name == "Annorax" || ship.captain.name == "Obrist" || ship.captain.name.indexOf("Krenim") >= 0 );
			}
		},
		
		// Chroniton Torpedoes
		"weapon:chroniton_torpedoes_71799": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Krenim Weapon Ship" )
							return resolve(upgrade,ship,fleet,cost) + 6;
						return cost;
					}
				}
			}
		},
		
		// Temporal Incursion
		"weapon:temporal_incursion_71799": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Krenim Weapon Ship";
			}
		},
		
		// Temporal Wave Front
		"tech:temporal_wave_front_71799": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Krenim Weapon Ship";
			}
		},
		
		// Temporal Core
		"tech:temporal_core_71799": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Krenim Weapon Ship";
			}
		},
		
		// Spatial Distortion
		"tech:spatial_distortion_71799": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Krenim Weapon Ship";
			}
		},
		
		
		// Avenger
		
		"captain:soval_71800": {
			intercept: {
				ship: {
					factionPenalty: function(upgrade,ship,fleet,factionPenalty) {
						if( isUpgrade(upgrade) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		
		"crew:orion_tactical_officer_71800": {
			canEquip: onePerShip("Orion Tactical Officer")
		},
		
		"crew:andorian_helmsman_71800": {
			canEquip: onePerShip("Andorian Helmsman")
		},
		
		// Enhanced Hull Plating
		"tech:enhanced_hull_plating_71800": {
			canEquip: onePerShip("Enhanced Hull Plating"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "mirror-universe", ship, fleet ) && ship.hull <= 4;
			}
		},

		
		// U.S.S. Pegasus
		"ship:u_s_s_pegasus_71801": {
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( upgrade.type == "tech" )
							return resolve(upgrade,ship,fleet,cost) - 1;
						return cost;
					}
				}
			}
		},
		
		// Specialized Shields
		"tech:specialized_shields_71801": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		
		// Phasing Cloaking Device
		"tech:phasing_cloaking_device_71801": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Oberth Class" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Eric Motz
		"crew:eric_motz_71801": {
			upgradeSlots: [
				{
					type: ["tech"]
				}
			]
		},
		
		// William T. Riker
		"crew:william_t_riker_71801": {
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain )
							return resolve(upgrade,ship,fleet,skill) + 3;
						return skill;
					}
				}
			}
		},
		
		
		
		// WAVE 15
		
		// Krim
		"captain:krim_71803": {
			upgradeSlots: [
				{}, // Talent
				{
					type: ["crew"]
				}
			]
		},
		
		// Jaro Essa
		"captain:jaro_essa_cap_71803": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "bajoran", ship, fleet);
			}
		},
		
		"admiral:jaro_essa_71803": {
			canEquipAdmiral: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "bajoran", ship, fleet);
			}
		},
		
		// Assault Vessel Upgrade
		"tech:assault_vessel_upgrade_t_71803": {
			type: "question",
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			canEquip: function(upgrade,ship,fleet) {
				if( ship.class == "Bajoran Scout Ship" ) {
					return onePerShip("Assault Vessel Upgrade")(upgrade,ship,fleet);
				}
				return false;
			},
			intercept: {
				ship: {
					attack: function(card,ship,fleet,attack) {
						if( card == ship )
							return resolve(card,ship,fleet,attack) + 1;
						return attack;
					},
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							return resolve(card,ship,fleet,shields) + 1;
						return shields;
					}
				}
			}
		},
		
		//unremarkable_species_Halik
		"question:unremarkable_species_Halik": {
			type: "question",
			isSlotCompatible: function(slotTypes) {
				//console.log($.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0);
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				console.log(ship)
				return !$factions.hasFaction(ship, "borg", ship, fleet);
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Unremarkable Species")(upgrade,ship,fleet);
			 },
			 intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"kazon",ship,fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
			upgradeSlots: [  
				{ 
					type: function(upgrade,ship) {
						return getSlotType(upgrade,ship);
					}
				}
			],
		},		
		// Bajoran Militia
		"crew:bajoran_militia_71803": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "bajoran", ship, fleet);
			}
		},
		
		
		
		// Korinar
		
		// TODO It's not clear whether Mauk-to'Vor should get a faction penalty or cost=3 avoids this
		"captain:kurn_71999p": {
			upgradeSlots: [
				{
					type: ["talent"],
					rules: "Mauk-to'Vor Only at 3SP",
					canEquip: function(upgrade,ship,fleet) {
						return upgrade.name == "Mauk-to'Vor";
					},
					intercept: {
						ship: {
							cost: function() { return 3; }
						}
					}
				}
			],
			factionPenalty: function() { return 0; }
		},
		
		// Klingon Stealth Team
		"crew:klingon_stealth_team_71999p": {
			canEquip: onePerShip("Klingon Stealth Team"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "klingon", ship, fleet);
			}
		},
		
		// Mauk-to'Vor
		"talent:mauk_to_vor_71999p": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "klingon", ship, fleet) && $factions.hasFaction(ship.captain, "klingon", ship, fleet);
			}
		},
		
		// Ambush Attack
		"weapon:ambush_attack_71999p": {
			canEquip: onePerShip("Ambush Attack")
		},
		
		
		// Hood
		
		// Systems Upgrade
		// TODO Make upgrades multi typed
		"tech:systems_upgrade_71998p": {
			type: "question",
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			upgradeSlots: [
				{
					type: ["tech"]
				}
			],
			intercept: {
				ship: {
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							return resolve(card,ship,fleet,shields) + 1;
						return shields;
					}
				}
			},
			canEquip: onePerShip("Systems Upgrade"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet);
			}
		},
		
		// Type 8 Phaser Array
		"weapon:type_8_phaser_array_71998p": {
			canEquip: function(upgrade,ship,fleet) {
				if( ship.attack <= 3 )
					return onePerShip("Type 8 Phaser Array")(upgrade,ship,fleet);
				return false;
			}
		},
		
		
		// RESOURCES
		
		"resource:fleet_commander": {
			slotType: "captain",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "captain" )
					return true;
				
				var show = true;
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						show = false;
				} );
				return show;
			},
			onRemove: function(resource,ship,fleet) {
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						delete ship.resource;
				} );
			},
			
		},
		
		"resource:fleet_captain_collectiveop2": {
			slotType: "fleet-captain",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "fleet-captain" )
					return true;
				
				var show = true;
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						show = false;
				} );
				return show;
			},
			onRemove: function(resource,ship,fleet) {
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						delete ship.resource;
				} );
			}
		},
		
		"fleet-captain:federation_collectiveop2": {
			// Only equip if captain matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "federation", ship, fleet) && ( !ship.captain || ship.captain.unique && $factions.hasFaction(ship.captain, "federation", ship, fleet) );
			},
			// Prevent non-faction-matching captain
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique && $factions.hasFaction(captain, "federation", ship, fleet);
					}
				}
			}
		},
		
		"fleet-captain:dominion_collectiveop2": {
			// Only equip if ship and captain matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "dominion", ship, fleet) && ( !ship.captain || ship.captain.unique && $factions.hasFaction(ship.captain, "dominion", ship, fleet) );
			},
			// Prevent non-faction-matching captain
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique && $factions.hasFaction(captain, "dominion", ship, fleet);
					}
				}
			}
		},
		
		"fleet-captain:romulan_collectiveop2": {
			// Only equip if ship and captain matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "romulan", ship, fleet) && ( !ship.captain || ship.captain.unique && $factions.hasFaction(ship.captain, "romulan", ship, fleet) );
			},
			// Prevent non-faction-matching captain
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique && $factions.hasFaction(captain, "romulan", ship, fleet);
					}
				}
			}
		},
		
		"fleet-captain:klingon_collectiveop2": {
			// Only equip if ship and captain matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "klingon", ship, fleet) && ( !ship.captain || ship.captain.unique && $factions.hasFaction(ship.captain, "klingon", ship, fleet) );
			},
			// Prevent non-faction-matching captain
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique && $factions.hasFaction(captain, "klingon", ship, fleet);
					}
				}
			}
		},
		
		"fleet-captain:independent_klingon_collectiveop2": {
			// Only equip if captain unique
			canEquip: function(upgrade,ship,fleet) {
				return !ship.captain || ship.captain.unique;
			},
			intercept: {
				ship: {
					// Only allow unique captain
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique;
					},
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						factions = factions || card.factions;
						if( card == ship.captain && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					},
				},
				fleet: {
					// All crew cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},					
				}
			}
		},
		
		"fleet-captain:independent_federation_collectiveop2": {
			// Only equip if captain unique
			canEquip: function(upgrade,ship,fleet) {
				return !ship.captain || ship.captain.unique;
			},
			intercept: {
				ship: {
					// Only allow unique captain
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique;
					},
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						factions = factions || card.factions;
						if( card == ship.captain && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					},
				},
				fleet: {
					
				}
			}
		},
		
		"fleet-captain:independent_romulan_collectiveop2": {
			// Only equip if captain unique
			canEquip: function(upgrade,ship,fleet) {
				return !ship.captain || ship.captain.unique;
			},
			intercept: {
				ship: {
					// Only allow unique captain
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique;
					},
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						factions = factions || card.factions;
						if( card == ship.captain && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					},
				},
				fleet: {
					// All weapons cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},					
				}
			}
		},
		
		"fleet-captain:independent_dominion_collectiveop2": {
			// Only equip if captain unique
			canEquip: function(upgrade,ship,fleet) {
				return !ship.captain || ship.captain.unique;
			},
			intercept: {
				ship: {
					// Only allow unique captain
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.unique;
					},
					// Add independent faction to captain
					factions: function(card,ship,fleet) {
						var factions = card.factions;
						if( card == ship.captain && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					}
				},
				fleet: {
					// All tech cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "tech" )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},					
				}
			}
		},
		
		"resource:officer_exchange_program_71996a": {
			
			upgradeSlots: [
				{
					type: ["faction"],
					source: "Select Factions for Officer Exchange Program",
				},
				{
					type: ["faction"],
					source: "Select Factions for Officer Exchange Program",
				}
			],
			
			intercept: {
				fleet: {
					// Zero faction penalty for captains, admirals and crew
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						
						var factionA = fleet.resource.upgradeSlots[0].occupant;
						var factionB = fleet.resource.upgradeSlots[1].occupant;
						
						// Fail if user hasn't assigned two faction cards yet
						if( !factionA || !factionB )
							return factionPenalty;
						
						// Only apply to captains, admirals and crew
						if( card.type != "captain" && card.type != "admiral" && card.type != "crew" )
							return factionPenalty;
						
						// Check that the card and ship are of the chosen factions
						if( $factions.match( card, factionA ) && $factions.match( ship, factionB ) || $factions.match( card, factionB ) && $factions.match( ship, factionA ) )
							return 0;
						
						return factionPenalty;
						
					},
					
					// Cost -1 SP for captains and admirals
					cost: function(card, ship, fleet, cost) {
						
						var factionA = fleet.resource.upgradeSlots[0].occupant;
						var factionB = fleet.resource.upgradeSlots[1].occupant;
						
						// Fail if user hasn't assigned two faction cards yet
						if( !factionA || !factionB )
							return cost;
						
						// Only apply to captains and admirals
						if( card.type != "captain" && card.type != "admiral" )
							return cost;
						
						// Check that the card and ship are of the chosen factions
						if( $factions.match( card, factionA ) && $factions.match( ship, factionB ) || $factions.match( card, factionB ) && $factions.match( ship, factionA ) )
							return resolve(card, ship, fleet, cost) - 1;
						
						return cost;
						
					},
				}
			}
			
		},
		
		"resource:officer_cards_collectiveop3": {
			
			hideCost: true,

			intercept: {
				fleet: {
					// Add the "officer" type to all crew slots
					type: function(card,ship,fleet,type) {
						if( $.inArray("crew",type) >= 0 )
							return type.concat(["officer"]);
						return type;
					}
				}
			}
			
		},
		
		"officer:first_officer_collectiveop3": {
			skill: 4,
			talents: 1,
			upgradeSlots: [
				{/* Crew slot added by loader */},
				{
					type: ["talent"],
					source: "First Officer",
				}
			]
		},
		
		"officer:tactical_officer_collectiveop3": {
			upgradeSlots: [
				{/* Crew slot added by loader */},
				{
					type: ["weapon"],
					source: "Tactical Officer",
				}
			]
		},
		
		"officer:operations_officer_collectiveop3": {
			upgradeSlots: [
				{/* Crew slot added by loader */},
				{
					type: ["crew"],
					source: "Operations Officer",
				}
			]
		},
		
		"officer:science_officer_collectiveop3": {
			upgradeSlots: [
				{/* Crew slot added by loader */},
				{
					type: ["tech"],
					source: "Science Officer",
				}
			]
		},
		
		// Sideboard
		"resource:4003": {
			class: "Sideboard",
			factions: $factions.listCodified,
			upgradeSlots: [
				{
					type: ["talent"],
					source: "Sideboard",
					rules: "Combined cost 20 SP or less",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += valueOf(slot.occupant,"cost",ship,fleet);
						} );
						
						var cost = valueOf(card,"cost",ship,fleet);
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: {
								priority: 100,
								fn: function() { return true; }
							},
							canEquipFaction: {
								priority: 100,
								fn: function() { return true; }
							},
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["crew"],
					source: "Sideboard",
					rules: "Combined cost 20 SP or less",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += valueOf(slot.occupant,"cost",ship,fleet);
						} );
						
						var cost = valueOf(card,"cost",ship,fleet);
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: {
								priority: 100,
								fn: function() { return true; }
							},
							canEquipFaction: {
								priority: 100,
								fn: function() { return true; }
							},
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["tech"],
					source: "Sideboard",
					rules: "Combined cost 20 SP or less",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += valueOf(slot.occupant,"cost",ship,fleet);
						} );
						
						var cost = valueOf(card,"cost",ship,fleet);
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: {
								priority: 100,
								fn: function() { return true; }
							},
							canEquipFaction: {
								priority: 100,
								fn: function() { return true; }
							},
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["weapon"],
					source: "Sideboard",
					rules: "Combined cost 20 SP or less",
					canEquip: function(card,ship,fleet,upgradeSlot) {

						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += valueOf(slot.occupant,"cost",ship,fleet);
						} );
						
						var cost = valueOf(card,"cost",ship,fleet);
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: {
								priority: 100,
								fn: function() { return true; }
							},
							canEquipFaction: {
								priority: 100,
								fn: function() { return true; }
							},
							factionPenalty: function() { return 0; }
						}
					},
				},
			]
		},
		
		// Flagship
		"resource:4004": {
			slotType: "flagship",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "flagship" )
					return true;
				
				var show = true;
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						show = false;
				} );
				return show;
			},
			onRemove: function(resource,ship,fleet) {
				$.each( fleet.ships, function(i,ship) {
					if( ship.resource )
						delete ship.resource;
				} );
			}
		},
		
		// Romulan
		"flagship:6001": {
			// Only equip if ship matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "romulan", ship, fleet);
			}
		},
		
		// Klingon
		"flagship:6003": {
			// Only equip if ship matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "klingon", ship, fleet);
			}
		},
		
		// Dominion
		"flagship:6005": {
			// Only equip if ship matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "dominion", ship, fleet);
			}
		},
		
		// Federation
		"flagship:6007": {
			// Only equip if ship matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "federation", ship, fleet);
			}
		},
		
		// Independent (Rom)
		"flagship:6002": {
			intercept: {
				ship: {
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						if( card == ship && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					}
				}
			}
		},
		
		// Independent (Klingon)
		"flagship:6004": {
			intercept: {
				ship: {
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						if( card == ship && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					}
				}
			}
		},
		
		// Independent (Dominion)
		"flagship:6006": {
			intercept: {
				ship: {
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						if( card == ship && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					}
				}
			}
		},
		
		// Independent (Federation)
		"flagship:6008": {
			intercept: {
				ship: {
					// Add independent faction to captain
					factions: function(card,ship,fleet,factions) {
						if( card == ship && factions.indexOf("independent") < 0 )
							return factions.concat(["independent"]);
						return factions;
					}
				}
			}
		},
		
		"captain:kor_71804": {
			upgradeSlots: [
				{/* Talent */},
				{
					type: ["crew"]
				}
			]
		},
		
		// Romulan Hijackers
		"crew:romulan_hijackers_71802": {
			// Cannot equip if non-Romulan captain or crew
			canEquip: function(card,ship,fleet){
				
				if( ship.captain && !$factions.hasFaction(ship.captain,"romulan", ship, fleet) )
					return false;
				
				var canEquip = true;
				$.each( $filter("upgradeSlots")(ship), function(i,slot) {
					if( slot.occupant && slot.occupant.type == "crew" && !$factions.hasFaction(slot.occupant,"romulan", ship, fleet) )
						canEquip = false;
				});
				
				return canEquip;
				
			},
			intercept: {
				ship: {
					// Can only equip Romulan crew
					canEquip: function(card,ship,fleet,canEquip) {
						if( card.type == "crew" && !$factions.hasFaction(card,"romulan", ship, fleet) )
							return false;
						return canEquip;
					},
					// Can only equip Romulan captain
					canEquipCaptain: function(card,ship,fleet,canEquipCaptain) {
						if( !$factions.hasFaction(card,"romulan", ship, fleet) )
							return false;
						return canEquipCaptain;
					},
					// All non-borg tech and weapon upgrades cost -1 SP
					cost: function(card,ship,fleet,cost) {
						if( (card.type == "tech" || card.type == "weapon") && !$factions.hasFaction(card,"borg", ship, fleet) )
							cost = resolve(card, ship, fleet, cost) - 1;
						return cost;
					},
					// No faction penalty for romulan upgrades
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( isUpgrade(card) && $factions.hasFaction(card,"romulan", ship, fleet) )
							return 0;
						return factionPenalty;
					}
				},
			}
		},
		
		// Darok
		"crew:darok_71804": {
			canEquipFaction: function(card,ship,fleet) {
				return $factions.hasFaction(ship,"klingon", ship, fleet);
			},
		},
		
		// Inverse Graviton Burst
		"tech:inverse_graviton_burst_71804": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"klingon", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Long Live the Empire!
		"talent:long_live_the_empire__71804": {
			// Only equip if ship and captain matches faction
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "klingon", ship, fleet) && ( !ship.captain || $factions.hasFaction(ship.captain, "klingon", ship, fleet) );
			},
			// Prevent non-faction-matching captain
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return $factions.hasFaction(captain, "klingon", ship, fleet);
					}
				}
			}
		},
		
		// Regenerative Shielding
		"tech:regenerative_shielding_71802": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.name != "U.S.S. Prometheus" )
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			},
			canEquip: onePerShip("Regenerative Shielding")
		},
		
		// Ablative Hull Armor
		"tech:ablative_hull_armor_71802": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Prometheus Class";
			},
		},
		
		// Multi-Vector Assault Mode
		"weapon:multi_vector_assault_mode_71802": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Prometheus Class";
			},
		},
		
		// DAUNTLESS
		
		// Arturis
		"captain:arturis_71805": {
			intercept: {
				self: {
					skill: function(upgrade,ship,fleet,skill) {
						if( ship && ship.class == "Dauntless Class" )
							return resolve(upgrade,ship,fleet,skill) + 5;
						return skill;
					}
				}
			}
		},
		
		// Auto-Navigation
		"tech:auto_navigation_71805": {
			skill: 0,
			upgradeSlots: [
				{
					type: ["tech"]
				}
			],
			intercept: {
				self: {
					skill: function(upgrade,ship,fleet,skill) {
						if( ship && !ship.captain )
							return 2;
						return skill;
					}
				}
			}
		},
		
		// Force Field
		"tech:force_field_71805": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Dauntless Class" )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Navigational Deflector
		"tech:navigational_deflector_71805": {
			canEquip: onePerShip("Navigational Deflector")
		},
		
		// Particle Synthesis
		"tech:particle_synthesis_71805": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Dauntless Class";
			}
		},
		
		// TERIX
		
		// Additional Phaser Array 
		"weapon:additional_phaser_array_72000p": {
			canEquip: function(upgrade,ship,fleet) {
				if( ship.class == "D'deridex Class" )
					return onePerShip("Additional Phaser Array")(upgrade,ship,fleet);
				return false;
			}
		},
		
		// Long Range Scanners
		"tech:long_range_scanners_72000p": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "D'deridex Class" )
							return resolve(upgrade,ship,fleet,cost) + 3;
						return cost;
					}
				}
			}
		},
		
		
		// KREECHTA
		
		// Marauder
		"talent:marauder_71806": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "ferengi", ship, fleet) && $factions.hasFaction(ship.captain, "ferengi", ship, fleet);
			}
		},
		
		// Acquisition
		"talent:acquisition_71806": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "ferengi", ship, fleet) && $factions.hasFaction(ship.captain, "ferengi", ship, fleet);
			}
		},
		
		// Tactical Officer
		"crew:tactical_officer_71806": {
			canEquip: onePerShip("Tactical Officer")
		},

		// Ferengi Probe
		"tech:ferengi_probe_71806": {
			canEquip: onePerShip("Ferengi Probe")
		},
		
		
		// PASTEUR

		// Inverse Tachyon Pulse
		"tech:inverse_tachyon_pulse_71807": {
			canEquip: onePerShip("Inverse Tachyon Pulse")
		},
		

		// EMERGENCY FORCE FIELD RESOURCE
		"resource:emergency_force_field_72001r": {
			cost: function(card,ship,fleet) {
				if( !fleet )
					return 0;
				var shields = 0;
				$.each( fleet.ships || [], function(i,ship) {
					shields += valueOf(ship,"shields",ship,fleet);
				} );
				return Math.ceil( shields/2 );
			}
		},
		
		// BELLEROPHON
		
		// Luther Sloan
		"crew:luther_sloan_72001p": {
			factionPenalty: function(card,ship,fleet) {
				if( $factions.hasFaction(ship,"federation",ship,fleet) )
					return 0;
				return 1;
			}
		},
		
		// Tricobalt Device
		"weapon:tricobalt_device_72001p": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class != "Intrepid Class" )
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			}
		},
		
		// Variable Geometry Pylons
		"tech:variable_geometry_pylons_72001p": {
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Intrepid Class" )
					return false;
				return onePerShip("Variable Geometry Pylons")(card,ship,fleet);
			}
		},
		
		
		// Mendak
		"captain:mendak_cap_71794": {
			canEquipCaptain: function(card,ship,fleet) {
				return $factions.hasFaction(ship,"romulan",ship,fleet);
			},
		},
		"admiral:mendak_71794": {
			canEquipAdmiral: function(card,ship,fleet) {
				return $factions.hasFaction(ship,"romulan",ship,fleet);
			},
		},
		
		
		// T'Ong
		
		// K'Temoc
		"captain:k_temoc_72009": {
			// Klingon talent
			upgradeSlots: [
				{
					type: ["talent"],
					rules: "Klingon Talents Only",
					canEquip: function(card,ship,fleet) {
						return hasFaction(card,"klingon",ship,fleet);
					}
				}
			],
			intercept: {
				ship: {
					// Klingon upgrades cost -1 SP
					cost: function(card,ship,fleet,cost) {
						if( isUpgrade(card) && hasFaction(card,"klingon",ship,fleet) )
							cost = resolve(card,ship,fleet,cost) - 1;
						return cost;
					},
					// Double faction penalty for non-klingon upgrades
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( isUpgrade(card) && !hasFaction(card,"klingon",ship,fleet) )
							factionPenalty = resolve(card,ship,fleet,factionPenalty) * 2;
						return factionPenalty;
					}
				}
			}
		},
		
		"talent:devotion_to_duty_72009": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship,"klingon",ship,fleet) && hasFaction(ship.captain,"klingon",ship,fleet);
			},
		},
		
		// Tactical Officer
		"crew:tactical_officer_72009": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"klingon",ship,fleet) )
							return resolve(upgrade,ship,fleet,cost) + 3;
						return cost;
					}
				}
			},
			canEquip: onePerShip("Tactical Officer")
		},
		
		// Cryogenic Stasis
		"tech:cryogenic_stasis_72009": {
			upgradeSlots: cloneSlot( 2 ,
				{
					type: ["crew"],
					rules: "Non-Borg, Combined cost 5 or less",
					faceDown: true,
					canEquip: function(card,ship,fleet,upgradeSlot) {
						// Non-Borg
						if( hasFaction(card,"borg",ship,fleet) )
							return false;
						// Combined cost of 5 SP or less
						var otherSlotCost = 0;
						$.each( $filter("upgradeSlots")(ship), function(i, slot) {
							if( upgradeSlot != slot && slot.occupant && slot.source == "Cryogenic Stasis" )
								otherSlotCost = valueOf(slot.occupant,"cost",ship,fleet)
						});
						return otherSlotCost + valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							free: function() { return true; },
						}
					}
				}
			),
		},
		
		// VRAX
		
		// Coordinated Attack
		"talent:coordinated_attack_72010": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "romulan", ship, fleet) && ship.captain && $factions.hasFaction(ship.captain, "romulan", ship, fleet);
			}
		},

		// Bridge Officer
		"crew:bridge_officer_72010": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"romulan",ship,fleet) )
							return resolve(upgrade,ship,fleet,cost) + 2;
						return cost;
					}
				}
			},
			canEquip: onePerShip("Bridge Officer")
		},
		
		
		// THUNDERCHILD
		
		// Federation Task Force
		"talent:federation_task_force_72008": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship, "federation", ship, fleet) && ship.captain && hasFaction(ship.captain, "federation", ship, fleet);
			}
		},
		
		
		// BALANCE OF TERROR
		"talent:balance_of_terror_e_72002h": {
			upgradeSlots: [
				{
					type: ["talent"],
					rules: "",
					faceDown: true,
					canEquip: function(card,ship,fleet) {
						return $factions.match(card,ship) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							free: function() { return true; },
						}
					}
				}
			],
			canEquip: onePerShip("Balance of Terror"),
			intercept: {
				self: {
					cost: {
						priority: 1000,
						fn: function() { return 3; }
					}
				}
			}
		},
		
		"crew:balance_of_terror_c_72002h": {
			upgradeSlots: [
				{
					type: ["crew"],
					rules: "",
					faceDown: true,
					canEquip: function(card,ship,fleet) {
						return $factions.match(card,ship) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							free: function() { return true; },
						}
					}
				}
			],
			canEquip: onePerShip("Balance of Terror"),
			intercept: {
				self: {
					cost: {
						priority: 1000,
						fn: function() { return 3; }
					}
				}
			}
		},
		
		"tech:balance_of_terror_t_72002h": {
			upgradeSlots: [
				{
					type: ["tech"],
					rules: "",
					faceDown: true,
					canEquip: function(card,ship,fleet) {
						return $factions.match(card,ship) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							free: function() { return true; },
						}
					}
				}
			],
			canEquip: onePerShip("Balance of Terror"),
			intercept: {
				self: {
					cost: {
						priority: 1000,
						fn: function() { return 3; }
					}
				}
			}
		},
		
		"weapon:balance_of_terror_w_72002h": {
			upgradeSlots: [
				{
					type: ["weapon"],
					rules: "",
					faceDown: true,
					canEquip: function(card,ship,fleet) {
						return $factions.match(card,ship) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							free: function() { return true; },
						}
					}
				}
			],
			canEquip: onePerShip("Balance of Terror"),
			intercept: {
				self: {
					cost: {
						priority: 1000,
						fn: function() { return 3; }
					}
				}
			}
		},
		
		
		// BIOSHIP BETA
		
		// Biological Weapon
		"weapon:biological_weapon_72012": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Species 8472 Bioship";
			}
		},
		
		// Energy Blast
		"weapon:energy_blast_72012": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Species 8472 Bioship";
			}
		},
		
		// Biological Technology
		"tech:biological_technology_72012": {
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Species 8472 Bioship" )
					return false;
				return onePerShip("Biological Technology")(card,ship,fleet);
			}
		},
		
		// Biogenic Field
		"tech:biogenic_field_72012": {
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Species 8472 Bioship" )
					return false;
				return onePerShip("Biogenic Field")(card,ship,fleet);
			}
		},
		
		// Electrodynamic Fluid
		"tech:electrodynamic_fluid_72012": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Species 8472 Bioship";
			}
		},
		
		// Fluidic Space
		"tech:fluidic_space_72012": {
			canEquip: onePerShip("Fluidic Space"),
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"species-8472",ship,fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		// KAZON SHIPS (First Maje slot)
		
		"talent:first_maje_71793": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship,"kazon",ship,fleet) && hasFaction(ship.captain,"kazon",ship,fleet);
			},
			upgradeSlots: [{ type: ["tech"] }],
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + 2;
						return skill;
					}
				}
			}
		},
		
		
		
		
		
		"ship:ogla_razik_71793": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		
		// QUARK'S TREASURE
		
		"ship:quark_s_treasure_72013": {
			intercept: {
				ship: {
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( card.type == "crew" || card.type == "tech")
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		
		"captain:zek_cap_72013": {
			canEquipCaptain: function(card,ship,fleet) {
				return hasFaction(ship,"ferengi",ship,fleet);
			},
		},
		
		"captain:brunt_72013": {
			upgradeSlots: [
				{
					type: ["talent"],
					rules: "Grand Nagus Only",
					canEquip: function(card) {
						return card.name == "Grand Nagus";
					},
				}
			]
		},
		
		"admiral:zek_72013": {
			canEquipAdmiral: function(card,ship,fleet) {
				return hasFaction(ship,"ferengi",ship,fleet);
			},
		},
		
		"talent:smugglers_72013": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship, "ferengi", ship, fleet) && hasFaction(ship.captain, "ferengi", ship, fleet);
			}
		},
		
		"tech:cargo_hold_72013": {
			upgradeSlots: cloneSlot( 2, 
				{
					type: ["crew","tech"],
					rules: "Combined cost 4SP or less",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						// Combined cost of 4 SP or less
						var otherSlotCost = 0;
						$.each( $filter("upgradeSlots")(ship), function(i, slot) {
							if( upgradeSlot != slot && slot.occupant && slot.source == "Cargo Hold" )
								otherSlotCost = valueOf(slot.occupant,"cost",ship,fleet)
						});
						return otherSlotCost + valueOf(card,"cost",ship,fleet) <= 4;
					},
				} 
			),
			
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship, "ferengi", ship, fleet) )
					return false;
				return onePerShip("Cargo Hold")(card,ship,fleet);
			},
		
		},
		
		"tech:inversion_wave_72013": {
			canEquip: onePerShip("Inversion Wave")
		},
		
		// PHOENIX
		
		// High Energy Sensor Sweep
		"tech:high_energy_sensor_sweep_72011": {
			canEquip: onePerShip("High Energy Sensor Sweep")
		},
		
		// Arsenal
		"weapon:arsenal_72011": {
			upgradeSlots: cloneSlot( 2, { type: ["weapon"] } ),
			canEquip: onePerShip("Arsenal")
		},
		
		"question:aft_torpedo_launcher_72011": {
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation",ship,fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
			canEquip: function(upgrade,ship,fleet) {
				if( ship.classData && ship.classData.rearArc )
					return false;
				return ship.hull >= 4;
			},
		},
		
		// INTREPID
		
		// Vulcan Engineer
		"crew:vulcan_engineer_72002p": {
			factionPenalty: function(card, ship, fleet) {
				return ship && hasFaction(ship, "vulcan", ship, fleet) ? 0 : 1;
			}
		},
		
		// Dual Phaser Banks
		"weapon:dual_phaser_banks_72002p": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship, "federation", ship, fleet) )
					return false;
				return onePerShip("Dual Phaser Banks")(card,ship,fleet);
			},
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Constitution Class" && ship.class != "Constitution Refit Class" )
							return resolve(card,ship,fleet,cost) + 3;
						return cost;
					}
				}
			},
		},
		
		// Astrogator
		"question:astrogator_72002p": {
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation",ship,fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Constitution Class" && ship.class != "Constitution Refit Class" )
					return false;
				return onePerShip("Astrogator")(card,ship,fleet);
			},
		},
		
		
		// BELAK
		
		// Lovok
		"captain:lovok_blind_belak": {
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					rules: "Tal Shiar Only",
					canEquip: function(card) {
						return card.name == "Tal Shiar";
					}
				}
			]
		},
		
		// Tal Shiar
		"talent:tal_shiar_blind_belak": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship.captain,"romulan", ship, fleet);
			}
		},
		
		// BIOSHIP OMEGA
		
		"captain:bioship_omega_pilot_blind_bioship": {
			canEquipCaptain: function(card,ship,fleet) {
				return hasFaction(ship,"species-8472", ship, fleet);
			}
		},

		"weapon:energy_weapon_blind_bioship": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"species-8472", ship, fleet) )
					return false;
				return onePerShip("Energy Weapon")(card,ship,fleet);
			}
		},

		"tech:neuro_peptides_blind_bioship": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"species-8472", ship, fleet) )
					return false;
				return onePerShip("Neuro Peptides")(card,ship,fleet);
			}
		},
		
		"tech:organic_conduits_blind_bioship": {
			canEquip: function(card,ship,fleet) {
				return hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		
		"tech:resisitant_hull_blind_bioship": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"species-8472", ship, fleet) )
					return false;
				return onePerShip("Resistant Hull")(card,ship,fleet);
			}
		},
		
		
		// ALDARA
		
		"weapon:aft_weapons_array_blind_aldara": {
			canEquip: onePerShip("Aft Weapons Array"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Cardassian Galor Class" )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},

		"tech:high_energy_subspace_field_blind_aldara": {
			canEquip: onePerShip("High Energy Subspace Field"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"dominion",ship,fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		// LAKOTA
		
		"weapon:upgraded_phasers_blind_lakota": {
			canEquip: function(card,ship,fleet) {
				if( valueOf(ship,"attack",ship,fleet) > 3 )
					return false;
				return onePerShip("Upgraded Phasers")(card,ship,fleet);
			},
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation",ship,fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		// Toh'Kaht
		
		// Reactor Core
		"tech:reactor_core_blind_tohkaht": {
			canEquip: onePerShip("Reactor Core")
		},
		
		// DIASPORA
		
		"weapon:pulse_firing_particle_cannon_72003p": {
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"xindi",ship,fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		"tech:phase_deflector_pulse_72003p": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"xindi",ship,fleet) )
					return false;
				return onePerShip("Phase Deflector Pulse")(card,ship,fleet);
			},
		},
		
		// BURUK
		
		// Reactor Core
		"tech:targeting_systems_blind_buruk": {
			canEquip: onePerShip("Targeting Systems")
		},
		
		// Kurak
		"crew:kurak_blind_buruk": {
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"klingon",ship,fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		// INTERCEPTOR 8
		
		"talent:pursuit_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				return valueOf(ship,"hull",ship,fleet) <= 3;
			},
		},

		"crew:ro_laren_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				return hasFaction(ship,"federation",ship,fleet) || hasFaction(ship,"bajoran",ship,fleet);
			},
		},
		
		"weapon:phaser_strike_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				return valueOf(ship,"hull",ship,fleet) <= 3;
			},
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Bajoran Interceptor" )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		"tech:navigational_sensors_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Bajoran Interceptor" )
					return false;
				return onePerShip("Navigational Sensors")(card,ship,fleet);
			},
		},
		
		// NISTRIM-CULLUH
		
		"ship:nistrim_culluh_blind_nistrim_culluh": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		
		// Ambition
		"talent:ambition_blind_nistrim_culluh": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"kazon", ship, fleet) && hasFaction(ship.captain,"kazon", ship, fleet);
			}
		},
		
		// Stolen Technology
		"tech:stolen_technology_blind_nistrim_culluh": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"kazon", ship, fleet);
			}
		},
		
		// SELEYA
		
		// V'Tosh Ka'Tur
		"talent:v_tosh_ka_tur_blind_seleya": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"vulcan", ship, fleet) && hasFaction(ship.captain,"vulcan", ship, fleet);
			}
		},
		
		"crew:solin_blind_seleya": {
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"vulcan", ship, fleet) )
							return resolve(card,ship,fleet,cost) + 4;
						return cost;
					}
				}
			},
		},
		
		"tech:power_distribution_net_blind_seleya": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"vulcan",ship,fleet) )
					return false;
				return onePerShip("Power Distribution Net")(card,ship,fleet);
			},
		},
		
		// NUNK
		
		"talent:kidnap_blind_nunks_marauder": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"ferengi", ship, fleet) && hasFaction(ship.captain,"ferengi", ship, fleet);
			}
		},
		
		// DELTA FLYER
		
		// Tuvok
		"captain:tuvok_72014": {
			upgradeSlots: [
				{
					type: ["tech"],
					rules: "Costs -1 SP",
					intercept: {
						ship: {
							cost: function(card,ship,fleet,cost) {
								return resolve(card,ship,fleet,cost) - 1;
							}
						}
					}
				}
			]
		},
		
		// Unimatrix Shielding
		"tech:unimatrix_shielding_72014": {
			canEquip: onePerShip("Unimatrix Shielding"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation", ship, fleet) )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				},
				ship: {
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							return resolve(card,ship,fleet,shields) + 2;
						return shields;
					}
				}
			},
		},
		
		// Immersion Shielding
		"tech:immersion_shielding_72014": {
			canEquip: onePerShip("Immersion Shielding"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation", ship, fleet) )
							return resolve(card,ship,fleet,cost) + 3;
						return cost;
					}
				},
				ship: {
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							return resolve(card,ship,fleet,shields) + 1;
						return shields;
					}
				}
			},
		},
		
		// Parametallic Hull Plating
		"tech:parametallic_hull_plating_72014": {
			canEquip: onePerShip("Parametallic Hull Plating"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && !hasFaction(ship,"federation", ship, fleet) )
							return resolve(card,ship,fleet,cost) + 3;
						return cost;
					}
				}
			},
		},
		
		"weapon:photon_torpedoes_72014": {
			intercept: {
				self: {
					range: function(card,ship,fleet,range) {
						if( ship && ship.class.indexOf("Shuttlecraft") >= 0 )
							return "1 - 2";
						return range;
					}
				}
			},
		},
		
		// ROTARRAN
		
		"captain:martok_72015": {
			intercept: {
				ship: {
					cost: function(card,ship,fleet,cost) {
						if( isUpgrade(card) && hasFaction(card,"klingon",ship,fleet) )
							return resolve(card,ship,fleet,cost) - 1;
						return cost;
					}
				}
			},
		},
		
		"talent:the_day_is_ours_72015": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"klingon", ship, fleet) && hasFaction(ship.captain,"klingon", ship, fleet);
			}
		},
		
		"crew:jadzia_dax_72015": {
			intercept: {
				self: {
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( hasFaction(ship,"klingon",ship,fleet) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		
		"crew:worf_72015": {
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + ( hasFaction(card,"klingon",ship,fleet) ? 3 : 1 );
						return skill;
					}
				}
			}
		},
		
		// TALVATH
		
		"captain:telek_r_mor_72016": {
			upgradeSlots: [
				{
					type: ["talent"],
					rules: "Secret Research Only",
					canEquip: function(card,ship,fleet) {
						return card.name == "Secret Research";
					}
				}
			]
		},
		
		"talent:secret_research_72016": {
			intercept: {
				ship: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Romulan Science Vessel" )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		"tech:temporal_displacement_72016": {
			canEquip: function(card,ship,fleet) {
				return ship && ship.class == "Romulan Science Vessel";
			}
		},
		
		"tech:advanced_scanning_72016": {
			intercept: {
				ship: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Romulan Science Vessel" )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
		},
		
		"tech:signal_amplifier_72016": {
			intercept: {
				ship: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ship.class != "Romulan Science Vessel" )
							return resolve(card,ship,fleet,cost) + 5;
						return cost;
					}
				}
			},
			canEquip: onePerShip("Signal Amplifier")
		},
		
		"tech:warp_core_ejection_system_72016": {
			canEquip: onePerShip("Warp Core Ejection System")
		},
		
		"tech:test_cylinder_72016": {
			canEquip: function(card,ship,fleet) {
				return ship && ship.class == "Romulan Science Vessel";
			}
		},
		
		// AZATI PRIME
		
		// Ibix Dynasty
		"talent:ibix_dynasty_72004p": {
			upgradeSlots: cloneSlot( 2, { type: ["weapon"] } )
		},
		
		// Proto
		"weapon:prototype_weapon_72004p": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship,"xindi",ship,fleet);
			}
		},

		// U.S.S. Constellation
		// Standby Battle Stations - check for battlestations icon in action bar of assigned ship
		"talent:standby_battle_stations_constellation": {
			canEquip: function(upgrade,ship,fleet) {
				return (ship && !!~ship.actions.indexOf("battlestations"));
			}
		},
		
		// Auxiliary Control Room - one per ship only
		"tech:auxiliary_control_room_constellation_tech": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Auxiliary Control Room")(upgrade,ship,fleet);
			}
		},
		"weapon:auxiliary_control_room_constellation_weapon": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Auxiliary Control Room")(upgrade,ship,fleet);
			}
		},
		
		// Automated Distress Beacon - one per ship only
		"crew:automated_distress_beacon_constellation_crew": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Automated Distress Beacon")(upgrade,ship,fleet);
			}
		},
		"tech:automated_distress_beacon_constellation_tech": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Automated Distress Beacon")(upgrade,ship,fleet);
			}
		},
		"weapon:automated_distress_beacon_constellation_weapon": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Automated Distress Beacon")(upgrade,ship,fleet);
			}
		},

		// I.R.W. Jazkal
		// Reman Bodyguards - one per ship only, if on ship with Vrax as captain -2 SP
		"crew:reman_bodyguards_jazkel": {
				intercept: {
				self: {
					canEquip: function(upgrade,ship,fleet) {
						if ( onePerShip("Reman Bodyguards")(upgrade,ship,fleet) )
							return true;
						if ( onePerShip("Reman Bodyguards")(upgrade,ship,fleet) && ship.captain && ( ship.captain.name == "Vrax" ) )
							return true;
						return false;
					},
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.captain && ship.captain.name == "Vrax" )
							return resolve(upgrade,ship,fleet,cost) - 2;
						return cost;
					}
			}
			},
		},	
		
		// Disruptor Banks - one per ship only
		"weapon:distuptor_banks_jazkel": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Disruptor Banks")(upgrade,ship,fleet);
			}
		},
		
		// I.K.S. Amar
		// Stand By Torpedoes - one per ship only
		"weapon:stand_by_torpedoes_amar": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Stand By Torpedoes")(upgrade,ship,fleet);
			}
		},
	
		// I.R.W. T'Met
		// Charing Weapons - one per ship only
		"weapon:charging_Weapons_tmet": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("CHARGING WEAPONS")(upgrade,ship,fleet);
			}
		},

		// Self Repair Technology - one per ship only
		"tech:self_repair_technology_tmet": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("SELF REPAIR TECHNOLOGY")(upgrade,ship,fleet);
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "romulan", ship, fleet );
			}
		},

		// Scorpion 4
		// Cover Fire - one per ship only
		"squadron:cover_fire_71203": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Cover Fire")(upgrade,ship,fleet);
			}
		},
		
		// Torpedo Attack - one per ship only
		"squadron:torpedo_attack_71203": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Torpedo Attack")(upgrade,ship,fleet);
			}
		},

		// Support Ship - one per ship only
		"squadron:support_ship_71203": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Support Ship")(upgrade,ship,fleet);
			}
		},

		// Dreadnought
		// Counter Measures - one per ship only, +5 SP on any ship except ATR-4107
		"tech:counter_measures_71212": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Counter Measures")(upgrade,ship,fleet);
			},
			cost: function(upgrade,ship,fleet,cost) {
				if( ship && ship.class != "Cardassian ATR-4107" )
					return resolve(upgrade,ship,fleet,cost) + 5;
				return cost;
			}
		},
		
		// Maintenance Crew
		"question:maintenance_crew_71212": {
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			upgradeSlots: [  
				{ 
					type: function(upgrade,ship) {
						return getSlotType(upgrade,ship);
					}
				},
				{
					type: ["crew"]
				}
			],
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Maintenance Crew")(upgrade,ship,fleet);
			}
		},
		
		// U.S.S. Hathaway
		// Navigational Station - one per ship only
		"tech:navigational_station_71201": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Navigational Station")(upgrade,ship,fleet);
			}
		},
		
		// R.I.S. Pi
		// Distress Signal - one per ship only
		"tech:distress_signal_pi": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Distress Signal")(upgrade,ship,fleet);
			}
		},
	
		// Gravition Field Generator - one per ship only
		"tech:gravition_field_generator_pi": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Gravition Field Generator")(upgrade,ship,fleet);
			}
		},
	
		// Self Destruct Sequence - one per ship only
		"tech:self_destruct_sequence_pi": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Self Destruct Sequence")(upgrade,ship,fleet);
			}
		},
		
		// I.S.S. Enterprise
		// Agony Booth - one per ship only
		"tech:agony_booth_71796": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Agony Booth")(upgrade,ship,fleet);
			}
		},

		// Temporal Cold War Cards
		// Vosk - talents have no faction penalty
		"captain:temporal_cold_war_vosk": {
			factionPenalty: function(card,ship,fleet,factionPenalty) {
				if( card.type == "talent" )
					return 0;
				return factionPenalty;
			}
		},
		
		// Temporal Conduit - +5 SP if fielded on a non-Mirror Universe ship
		"tech:temporal_conduit_72224gp": {
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"mirror-universe", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			}
		},
		
		// Xindus
		// Photon Torpedoes - +1 attack die if fielded on a Xindi Reptilian Warship
		"weapon:photon_torpedoes_xindus": {
			attack: function(upgrade,ship,fleet,attack) {
				if( ship && ship.class == "Xindi Reptilian Warship" )
					return resolve(upgrade,ship,fleet,attack) + 1;
				return attack;
			}
		},

		// Xindi Weapon Zero
		// Arming Sequence - only on Xindi Weapon
		"talent:arming_sequence_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Xindi Weapon" );
			}
		},
		
		// Destructive Blast - only on Xindi Weapon
		"weapon:destructive_blast_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Xindi Weapon" );
			}
		},
		
		// Rotating Emitters - only on Xindi Weapon
		"weapon:rotating_emitters_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Xindi Weapon" );
			}
		},
		
		// Subspace Vortext - only on Xindi ship
		"tech:subspace_vortex_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"xindi", ship, fleet);
			}
		},
		
		// Self-Destruct - only on Xindi Weapon
		"tech:self_destruct_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Xindi Weapon" );
			}
		},
		
		// Degra
		"crew:degra_weapon_zero": {
			intercept: {
				ship: {
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon" && $factions.hasFaction(upgrade,"xindi", ship, fleet) )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},
				}
			}
		},

		// I.K.S. Amar
		// Klingon Helmsman - +5 SP if fielded on a non-Klingon ship
		"crew:klingon_helmsman_amar": {
			intercept: {
				self: {
					canEquip: function(upgrade,ship,fleet) {
						if ( ship && ship.classData && ship.classData.maneuvers )
							for (i = 1; i < ship.classData.maneuvers.max; i++ )
							{
								if ( ship.classData.maneuvers[i].about !== undefined )
									return true;
							}
						return false;
					}
				},
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"klingon", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		
		// Klingon Navigator - one per ship only
		"crew:klingon_navigator_amar": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Klingon Navigator")(upgrade,ship,fleet);
			}
		},
	

		// The Classic Movies - U.S.S. Reliant
		// Khan Singh
		"captain:the_classic_movies_khan_singh": {
			intercept: {
				ship: {
					// No faction penalty for upgrades
					factionPenalty: function(card, ship, fleet, factionPenalty) {
						if( isUpgrade(card) )
							return 0;
						return factionPenalty;
					}
				}
			},
			//text: "Up to 3 of the Upgrades you purchase for your ship cost exactly 4 SP each and are placed face down beside your Ship Card, the printed cost on those Upgrades cannot be greater than 6",
			// TODO not very sophisticated
			upgradeSlots: [{/* Existing Talent Slot */} ].concat(cloneSlot( 3 , 
				{ 
					type: upgradeTypes,
					faceDown: true,
					intercept: {
						ship: {
							cost: function() { return 4; },
							factionPenalty: function() { return 0; },
							canEquip: function(card,ship,fleet,canEquip) {
								if( (valueOf(card,"cost",ship,fleet) <= 6) )
									return canEquip;
								return false;
							}
						}
					}
				}
			)),
		},
		
		// I.R.W. Jazkal
		// Nijil
		"crew:nijil_jazkal": {
			//text: "Add 1 [tech] Upgrade to your Upgrade Bar. That Upgrade costs -1 SP (min 1) and must be a Romulan [tech] Upgrade.",
			upgradeSlots: cloneSlot( 1 , 
				{ 
					type: ["tech"],
					intercept: {
						ship: {
							cost: function(upgrade,ship,fleet,cost) {
								cost = resolve(upgrade,ship,fleet,cost) - 1;
								if (cost < 1)
									cost = 1;
								return cost;
							},
							canEquip: function(card,ship,fleet,canEquip) {
								if( !$factions.hasFaction( card, "romulan", ship, fleet ) )
									return false;
								return canEquip;
							}
						}
					}
				}
			),
		},
		
		// Tebok
		// TODO add a talent slot somehow or a way to add a talent card without the slot
		"captain:tebok_tmet": {
			// ... if there is at least one other Romulan Ship in your starting fleet, Tebok my field 1 Romulan [talent] at a cost of -1 SP.
			// This is a messy implementation. It requires recalculation of the candidate for each upgrade on the ship.
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						
						var candidate = false;
						var candCost = 0;
						var romulanCount = 0;
						
						// Find if there are two romulan ships in the fleet
						$.each( fleet.ships, function(i, ship) {
							if ( $factions.hasFaction(ship,"romulan",ship,fleet) )
								romulanCount += 1;
						});
						
						if (romulanCount < 2)
							return cost;
						
						// Find a talent on the ship
						$.each( $filter("upgradeSlots")(ship), function(i, slot) {
							if( slot.occupant && slot.occupant != upgrade && slot.occupant.type == "talent" && $factions.hasFaction(slot.occupant,"romulan",ship,fleet) ) {
								var occCost = valueOf(slot.occupant,"cost",ship,fleet);
								// Stop as soon as we have a Talent with cost > 0
								if( occCost > 0 ) {
									candidate = slot.occupant;
									candCost = occCost;
									return false;
								}
							}
						});
						
						// Subtract 1 from Tebok's cost
						return candCost > 0 ? cost - 1 : cost;
						
					}
				}
			}
		},
		
		// Covert Mission
		// TODO card rules missing
		
		// I.K.S. Drovana
		// Kurn
		"captain:kurn_72241": {
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					rules: "Klingon only",
					canEquip: function(card,ship,fleet,canEquip) {
						return $factions.hasFaction( card, "klingon", ship, fleet );
					}
				}
			]
		},
		
		// Emergency Power
		"tech:emergency_power_72241": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Emergency Power")(upgrade,ship,fleet);
			}
		},
		
		// Photon Torpedoes (Vor'cha Bonus)
		"weapon:photon_torpedoes_72241": {
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Vor'cha Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}
		},
		
		// I.R.W. Algeron
		// Command Pod
		"talent:command_pod_72242": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "D7 Class" );
			}
		},
		
		// Romulan Technical Officer
		"crew:romulan_technical_officer_72242": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Romulan Technical Officer")(upgrade,ship,fleet);
			}
		},
		
		// Impulse Drive
		"tech:impulse_drive_72242": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Impulse Drive")(upgrade,ship,fleet);
			}
		},
		
		// The Classic Movies - Kruge's Bird-of-Prey
		// Kruge
		"captain:the_classic_movies_kruge" : {
					upgradeSlots : [{}, {
							type : ["crew"]
						}
					],

				},
				
		
		
		// Borg Cube with Sphere Port
		// I Am The Borg
		"talent:i_am_the_borg_72255": {
			rules: "Borg Queen only",
			canEquip: function(upgrade,ship,fleet) {
				return ship.captain && ship.captain.name == "Borg Queen";
			}
		},
		
		// Borg Support Vehicle Dock
		"borg:borg_support_vehicle_dock_72255": {
			rules: "Borg Cube only",
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Borg Cube" );
			}
		},
		
		// Temporal Vortex
		"tech:temporal_vortex_72255": {
			rules: "Borg ship only",
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "borg", ship, fleet );
			}
		},

		// Torpedo Bay
		"weapon:torpedo_bay_enterprise_a": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"],
					rules: "Photon Torpedoes Only",
					canEquip: function(upgrade) {
						return upgrade.name == "Photon Torpedoes";
					},
				}
			]
		},
	
		// Delta Shift - U.S.S. Cairo
		"question:delta_shift_cairo": {
			isSlotCompatible: function(slotTypes) {
				//console.log($.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0);
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			upgradeSlots: [  
				{ 
					type: function(upgrade,ship) {
						return getSlotType(upgrade,ship);
					}
				}
			],
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Delta Shift")(upgrade,ship,fleet);
			}
		},

		// James T. Kirk - H.M.S. Bounty
		"captain:james_t_kirk_bounty": {
			intercept: {
				ship: {
					// All federation crew cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew" && $factions.hasFaction(upgrade,"federation", ship, fleet) )
							return resolve(upgrade, ship, fleet, cost) - 1;
						return cost;
					},
				}
			}
			
		},
	
		// Montgomery Scott - H.M.S. Bounty
		"crew:montgomery_scott_bounty": {
			upgradeSlots: [ 
				{ 
					type: ["tech", "weapon"]
				}
			]
		},
		
		// Computer Core - U.S.S. Venture
		"question:computer_core_venture": {
			isSlotCompatible: function(slotTypes) {
				//console.log($.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0);
				return $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			upgradeSlots: [  
				{ 
					type: ["tech"]
				}
			]
		},

		// Addition Phase Arrays - U.S.S. Venture
		"weapon:additional_phaser_arrays_venture": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Additional Phaser Arrays")(upgrade,ship,fleet);
			}
		},
		
		// High-Capacty Deflector Shield Grid - U.S.S. Venture
		"tech:high_cpaacity_deflector_shield_grid_venture": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("High-Capacty Deflector Shield Grid")(upgrade,ship,fleet);
			}
		},
		
		// Control Central - I.R.W. Rateg
		"tech:control_central_rateg": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Control Central")(upgrade,ship,fleet);
			}
		},
		
		// Main Batteries - I.R.W. Rateg
		"weapon:main_batteries_rateg": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Main Batteries")(upgrade,ship,fleet);
			},
			upgradeSlots: [  
				{ 
					type: ["weapon"]
				}
			]
		},
		
		// Deflector Control - U.S.S. Enterprise-B
		"tech:deflector_control_enterprise_b": {
			rules: "Only one per ship",
			canEquip: onePerShip("Deflector Control")
		},
		
		// Holo-Communicator - U.S.S. Enterprise-B
		"tech:holo_communicator_enterprise_b": {
			rules: "Only one per ship",
			canEquip: onePerShip("Holo-Communicator")
		},
		
		// Resonance Burst - U.S.S. Enterprise-B
		"tech:resonance_burst_enterprise_b": {
			rules: "Only one per ship",
			canEquip: onePerShip("Resonance Burst")
		},
		
		// Full Reverse - U.S.S. Enterprise-B
		"tech:full_reverse_enterprise_b": {
			rules: "Only one per ship",
			canEquip: onePerShip("Full Reverse")
		},

		// Jean-Luc Picard - Enterprise-D
		"captain:jean_luc_picard_enterprise_72284p": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						modifier = 0;
						
						if ( ship )
							modifier += 2;
						
						if ( modifier > 5)
							modifier = 5;
						
						return cost - modifier;
					}
				}
			}
		},
		
		// Natasha Yar - U.S.S. Enterprise-D
		"crew:natasha_yar_72284p": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				},
				{ 
					type: ["weapon"]
				}
			]
		},
		
		// Aft Phaser Emitters - U.S.S. Enterprise-D
		"weapon:aft_phaser_emitters_72284p": {
			attack: 0,
			// Equip only on a Federation ship with hull 4 or more
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) && ship.hull >= 4;
			},
			intercept: {
				self: {
					// Attack is same as ship primary - 1
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet) - 1;
						return attack;
					},
					// Cost is primary weapon
					cost: function(upgrade,ship,fleet,cost) {
						if( ship )
							return resolve(upgrade,ship,fleet,cost) + valueOf(ship,"attack",ship,fleet);
						return cost;
					}
				}
			}
		},
		
		// Transporter - U.S.S. Enterprise-D
		"tech:transporter_72284p": {
			rules: "Only one per ship",
			canEquip: onePerShip("Transporter")
		},
		
		// Particle Beam Weapon - Muratas
		"weapon:particle_beam_weapon_muratas": {
			attack: 0,
			// Equip only on a Xindi
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"xindi", ship, fleet);
			},
			intercept: {
				self: {
					// Attack is same as ship primary + 1
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet) + 1;
						return attack;
					},
					// Cost is primary weapon
					cost: function(upgrade,ship,fleet,cost) {
						if( ship )
							return resolve(upgrade,ship,fleet,cost) + valueOf(ship,"attack",ship,fleet);
						return cost;
					}
				}
			}
		},
		
		// Auxiliary Power to Shields - I.K.S. Hegh'ta
		"tech:auxiliary_power_to_shields_72281p": {
			rules: "Only one per ship",
			canEquip: onePerShip("Auxiliary Power to Shields")
		},
		
		// Course Change - I.K.S. Hegh'ta
		"crew:change_course_72281p_crew": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"talent:change_course_72281p_talent": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"tech:change_course_72281p_tech": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"weapon:change_course_72281p_weapon": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		//Lursa and B'Etor crew
		"crew:lursa_crew_72282p": {
			upgradeSlots: [
				{
					type: ["talent"]
				}
			],
			canEquip: function(upgrade,ship,fleet) {
				return ship.captain && ship.captain.name == "B'Etor";
			},
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain )
							return resolve(upgrade,ship,fleet,skill) + 4;
						return skill;
					}
				}
			}
		},
		
		"crew:betor_crew_72282p": {
			upgradeSlots: [ 
				{ 
					type: ["talent"]
				}
			],
			canEquip: function(captain,ship,fleet) {
				return captain.name == "Lursa";
			},
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + 4;
						return skill;
					}
				}
			}
		},
		
		"tech:tech_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["tech"]
				}
			],
			intercept: {
				ship: {
					// No faction penalty for upgrades
					factionPenalty: function(card, ship, fleet, factionPenalty) {
						if( hasFaction(upgrade,"independent",ship,fleet) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		
		"weapon:weapon_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["weapon"]
				}
			],
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "independent", ship, fleet) && $factions.hasFaction(ship.captain, "independent", ship, fleet);
			}
		},
		
		"crew:crew_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["crew"]
				}
			],
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "independent", ship, fleet) && $factions.hasFaction(ship.captain, "independent", ship, fleet);
			}
		},
		// Hatchery - Orassin
		"tech:hatchery_orassin": {
			// Equip only on a Xindi ship
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"xindi", ship, fleet) && onePerShip("Hatchery");
			},/*
			upgradeSlots: cloneSlot( 1 , 
				{ 
					type: ["crew"],
					source: "Face-down Xindi",
					intercept: {
						ship: {
							cost: function(upgrade,ship,fleet,cost) {
								cost = 0;
								return cost;
							},
							canEquip: function(card,ship,fleet,canEquip) {
								if( !$factions.hasFaction( card, "xindi", ship, fleet ) )
									return false;
								return canEquip;
							}
						}
					}
				}
			),*/
			upgradeSlots: [  
				{ 
					type: ["crew"],
					source: "Face-down Xindi (free)",
					intercept: {
						ship: {
							cost: function(upgrade,ship,fleet,cost) {
								cost = 0;
								return cost;
							},
							canEquip: function(card,ship,fleet,canEquip) {
								if( !$factions.hasFaction( card, "xindi", ship, fleet ) )
									return false;
								return canEquip;
							}
						}
					}
				},
				{ 
					type: ["crew"]
				}
			]

		},
		"resource:captains_chair_resource":{
			intercept: {
				ship: {
					cost: {
						priority: 100,
						fn: function(upgrade, ship, fleet, cost) {
								return 3;
							return cost;
						}
					}
							
				}
			}
		}
	};
}]);
