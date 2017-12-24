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
		//Enterprise-D 360
		"ship:1001":{
			slotType: "resource"
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
									if( hasFaction(upgrade,"federation",ship,fleet) || hasFaction(upgrade,"bajoran",ship,fleet) || hasFaction(upgrade,"vulcan",ship,fleet) )
										return 3;
									return cost;
								}
							},
							// TODO Check if faction penalty should be applied
							factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
								if( hasFaction(upgrade,"federation",ship,fleet) || hasFaction(upgrade,"bajoran",ship,fleet) || hasFaction(upgrade,"vulcan",ship,fleet) )
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
			},
			intercept: {
				ship: {
					// No faction penalty for Khan or Talents
					factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
						return upgrade.type == "captain" || upgrade.type == "talent" ? 0 : factionPenalty;
					}
				}
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
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			name: "Multi-Adaptive Shields",
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) || $factions.hasFaction(ship,"bajoran", ship, fleet) || $factions.hasFaction(ship,"vulcan", ship, fleet);
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
		// T'Rul
		"crew:t_rul_71786": {
			upgradeSlots: [ 
				{ 
					type: ["tech"], 
				}
			]
		},
		//Quark
		"crew:quark_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Odo
		"crew:odo_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Vic Fontaine
		"crew:vic_fontaine_crew_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction(ship,"federation", ship, fleet) ? 0 : 1 && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		"tech:vic_fontaine_tech_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction(ship,"federation", ship, fleet) ? 0 : 1 && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}
		},
		//Julian Bashir
		"crew:julian_bashir_71786":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
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
						if( upgrade.type == "weapon" && $factions.hasFaction(upgrade,"kazon", ship, fleet) || $factions.hasFaction(upgrade,"independent", ship, fleet)) {
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
		"captain:matthew_dougherty_cap_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:matthew_dougherty_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Picard 8
		"captain:jean_luc_picard_b_71531": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["crew","tech","weapon","talent"]
				}
			]
		},
		// Advanced Shields
		"tech:advanced_shields_71531": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			// Only one per ship
			canEquip: onePerShip("Advanced Shields")
		},
		//Fire At Will!
		"talent:fire_at_will__71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Make It So
		"talent:make_it_so_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Data
		"crew:data_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// William T. Riker (Ent-E)
		"crew:william_t_riker_71531": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["crew"]
				}
			]
		},
		// Geordi LaForge
		"crew:geordi_la_forge_71531": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				{
					type: ["tech"]
				}
			]
		},
		//Beverly Crusher
		"crew:beverly_crusher_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Deanna Troi
		"crew:deanna_troi_71531":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Photon Torpedoes (Sovereign)
		"weapon:photon_torpedoes_71531": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["tech","weapon","crew"]
				}
			],
			// Reduce cost of all Upgrades by 1 SP if on Independent ship
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ($factions.hasFaction(ship,"independent", ship, fleet) || $factions.hasFaction(ship,"ferengi", ship, fleet) || $factions.hasFaction(ship,"kazon", ship, fleet) || $factions.hasFaction(ship,"xindi", ship, fleet) )&& isUpgrade(upgrade) )
							return resolve(upgrade,ship,fleet,cost) - 1;
						return cost;
					}
				}
			}
		},
		//Chakotay
		"captain:chakotay_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["weapon","crew"]
				}
			]
		},
		//Tuvok
		"crew:tuvok_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//B'Elanna Torres
		"crew:b_elanna_torres_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Kenneth Dalby
		"crew:kenneth_dalby_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Seska
		"crew:seska_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Evasive Pattern Omega
		"talent:evasive_pattern_omega_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Be Creative
		"talent:be_creative_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Ramming Attack
		"weapon:ramming_attack_71528":{
			// Equip only on a ship with hull 3 or less
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			},
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes Independent
		"weapon:photon_torpedoes_71528":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Assimilated Vessel 80279 :71512
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
		
		
	//Scimitar :71533
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
		
		
	//Chang's Bird of Prey : 71532
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
		
		
	//I.S.S. Defiant :71529
		"ship:i_s_s_defiant_71529": {
			class: "Defiant Class",
			classId: "defiant_class_mirror"
		},
		"ship:mirror_universe_starship_71529": {
			class: "Defiant Class",
			classId: "defiant_class_mirror"
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
		// Jennifer Sisko
		"crew:jennifer_sisko_71529": {
			upgradeSlots: [ 
				{ 
					type: ["tech"]
				}
			]
		},
		
		
	//Tactical Cube 001 :71513a
		// Borg Queen
		"captain:borg_queen_71513a": {
			upgradeSlots: [ 
				{}, // Existing talent slot
				{ 
					type: ["borg"]
				}
			]
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
		
		
	//Assimilated Vessel 64758 :71513b
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
		
		
	//Cube 112 :71792
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
		
		
	// 1st Wave Attack Fighters :71754
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
		
		
	//Regent's Flagship :71535
		"ship:regent_s_flagship_71535": {
			class: "Negh'var Class",
			classId: "negh_var_class_mirror"
		},
		"ship:mirror_universe_starship_71535": {
			class: "Negh'var Class",
			classId: "negh_var_class_mirror"
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
		
		
	//Fina Prime :71534
		//Vidiian Commander
		"captain:vidiian_commander_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Vidiian Boarding Party
		"crew:Vidiian Boarding Party":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Dereth
		"crew:dereth_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Denara Pel
		"crew:denara_pel_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Sulan
		"crew:sulan_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Hypothermic Charge
		"weapon:hypothermic_charge_71534": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf( "Vidiian" ) >= 0;
			}
		},
		//Grappler
		"weapon:grappler_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Decisive Orders
		"talent:devisive_orders_71534":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
			
			
	//I.K.S. Pagh :71996
		// William T. Riker (Pagh)
		"crew:william_t_riker_71996": {
			talents: 1,
			factionPenalty: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1 && $factions.hasFaction(ship,"klingon", ship, fleet) ? 0 : 1;
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
		
		
	//Alpha Hunter :71808
		//Alpha Hirogen
		"captain:alpha_hirogen_71808":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Karr
		"captain:karr_71808":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Monotanium Armor Plating
		"tech:monotanium_armor_plating_71808": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Stalking Mode
		"talent:stalking_mode_71808":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Full Reverse
		"talent:full_reverse_71808":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Subnucleonic Beam
		"weapon:subnucleonic_beam_71808": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		// Turanj
		"crew:turanj_71808": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			]
		},
		
		
	//Fighter Squadron 6 :71753
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
		
		
	//Prototype 01 :71536
		// Only Gareb or Romulan Drone Pilot as Captain
		"ship:prototype_01_71536": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" ||  captain.name == "Jhamel" || captain.name == "Romulan Drone Pilot";
					}
				}
			}
		},
		"ship:romulan_starship_71536": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" ||  captain.name == "Jhamel" || captain.name == "Romulan Drone Pilot";
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
		
		
	//Tholia One (Retail) :71795
		// Tholian Assembly
		"talent:tholian_assembly_71795": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.class.indexOf("Tholian") >= 0 && 
						ship.captain && ( ship.captain.name == "Loskene" || ship.captain.name.indexOf("Tholian") >= 0 );
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
		
		
	//I.R.W. Haakona :71794
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
		
		
	//Ogla-Razik :71793
		"ship:ogla_razik_71793": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		//Jabin
		"captain:jabin_71793":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Razik
		"captain:razik_71793":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
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
		//First Maje
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
		//Particle Beam Weapon
		"weapon:particle_beam_weapon_71793":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//U.S.S. Hood :71998p
		//Robert DeSoto
		"captain:robert_desoto_71998p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Tachyon Detection Grid
		"talent:tachyon_detection_grid_71998p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//William T. Riker
		"crew:william_t_riker_71998p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Systems Upgrade
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
		//Type 8 Phaser Array
		"weapon:type_8_phaser_array_71998p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				if( ship.attack <= 3 )
					return onePerShip("Type 8 Phaser Array")(upgrade,ship,fleet);
				return false;
			}
		},
		
		
	//Reklar :71798
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
		
		
	//Gornarus :71797
		// Slar
		"captain:slar_71797": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//S'Sesslak
		"captain:s_sesslak_71797":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Impulse Overload
		"tech:impulse_overload_gornarus":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Salvage
		"talent:salvage_71797":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Gorn Raiding Party
		"crew:gorn_raiding_party_71797":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Improved Deflector Screens
		"tech:improved_deflector_screens_71797": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			// Only one per ship and hull <= 3
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3 && onePerShip("Improved Deflector Screens")(upgrade,ship,fleet);
			}
		},
		// Targeted Phaser Strike
		"weapon:targeted_phaser_strike_71797": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		
	
	//I.S.S. Enterprise :71796
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
		// Agony Booth - one per ship only
		"tech:agony_booth_71796": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Agony Booth")(upgrade,ship,fleet);
			}
		},
		// Tantalus Field
		"talent:tantalus_field_71796": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "I.S.S. Enterprise";
			}
		},
		
		
	//Sakharov :71997p
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
		//Data
		"captain:data_71997p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Sirna Kolrami
		"crew:sirna_kolrami_71997p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Computer Analysis
		"talent:computer_analysis_71997p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
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
		
	
	//U.S.S. Pegasus :71801
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
		//Ronald Moore
		"captain:ronald_moore_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Erik Pressman
		"captain:erik_pressman_cap_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:erik_pressman_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// William T. Riker
		"crew:william_t_riker_71801": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		// Specialized Shields
		"tech:specialized_shields_71801": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet ) || $factions.hasFaction( ship, "bajoran", ship, fleet ) || $factions.hasFaction( ship, "vulcan", ship, fleet );
			}
		},
				// Phasing Cloaking Device
		"tech:phasing_cloaking_device_71801": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Escape Pod
		"tech:escape_pod_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Andy Simonson
		"crew:andy_simonson_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Phil Wallace
		"crew:phil_wallace_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Dawn Velazquez 
		"crew:dawn_velazquez_71801":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Eric Motz
		"crew:eric_motz_71801": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				{
					type: ["tech"]
				}
			]
		},
		
	
	//I.S.S. Avenger :71800
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
		
		
	//Kyana Prime :71799
		//Obrist
		"captain:obrist_71799":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Annorax
		"captain:annorax_71799": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		// Chroniton Torpedoes
		"weapon:chroniton_torpedoes_71799": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
	
	
	//IKS Korinar :71999p
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
		
		
	//IKS Ning'tao :71804
		"captain:kor_71804": {
			upgradeSlots: [
				{/* Talent */},
				{
					type: ["crew"]
				}
			]
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
	
	
	//Ratosha :71803
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
		//Day Kannu
		"captain:day_kannu_71803":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Krim
		"captain:krim_71803": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [
				{}, // Talent
				{
					type: ["crew"]
				}
			]
		},
		//Provisional Government
		"talent:provisional_government_71803":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
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
		// Bajoran Militia
		"crew:bajoran_militia_71803": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "bajoran", ship, fleet);
			}
		},
		//More Than Meets the Eye
		"talent:more_than_meets_the_eye_71803":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
	
	//USS Prometheus :71802
		//The Doctor
		"captain:the_doctor_71802":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//EMH Mark II
		"crew:emh_mark_ii_c_71802":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"tech:emh_mark_ii_t_71802":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Tactical Prototype
		"tech:tactical_prototype_71802":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
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
		// Regenerative Shielding
		"tech:regenerative_shielding_71802": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Photon Torpedoes -Prometheus
		"weapon:photon_torpedoes_71802":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Prometheus Class" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}},
		// Multi-Vector Assault Mode
		"weapon:multi_vector_assault_mode_71802": {
			canEquip: function(card,ship,fleet) {
				return ship.class == "Prometheus Class";
			},
		},
		
		
	//U.S.S. Pasteur :71807
		// Inverse Tachyon Pulse
		"tech:inverse_tachyon_pulse_71807": {
			canEquip: onePerShip("Inverse Tachyon Pulse")
		},
		
		
	//Kreechta :71806
		//Tarr
		"captain:tarr_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Bractor
		"captain:bractor_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
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
		//Photon Torpedoes -Ferengi
		"weapon:photon_torpedoes_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Missile Launchers
		"weapon:missile_launchers_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Tactical Officer
		"crew:tactical_officer_71806": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Tactical Officer")
		},
		//EM Pulse
		"tech:em_pulse_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Maximum Shields
		"tech:maximum_shields_71806":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Ferengi Probe
		"tech:ferengi_probe_71806": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Ferengi Probe")
		},
		
		
	//U.S.S. Dauntless :71805
		//Arturis
		"captain:arturis_71805": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Auto-Navigation
		"tech:auto_navigation_71805": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Quantum Slipstream Drive
		"tech:quantum_slipstream_drive_71805":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Power Distribution Grid
		"tech:power_distribution_grid_71805":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Force Field
		"tech:force_field_71805": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Navigational Deflector
		"tech:navigational_deflector_71805": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Navigational Deflector")
		},
		//Particle Synthesis
		"tech:particle_synthesis_71805": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Dauntless Class";
			}
		},
		//Emergency Shutdown
		"tech:emergency_shutdown_71805":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Lure
		"talent:lure_71805":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Q Continuum Cards :72000b
	
	//I.R.W. Terix :72000p
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
		
		
	//I.R.W. Vrax :72010
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
		
		
	//I.K.S. T'Ong :72009
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
		
		
	//U.S.S. Thunderchild :72008
		//Shanthi
		"captain:shanthi_cap_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:shanthi_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Hayes
		"captain:hayes_cap_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:hayes_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Persistence
		"talent:persistence_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Federation Task Force
		"talent:federation_task_force_72008": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship, "federation", ship, fleet) && ship.captain && hasFaction(ship.captain, "federation", ship, fleet);
			}
		},
		//Intercept
		"talent:intercept_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Torpedoes
		"weapon:photon_torpedoes_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"weapon:quantum_torpedoes_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Rapid Reload
		"crew:rapid_reload_c_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"weapon:rapid_reload_w_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"tech:rapid_reload_t_72008":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//U.S.S. Bellerophon :72001p
		//William Ross
		"captain:william_ross_cap_72001p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:william_ross_72001p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Section 31
		"talent:section_31_72001p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Luther Sloan
		"crew:luther_sloan_72001p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Tricobalt Device
		"weapon:tricobalt_device_72001p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		
		
	//Quark's Treasure :72013
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
		//Zek
		"captain:zek_cap_72013": {
			canEquipCaptain: function(card,ship,fleet) {
				return hasFaction(ship,"ferengi",ship,fleet);
			},
		},
		"admiral:zek_72013": {
			canEquipAdmiral: function(card,ship,fleet) {
				return hasFaction(ship,"ferengi",ship,fleet);
			},
		},
		//Quark
		"captain:quark_72013":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Brunt
		"captain:brunt_72013": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Grand Nagus
		"talent:grand_nagus_72013":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		"talent:smugglers_72013": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship, "ferengi", ship, fleet) && hasFaction(ship.captain, "ferengi", ship, fleet);
			}
		},
		//Odo
		"crew:odo_72013":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Nog
		"crew:nog_72013":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Rom
		"crew:rom_72013":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Cargo Hold
		"tech:cargo_hold_72013": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		//Inversion Wave
		"tech:inversion_wave_72013": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Inversion Wave")
		},
		
		
	//Bioship Beta :72012
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
		
		
	//U.S.S. Phoenix :72011
		//Haden
		"captain:haden_cap_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:haden_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Benjamin Maxwell
		"captain:benjamin_maxwell_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Prefix Code
		"talent:prefix_code_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Elizabeth Lense
		"crew:elizabeth_lense_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Terry
		"crew:terry_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//High Energy Sensor Sweep
		"tech:high_energy_sensor_sweep_72011":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("High Energy Sensor Sweep")
		},
		//Arsenal
		"weapon:arsenal_72011": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: cloneSlot( 2, { type: ["weapon"] } ),
			canEquip: onePerShip("Arsenal")
		},
		//Aft Torpedo Launcher
		"question:aft_torpedo_launcher_72011": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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

		
	//U.S.S. Intrepid :72002p
		//Matt Decker
		"captain:matt_decker_cap_72002p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"admiral:matt_decker_72002p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Flag Officer
		"talent:flag_officer_72002p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Vulcan Engineer
		"crew:vulcan_engineer_72002p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
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
		
		
	//R.I.S. Talvath :72016
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
		
		
	//I.K.S. Rotarran :72015
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
		
		
	//Delta Flyer :72014
		//Tom Paris
		"captain:tom_paris_72014":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Tuvok
		"captain:tuvok_72014": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//B'Elanna Torres
		"crew:b_elanna_torres_72014":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Harry Kim
		"crew:harry_kim_72014":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Seven of Nine
		"crew:seven_of_nine_72014":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Parametallic Hull Plating
		"tech:parametallic_hull_plating_72014": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		// Immersion Shielding
		"tech:immersion_shielding_72014": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Immersion Shielding"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && ( !hasFaction(ship,"federation", ship, fleet) && !hasFaction(ship,"bajoran", ship, fleet) && !hasFaction(ship,"vulcan", ship, fleet)) )
							return resolve(card,ship,fleet,cost) + 2;
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
		// Unimatrix Shielding
		"tech:unimatrix_shielding_72014": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Unimatrix Shielding"),
			intercept: {
				self: {
					cost: function(card,ship,fleet,cost) {
						if( ship && (!hasFaction(ship,"federation", ship, fleet) && !hasFaction(ship,"bajoran", ship, fleet) && !hasFaction(ship,"vulcan", ship, fleet) ) )
							return resolve(card,ship,fleet,cost) + 4;
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
		//Photonic Missiles
		"weapon:photonic_missiles_72014":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes -Delta Flyer
		"weapon:photon_torpedoes_72014": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					range: function(card,ship,fleet,range) {
						if( ship && ship.class.indexOf("Shuttlecraft") >= 0 )
							return "1 - 2";
						return range;
					}
				}
			}
		},
		
		
	//U.S.S. Hathaway :71201
		//William T. Riker
		"captain:william_t_riker_71201":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Improvise
		"talent:improvise_71201":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Wesley Crusher
		"crew:wesley_crusher_71201": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Worf
		"crew:worf_71201":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Geordi La Forge
		"crew:geordi_la_forge_71201": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		// Navigational Station - one per ship only
		"tech:navigational_station_71201": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Navigational Station")(upgrade,ship,fleet);
			}
		},
		//Warp Jump
		"tech:warp_jump_71201":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes
		"weapon:photon_torpedoes_71201":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Halik Raider :71192
		//Surat
		"captain:surat_Halik":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Lorrum
		"crew:lorrum_Halik":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		// Kazon Gurad
		"crew:kazon_gurad_Halik": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Kazon Gurad")(upgrade,ship,fleet);
			}},	
		//Photonic Charges
		"weapon:photonic_charges_Halik":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Aft Torpedo Launcher
		"weapon:aft_torpedo_launcher_Halik":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Variale Yield Charges
		"weapon:variable_yield_Charges_Halik":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Unremarkable Species
		"question:unremarkable_species_Halik": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			},
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
		
		
	//Scorpion 4 :71203
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
		
		
	//I.R.W. Belak :blind_belak
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
		
		
	// BIOSHIP OMEGA :blind_bioship
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
		
		
		//ALDARA :blind_aldara
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
		
		
	//U.S.S. Lakota :blind_lakota
		//Erika Benteen
		"captain:erika_benteen_blind_lakota":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Defy Orders
		"talent:defy_orders_blind_lakota":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Tuvok
		"crew:tuvok_blind_lakota":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Micro Power Relays
		"tech:micro_power_relays_blind_lakota":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Upgraded Phasers
		"weapon:upgraded_phasers_blind_lakota": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		
		
	//I.K.S. Toh'Kaht :blind_tohkaht
		// Reactor Core
		"tech:reactor_core_blind_tohkaht": {
			canEquip: onePerShip("Reactor Core")
		},
		
	//I.K.S. Buruk :blind_buruk
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
		
		
	//Interceptor 8 :blind_interceptor8
		//Shakaar Edon
		"captain:shakaar_edon_blind_interceptor8":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Pursuit
		"talent:pursuit_blind_interceptor8": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(card,ship,fleet) {
				return valueOf(ship,"hull",ship,fleet) <= 3;
			},
		},
		//Ro Laren
		"crew:ro_laren_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				return hasFaction(ship,"federation",ship,fleet) || hasFaction(ship,"bajoran",ship,fleet);
			},
		},
		//Phaser Strike
		"weapon:phaser_strike_blind_interceptor8": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Navigational Sensors
		"tech:navigational_sensors_blind_interceptor8": {
			canEquip: function(card,ship,fleet) {
				if( ship.class != "Bajoran Interceptor" )
					return false;
				return onePerShip("Navigational Sensors")(card,ship,fleet);
			},
		},
		
		
	//Nistrim-Culluh :blind_nistrim_culluh
		"ship:nistrim_culluh_blind_nistrim_culluh": {
			upgradeSlots: [ createFirstMajeSlot() ]
		},
		//Culluh
		"captain:culluh_nistrim_culluh":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Photonic Charges
		"weapon:photonic_charges_71646c":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Ambition
		"talent:ambition_blind_nistrim_culluh": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"kazon", ship, fleet) && hasFaction(ship.captain,"kazon", ship, fleet);
			}
		},
		//Rulat
		"crew:rulat_blind_nistrim_culluh":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Stolen Technology
		"tech:stolen_technology_blind_nistrim_culluh": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"kazon", ship, fleet);
			}
		},
		
		
	//Seleya :blind_seleya
		//Tavin
		"captain:tavin_blind_seleya":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//V'Tosh Ka'Tur
		"talent:v_tosh_ka_tur_blind_seleya": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"vulcan", ship, fleet) && hasFaction(ship.captain,"vulcan", ship, fleet);
			}
		},
		//Solin
		"crew:solin_blind_seleya": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			},
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
		//Aft Particle Beam
		"weapon:aft_particle_beam_blind_seleya":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}},
		//Power Distribution Net
		"tech:power_distribution_net_blind_seleya": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"vulcan",ship,fleet) )
					return false;
				return onePerShip("Power Distribution Net")(card,ship,fleet);
			},
		},
		
		
	//Nunk's Marauder :blind_nunks_marauder
		//Nunk
		"captain:nunk_blind_nunks_marauder":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Kidnap
		"talent:kidnap_blind_nunks_marauder": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"ferengi", ship, fleet) && hasFaction(ship.captain,"ferengi", ship, fleet);
			}
		},
		//Omag
		"crew:omag_blind_nunks_marauder":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Weapon Ports
		"weapon:weapon_ports_blind_nunks_marauder":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Geodesic Pulse
		"tech:geodesic_pulse_blind_nunks_marauder":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Robinson :71213
		//Benjamin Sisko
		"captain:benjamin_sisko_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Infiltration
		"talent:infiltration_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Miles O'Brien
		"crew:miles_obrien_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Jadzia Dax
		"crew:jadzia_dax_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Julian Bashir
		"crew:julian_bashir_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Nog
		"crew:nog_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Elim Garak
		"crew:elim_garak_71213":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Dreadnought(old) :71212
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
		
		
	//Denorious :71211
		//AKOREM LAAN
		"captain:akorem_laan_denorious":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//EMISSARY
		"talent:emissary_denorious":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//LEGENDARY HERO
		"talent:legendary_hero_denorious": {
			canEquipFaction: function(upgrade,ship,fleet) {
				//console.log(factions.hasFaction(ship,"bajoran", ship, fleet))
				return (ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet)) && $factions.hasFaction(ship,"bajoran", ship, fleet);
			}
		},	
		//D'Jarras
		"talent:djarras_denorious": {
			canEquipFaction: function(upgrade,ship,fleet) {
				//console.log(factions.hasFaction(ship,"bajoran", ship, fleet))
				return (ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet)) && $factions.hasFaction(ship,"bajoran", ship, fleet);
			}
		},
		//TACHYON EDDIES
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
		//MAINSAILS
		"tech:mainsails_denorious": {
			canEquip: function(upgrade,ship,fleet) {
				//console.log(onePerShip("TACHYON EDDIES")(upgrade,ship,fleet), ship.class)
				return onePerShip("MAINSAILS")(upgrade,ship,fleet);
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				
				return ( ship && ship.class == "BAJORAN SOLAR SAILOR" );
			}
		},
		//SOLAR SAIL POWERED
		"tech:solar_sail_powered_denorious": {
			canEquipFaction: function(upgrade,ship,fleet) {
				
				return ( ship && ship.class == "BAJORAN SOLAR SAILOR" );
			}
		},	
		
		
	//Diaspora :72003p
		//Insectoid Commander
		"captain:insectoid_commander_72003p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Neuro Toxin
		"talent:neuro_toxin_72003p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Insectoid Riflemen
		"crew:insectoid_riflemen_72003p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Pulse-Firing Particle Cannon
		"weapon:pulse_firing_particle_cannon_72003p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
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
		//Phase Deflector Pulse
		"tech:phase_deflector_pulse_72003p": {
			canEquip: function(card,ship,fleet) {
				if( !hasFaction(ship,"xindi",ship,fleet) )
					return false;
				return onePerShip("Phase Deflector Pulse")(card,ship,fleet);
			},
		},
		
	//Azati Prime :72004p
		//Kiaphet Amman'sor
		"captain:kiaphet_amman_sor_72004p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		// Ibix Dynasty
		"talent:ibix_dynasty_72004p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: cloneSlot( 2, { type: ["weapon"] } )
		},
		//Aquatic Councilor
		"crew:aquatic_councilor_72004p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Prototype Weapon
		"weapon:prototype_weapon_72004p": {
			canEquipFaction: function(card,ship,fleet) {
				return hasFaction(ship,"xindi",ship,fleet);
			}
		},
		//Escape Pod
		"tech:escape_pod_72004p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Xindus :72224p
		//Kolo
		"captain:kolo_xindus":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Dominant Species
		"talent:dominant_species_xindus":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Damron
		"crew:damron_xindus":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		// Photon Torpedoes - +1 attack die if fielded on a Xindi Reptilian Warship
		"weapon:photon_torpedoes_xindus": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			attack: function(upgrade,ship,fleet,attack) {
				if( ship && ship.class == "Xindi Reptilian Warship" )
					return resolve(upgrade,ship,fleet,attack) + 1;
				return attack;
			}
		},
		//Sensor Encoders
		"tech:sensor_encoders_xindus":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		
		
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
		
	
	//R.I.S. Pi :71222
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
		
		
	//U.S.S. Valiant :71221
		//Tim Watters
		"captain:tim_watters_valiant" : {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots : [{}, {
				type : ["crew"]
			}],
		},
		//Red Squad
		"talent:red_squad_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Riley Aldrin Shepard
		"crew:riley_aldrin_shepard_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Karen Ferris
		"crew:karen_ferris_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//"Dorian Collins
		"crew:dorian_collins_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Nog
		"crew:nog_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes
		"weapon:photon_torpedoes_valiant":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Kumari :71223
		//THY'LEK SHRAN
		"captain:thylek_shran_kumari:":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//DIVERSION
		"talent:diversion_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//TALAS
		"crew:talas_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//ADVANCED WEAPONRY
		"weapon:advanced_weaponry_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//PARTICLE CANNON ARRAY
		"weapon:particle_cannon_array_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//TRACTOR BEAM
		"tech:tractor_beam_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//LONG RANGE SENSORS
		"tech:long_range_sensors_kumari":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Weapon Zero :71225
		//Dolim
		"captain:dolim_weapon_zero":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		// Arming Sequence - only on Xindi Weapon
		"talent:arming_sequence_weapon_zero": {
			canEquip: function(upgrade,ship,fleet) {
				return ( ship && ship.class == "Xindi Weapon" );
			}
		},
		// Degra
		"crew:degra_weapon_zero": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
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
		
				
	//I.R.W. T'Met :72221p
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
		
		
	//I.K.S. Amar :72232
		// Stand By Torpedoes - one per ship only
		"weapon:stand_by_torpedoes_amar": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Stand By Torpedoes")(upgrade,ship,fleet);
			}
		},
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
		
		
	// I.R.W. Jazkal :72233
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
		
	
	//U.S.S. Montgolfier :72231
		//Orfil Quinteros
		"captain:orfil_quinteros_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Wesley Crusher
		"crew:wesley_crusher_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Heavy Gravition Beam
		"weapon:heavy_gravition_beam_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Photon Torpedoes
		"weapon:photon_torpedoes_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Thruster Array
		"tech:thruster_array_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Subspace Transmitter
		"tech:subspace_ransmitter_montgolfier":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//U.S.S. Constellation :72234p
		//Matt Decker
		"captain:matt_decker_constellation":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Standby Battle Stations - check for battlestations icon in action bar of assigned ship
		"talent:standby_battle_stations_constellation": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return (ship && !!~ship.actions.indexOf("battlestations"));
			}
		},
		//Damage Control Party
		"crew:damage_control_party_constellation":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Auxiliary Control Room
		"question:auxiliary_control_room_constellation":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Auxiliary Control Room")(upgrade,ship,fleet);
			}},
		//Automated Distress Beacon
		"question:automated_distress_beacon_constellation":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Automated Distress Beacon")(upgrade,ship,fleet);
			}},
			
			
	//U.S.S. Reliant :72235p
		//Khan Singh
		"captain:the_classic_movies_khan_singh":{
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
		//Ceti Eel
		"talent:the_classic_movies_ceti_eel":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Fire!
		"talent:the_classic_movies_fire":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Joachim
		"crew:the_classic_movies_joachim":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//All Power To Phasers
		"weapon:the_classic_movies_all_power_to_phasers":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//.K.S. Drovana :72241
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
		
			
	//.R.W. Algeron :72242
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
		
		
	// Borg Cube with Sphere Port 72255
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
		
		
	//Kruge's Bird-of-Prey :72236p
		// Kruge
		"captain:the_classic_movies_kruge" : {
					upgradeSlots : [{}, {
							type : ["crew"]
						}
					],

				},
	
	//H.M.S. Bounty :72260p
		//James T. Kirk
		"captain:james_t_kirk_bounty": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Hikaru Sulu
		"crew:hikaru_sulu_bounty":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Pavel Chekov
		"crew:checkov_bounty":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Montgomery Scott
		"crew:montgomery_scott_bounty": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["tech", "weapon"]
				}
			]
		},
		//Nyota Uhura
		"crew:nyota_uhura_bounty":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
	
		
	//U.S.S. Enterprise-A :72260gp
		//James T. Kirk
		"captain:james_t_kirk_enterprise_a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Leonard McCoy
		"crew:leonard_mccoy_enterprise_a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Valeris
		"crew:valeris_enterprise_a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Torpedo Bay
		"weapon:torpedo_bay_enterprise_a": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Isolation Door
		"tech:isolation_door_enterprise_a":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//U.S.S. Venture :72253
		//Donald Varley
		"captain:donald_varley_venture":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Galaxy Wing Squadron
		"talent:galaxy_wing_squadron_venture":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Additional Phaser Arrays
		"weapon:additional_phaser_arrays_venture": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Additional Phaser Arrays")(upgrade,ship,fleet);
			}
		},
		//Photon Torpedoes
		"weapon:photon_torpedoes_venture":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Maximum Warp
		"tech:maximum_warp_venture":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//High-Capacty Deflector Shield Grid
		"tech:high_cpaacity_deflector_shield_grid_venture": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("High-Capacty Deflector Shield Grid")(upgrade,ship,fleet);
			}
		},
		//Computer Core
		"question:computer_core_venture": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		
		
	//U.S.S. Cairo :72261p
		//Edward Jellico
		"captain:edward_jellico_cairo":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Task Force
		"talent:task_force_cairo":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//High Yield Photon Torpedoes
		"weapon:high_yield_photon_torpedoes_cairo":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Deuterium Tank
		"tech:deuterium_tank_cairo":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Delta Shift
		"question:delta_shift_cairo": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		
	
	//U.S.S Enterprise-B :72263
		//John Harriman
		"captain:john_harriman_enterprise_b":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Demora Sulu
		"crew:demora_sulu_enterprise_b":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Holo-Communicator
		"tech:holo_communicator_enterprise_b": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Holo-Communicator")
		},
		//Full Reverse
		"tech:full_reverse_enterprise_b": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Full Reverse")
		},
		//Deflector Control
		"tech:deflector_control_enterprise_b": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Deflector Control")
		},
		//Resonance Burst
		"tech:resonance_burst_enterprise_b": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Resonance Burst")
		},
		//Improved Phasers
		"weapon:improved_phasers_enterprise_b":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		

	//I.R.W. Rateg :72262p
		// Control Central
		"tech:control_central_rateg": {
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Control Central")(upgrade,ship,fleet);
			}
		},
		// Main Batteries 
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
		
		
	//Kohlar’s Battle Cruiser :72270p
		//Kohlar
		"captain:kohlar_kohlars_battle_cruiser":{
			canEquip: function(upgrade,ship,fleet) {
				return upgrade.name == "Kuvah'Magh";
			},
			intercept: {
				ship: {
					cost: function() { return 3; }
				}
			}
		},
		
	//Orassin :72273
		//Insectoid Councilor
		"captain:insectoid_councilor_orassin":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Thalen
		"talent:thalen_orassin":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			// -2 SP if equipped with Xindi weapon
			upgradeSlots: [{/* Existing Talent Slot */} ].concat( cloneSlot( 1 ,
				{
					type: ["weapon"], 
					rules: "-2 SP if Xindi",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								if( $factions.hasFaction(upgrade,"xindi", ship, fleet) )
									return resolve(upgrade, ship, fleet, cost) - 2;
								return cost;
							}
						}
					}
				}
			))},
		//Xindi Council
		"talent:xindi_council_orassin":{
			canEquipFaction: function(upgrade,ship,fleet) {
				return hasFaction(ship,"xindi", ship, fleet) && hasFaction(ship.captain,"xindi", ship, fleet);
			}},
		//Insecetoid Raiding Party
		"crew:insectoid_raiding_party_orassin":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Xindi") < 0)
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					},
					canEquip: function(upgrade,ship,fleet) {
						return onePerShip("Insecetoid Raiding Party")(upgrade,ship,fleet);
					}
				}
			}},
		//Pulse-Firing Particle Cannon
		"weapon:pulse-firing_particle_cannon_orassin":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Xindi") < 0)
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Xindi Torpedoes
		"weapon:xindi_torpedoes_orassin":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		// Hatchery - Orassin
		"tech:hatchery_orassin": {
			// Equip only on a Xindi ship
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"xindi", ship, fleet) && onePerShip("Hatchery");
			},
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
			]},
		
		
	//I.K.S. Bortas :72280p
	
	//I.K.S. Hegh'ta :72281p
		// Auxiliary Power to Shields - I.K.S. Hegh'ta
		"tech:auxiliary_power_to_shields_72281p": {
			rules: "Only one per ship",
			canEquip: onePerShip("Auxiliary Power to Shields")
		},
		// Course Change - I.K.S. Hegh'ta
		"question:change_course_72281p": {
			isSlotCompatible: function(slotTypes) {
				//console.log($.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0);
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0 || $.inArray( "talent", slotTypes ) >= 0;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
	//I.K.S. Toral :72282p
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
		//Aft Shields
		"tech:aft_shields_72282p":{
			rules: "Only one per ship",
			canEquip: onePerShip("Aft Shields")
		},
		
	//Sela's Warbird :72282gp
		//Movar
		"captain:movar_72282gp":{},
		//
		"Klingon-Romulan Alliance:klingon_romulan_alliance_72282gp":{
		canEquipFaction: function(upgrade,ship,fleet) {
			return hasFaction(ship,"romulan", ship, fleet) && hasFaction(ship.captain,"romulan", ship, fleet);
		}},
		//Tachyon Pulse
		"tech:tachyon_pulse_72282gp":{
			rules: "Only one per ship",
			canEquip: onePerShip("Tachyon Pulse")},
		
		
	//Calindra :72281
		//Aquatic Councilor
		"captain:aquatic_councilor_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Kiaphet Amman'Sor
		"captain:kiaphet_amman'sor_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		"admiral:kiaphet_amman'sor_admiral_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Xindi Torpedoes
		"weapon:xindi_torpedoes_72281":{intercept: {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
				self: {
					attack: function(upgrade,ship,fleet,attack) {
						if( ship && ship.class == "Xindi Aquatic Cruiser" )
							return resolve(upgrade,ship,fleet,attack) + 1;
						return attack;
					}
				}
			}},
		//Biometric Hologram
		"tech:biometric_hologram_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			// Only one per ship
			canEquip: onePerShip("Biometric Hologram")
		},
		//Subspace Vortex
		"tech:subspace_vortex_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Xindi") < 0)
							return resolve(upgrade,ship,fleet,cost) + 5;
						return cost;
					}
				}
			}
		},
		//Trellium-D
		"tech:trellium_d_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && ship.class.indexOf("Xindi") < 0)
							return resolve(upgrade,ship,fleet,cost) + 4;
						return cost;
					}
				}
			}},
		//Raijin
		"crew:raijin_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Retaliation
		"talent:retaliation_72281":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain &&  $factions.hasFaction(ship,"xindi", ship, fleet) &&  $factions.hasFaction(ship.captain,"xindi", ship, fleet);
		}},
		
		
	//Yesterdays U.S.S. Enterprise-D
		// Jean-Luc Picard - Enterprise-D
		"captain:jean_luc_picard_enterprise_72284p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		//Dispersal Pattern Sierra
		"talent:dispersal_pattern_sierra_72284p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		// Transporter - U.S.S. Enterprise-D
		"tech:transporter_72284p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			rules: "Only one per ship",
			canEquip: onePerShip("Transporter")
		},
		// Aft Phaser Emitters - U.S.S. Enterprise-D
		"weapon:aft_phaser_emitters_72284p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
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
		// Natasha Yar - U.S.S. Enterprise-D
		"crew:natasha_yar_72284p": {
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				},
				{ 
					type: ["weapon"]
				}
			]
		},
		
	
	//Muratas :72293
		//Degra
		"captain:degra_muratas":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Dolim
		"captain:dolim_muratas":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			// All crew cost -1 SP
			cost: function(upgrade, ship, fleet, cost) {
				if( upgrade.type == "weapon" )
					return resolve(upgrade, ship, fleet, cost) - 1;
				return cost;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				},
				{ 
					type: ["weapon"]
				}
			]
		},
		//Patience is for the Dead
		"talent:patience_is_for_the_dead_muratas":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			}},
		//Xindi Torpedoes - Reptilian
		"weapon:xindi_torpedoes_muratas":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			self: {
				attack: function(upgrade,ship,fleet,attack) {
				if( ship && ship.class == "Xindi Reptilian Warship" )
					return resolve(upgrade,ship,fleet,attack) + 1;
				return attack;
				}
			}
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
		//Reptilian Analysis Team
		"crew:reptilian_analysis_team_muratas":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			],
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "xindi", ship, fleet );
			},
			// Only one per ship
			canEquip: onePerShip("Reptilian Analysis Team")
		},
		//Thermal Chamber
		"tech:thermal_chamber_muratas":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Xindi Reptilian Warship";
			}
		},
		//Sensor Encoders
		"tech:sensor_encoders_muratas":{
			// Only one per ship
			canEquip: onePerShip("Sensor Encoders"),
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Xindi Reptilian Warship";
			}
		},
		
		
	//U.S.S. Defiant NCC-1764 :72290p
		//Aft Photon Torpedoes
		"weapon:aft_Photon_torpedoes_72290p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
			
			
	//Delta Flyer II :72300p
		//Tom Paris
		"captain:tom_paris_72300p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Quick Thinking
		"talent:quick_thinking72300p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Impulse Thrusters
		"tech:impulse_thrusters_72300p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Impulse Thrusters")
		},
		//Pulse Phased Weapons
		"weapon:pulse_phased_weapons_72300p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//B'Elanna Torres
		"crew:belanna_torres_72300p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
		
	//U.S.S. Grissom :72011wp
		//J.T. Esteban
		"captain:jt_esteban_72001p":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Captain's Discretion
		"talent:captains_discretion_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//David Marcus
		"crew:david_marcus_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Saavik
		"crew:saavik_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Federation Helmsman
		"crew:federation_helmsman_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Comm Station
		"tech:comm_station_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			upgradeSlots: [ 
				{ 
					type: ["crew"]
				}
			],
			canEquip: onePerShip("Comm Station")
		},
		//Close-Range Scan
		"tech:close-range_scan_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Close-Range Scan")
		},
		//Genesis Effect
		"tech:genesis_effect_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			name: "Genesis Effect",
			range: false,
			upgradeSlots: [ 
				{ 
					type: ["crew"], 
					rules: "Crew, 5SP or less",
					intercept: {
						ship: {
							free: function() { return true; },
							canEquip: function(upgrade, ship, fleet, canEquip) {
								if( valueOf(upgrade,"cost",ship,fleet) > 5 )
									return false;
								return canEquip;
							}
						}
						
					}
				}
			]
		},
		//William T. Riker
		"crew:william_t_riker_72001wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + 3;
						return skill;
					}
				}
			}
		},
		
		
	//I.K.S. Ves Batlh :72012wp
		//DNA Encoded Message
		"talent:dna_encoding_72012wp":{
			upgradeSlots: cloneSlot( 3 , 
				{ 
					type: ["talent"], 
					rules: "Klingon Talent Only",
					faceDown: true,
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(card,ship,fleet,canEquip) {
								if( !$factions.hasFaction( card, "klingon", ship, fleet ) )
									return false;
								return canEquip;
							}
						}
					}
				}
			)
		},
		//Goroth
		"crew:goroth_72012wp":{
			upgradeSlots: [ 
				{ 
					type: ["crew"]
				}
			]
		},
		//Dispersive Armor
		"tech:dispersive_armor_72012wp":{
			canEquip: onePerShip("Dispersive Armor")
		},
		//Photon Detonation
		"question:photon_detination_72012wp":{
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0;
			}
		},
		
		
	//Dreadnought :72013wp
		//Captured
		"question:captured_72013wp": {
			isSlotCompatible: function(slotTypes) {
				return $.inArray( "tech", slotTypes ) >= 0 || $.inArray( "weapon", slotTypes ) >= 0 || $.inArray( "crew", slotTypes ) >= 0;
			},
			canEquip: onePerShip("Captured"),
			upgradeSlots: [  
				{ 
					type: function(upgrade,ship) {
						return getSlotType(upgrade,ship);
					}
				}
			],
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
		//Plasma Pulse
		"weapon:plasma_pulse_72013wp":{
			canEquip: onePerShip("Plasma Pulse")
		},
		//B'Elanna Torres
		"crew:belanna_torres_72013wp":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "ferengi", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		
		
	//Prototype 02 :72014wp
		"ship:prototype_02_72014wp": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" ||  captain.name == "Jhamel" || captain.name == "Romulan Drone Pilot";
					}
				}
			}
		},
		"ship:romulan_starship_72014wp": {
			intercept: {
				ship: {
					canEquipCaptain: function(captain,ship,fleet) {
						return captain.name == "Gareb" || captain.name == "Jhamel" || captain.name == "Romulan Drone Pilot";
					}
				}
			}
		},
		//Jhamel
		"captain:jhamel_72001p":{
			// Equip only on a Romulan Drone Ship
			canEquipCaptain: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			}
		},
		//Triphasic Emitters
		"weapon:triphasic_emitters_72014wp": {
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
		//Repair Protocol
		"tech:repair_protocol_72014wp":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			},
			canEquip: onePerShip("Repair Protocol")
		},
		//Tellarite Disruptor Banks
		"weapon:tellarite_disruptor_banks_72014wp":{
			canEquip: onePerShip("Tellarite Disruptor Banks")
		},
		//Evasive Protocol
		"tech:evasive_protocol_72014wp":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			},
			canEquip: onePerShip("Evasive Protocol")
		},
		//Disguise Protocol
		"tech:disguise_protocol_72014wp":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Drone Ship";
			},
			canEquip: onePerShip("Disguise Protocol")
		},
		
		
	//2017 Core Set
		//Picard
		"captain:picard_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Will Riker
		"captain:william_riker_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Duras
		"captain:duras_2017core":{
			upgradeSlots: cloneSlot( 1 ,
				{
					type: ["talent"],
					rules: "Klingon And Romulan Talents Cost Exactly 3 SP",
					faceDown: true,
					intercept: {
						ship: {
							cost: {
								priority: 100,
								fn: function(upgrade, ship, fleet, cost) {
									if( hasFaction(upgrade,"klingon",ship,fleet) || hasFaction(upgrade,"romulan",ship,fleet) )
										return 3;
									return cost;
								}
							},
							// TODO Check if faction penalty should be applied
							factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
								if( hasFaction(upgrade,"klingon",ship,fleet) || hasFaction(upgrade,"romulan",ship,fleet) )
									return 0;
								return factionPenalty;
							}
						}
					}
				}
			)
		},
		//Data
		"captain:data_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Make It So
		"talent:make_it_so_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Riker Maneuver
		"talent:riker_maneuver_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Blood Oath
		"talent:blood_oath_2017core":{
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"klingon", ship, fleet);
			}},
		//Exocomp
		"tech:exocomp_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		//Tactical Station | One Per Ship
		"weapon:tactical_station_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			canEquip: onePerShip("Tactical Station"),
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				}
			]
		},
		//Photon Torpedo 2017Core
		"weapon:photon_torpedoes_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			},
			attack: 0,
			intercept: {
				self: {
					// Attack is same as ship primary + 1
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet) + 1;
						return attack;
					}
				}
			}
		},
		//Torpedo Fusillade
		"weapon:torpedoe_fusillade_2017core":{
			attack: 0,
			intercept: {
				self: {
					// Attack is same as ship primary weapon
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet);
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
		"crew:deanna_troi_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"crew:beverly_crusher_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"crew:christopher_hobson_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"crew:worf_2017core":{
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"klingon", ship, fleet);
			}},
		"crew:geordi_la_forge_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		"crew:miles_obrien_2017core":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "bajoran", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}},
		
	//2017 Romulan Faction Ser
		//Tomalak
		"captain:tomalak_75001":{
			upgradeSlots: [
				{/* Talent */},
				{
					type: ["tech"]
				}
			]
		},
		//Tal Shiar
		"talent:tal_shiar_75001":{
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"romulan", ship, fleet);
			}			
		},
		//Interphase Generator
		"tech:IPG_75001":{
			canEquip: onePerShip("Interphase Generator")
		},
		//Reinforced Shields
		"tech:reinforced_shields_75001":{
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Reinforced Shields") && ship.hull >= 5;
			}
		},
		//Auxiliary Power Core
		"tech:auxiliary_power_core_75001":{
			canEquip: function(upgrade,ship,fleet) {
				return onePerShip("Auxiliary Power Core") && ship.hull >= 4;
			},
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						if( ship && !$factions.hasFaction(ship,"romulan", ship, fleet) )
							return resolve(upgrade,ship,fleet,cost) + 2;
						return cost;
					}
				}
			}
		},
		//Additional Weapons Array
		"weapon:additional_weapons_array_75001":{
			canEquip: function(upgrade,ship,fleet) {
				return (onePerShip("Additional Weapons Array") && ship.class == "D'deridex Class");
			}},
			
			
	//2017 Dominion Faction Set
		//All Power to Weapons
		"talent:all_power_to_weapons_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"dominion", ship, fleet) && ship.hull >= 5;
			}
		},
		//Talak'Talan
		"crew:talaktalan_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"dominion", ship, fleet);
			}
		},
		//Duran'Adar
		"crew:duranadar_75002":{
			upgradeSlots: [ 
				{ 
					type: ["tech"]
				}
			]
		},
		"weapon:disruptor_cannon_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Jem'Hadar Battleship ";
			}
		},
		"weapon:phased_polaron_beam_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return (onePerShip("Phased Polaron Beams") && ship.class == "Jem'Hadar Attack Ship");
		}},
		"weapon:energy_dissipator_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Jem'Hadar Attack Ship";
		}},
		"weapon:minesweeper_75002":{
			canEquip: onePerShip("Minesweeper")
		},
		"tech:sucide_attack_75002":{canEquip: function(upgrade,ship,fleet) {
				return (onePerShip("Suicide Attack") && ship.class == "Jem'Hadar Attack Ship");
		}},
		"tech:secondary_matter_system_75002":{
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"dominion", ship, fleet);
			}
		},
		
	//D'Kora Card Pack
		//Lurin
		"captain:lurin_75003":{
			intercept: {
				ship: {
					// No faction Lurin or Ferengi upgrades
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( $factions.hasFaction(card,"ferengi", ship, fleet) )
							return 0;
						return factionPenalty;
					},
					// Ferengi upgrades are -1
					cost: function(card,ship,fleet,cost) {
						if( isUpgrade(card) && hasFaction(card,"ferengi",ship,fleet) )
							cost = resolve(card,ship,fleet,cost) - 1;
						return cost;
					}
				}
			}
		},
		"captain:daimon_goss_73001":{			
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
		//Doctor Reyga
		"crew:doctor_reyga_73001":{
			factionPenalty: function(upgrade, ship, fleet) {
				return ship && $factions.hasFaction( ship, "independent", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "kazon", ship, fleet ) ? 0 : 1 && $factions.hasFaction( ship, "xindi", ship, fleet ) ? 0 : 1;
			}},
			
	//Borg Octahedron
		//Neural Transponder
		"talent:neural_transponder_73002":{
			canEquip: onePerShip("Neural Transponder"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"borg", ship, fleet);
			}},
		//Neonatal Borg
		"crew:neonatal_borg_73002":{
			upgradeSlots: [ 
				{ 
					type: ["crew"]
				}
			],
			canEquip: onePerShip("Neonatal Borg"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "borg", ship, fleet )
			},
			intercept: {
				ship: {
					// Add the "crew" type to all Tech and Borg slots
					type: function(card,ship,fleet,type) {
						if( $.inArray("tech",type) >= 0 || $.inArray("borg",type) >= 0 )
							return type.concat(["crew"]);
						return type;
					}
				}
			}
		},

//Faction Penalty For Subfactions 		
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

		
	
		

	// RESOURCES
		"resource:front_line_retrofit_resource": {
			slotType: "ship-resource",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "ship-resource" )
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
		"ship-resource:front_line_retrofit_ship":{
			intercept: {
				ship: {
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							return resolve(card,ship,fleet,shields) + 1;
						return shields;
					},
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain )
							return resolve(upgrade,ship,fleet,skill) + 1;
						return skill;
					}
				}
			},
		},
		
		//Captains Chair
		"ship-resource:captains_chair_ship":{
			canEquip: function(upgrade,ship,fleet) {
				return ship.captain.skill >= 5;
			}
		},
		"resource:captains_chair_resource":{
			slotType: "ship-resource",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "ship-resource" )
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
		
		
		"resource:fleet_commander": {
			slotType: "ship-resource",
			cost: 0,
			hideCost: true,
			showShipResourceSlot: function(card,ship,fleet) {
				if( ship.resource && ship.resource.type == "ship-resource" )
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
		
		//Fleet Commander (ship)
		"ship-resource:fleet_commander_ship": {
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain )
							return resolve(upgrade,ship,fleet,skill) + 1;
						return skill;
					}
				}
			}
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
		
		
		//Improved Hull
		"resource:the_classic_movies_improved_hull_resource":{
			cost: function(card,ship,fleet) {
				if( !fleet )
					return 0;
				var hull = 0;
				$.each( fleet.ships || [], function(i,ship) {
					shields += valueOf(ship,"hull",ship,fleet);
				} );
				return Math.ceil( hull/2 );
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
		
	//Senior Staff
		"resource:senior_staff":{
			
		},

	};
}]);


