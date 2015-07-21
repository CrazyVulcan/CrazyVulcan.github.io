var module = angular.module("utopia-card-rules", []);

module.factory( "$factions", [ "$filter", function($filter) {
	var valueOf = $filter("valueOf");
	return {
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
		list: [ "Federation", "Klingon", "Romulan", "Dominion", "Borg", "Species 8472", "Kazon", "Bajoran", "Ferengi", "Vulcan", "Independent", "Mirror Universe", "Q Continuum" ]
	}
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
	
	var upgradeTypes = ["crew","weapon","tech","talent","question"];
	
	var isUpgrade = function(card) {
		return $.inArray( card.type, upgradeTypes ) >= 0;
	};
	
	var resolve = function(card,ship,fleet,value) {
		return value instanceof Function ? value(card,ship,fleet) : value;
	};
	
	var hasFaction = $factions.hasFaction;
	
	return {
		
		// SHIPS
		
		"ship:tactical_cube_138_71444": {
			intercept: {
				ship: {
					// Reduce cost of Borg Ablative Hull Armor
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.name == "Borg Ablative Hull Armor" )
							return (cost instanceof Function ? cost(upgrade, ship, fleet, cost) : cost) - 3;
						return cost;
					}
				}
			}
		},
		
		"ship:enterprise_nx_01_71526": {
			upgradeSlots: [ {
				type: ["tech"],
				source: "Enterprise NX-01 (Free EHP Only)",
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
		
		"ship:scout_608_71525": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet) {
						if( upgrade.type == "borg" )
							return upgrade.cost <= 5;
						return true;
					}
				}
			}
		},
		
		"ship:borg_starship_71525": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet) {
						if( upgrade.type == "borg" )
							return upgrade.cost <= 5;
						return true;
					}
				}
			}
		},
		
		"ship:scout_255_71646d": {
			intercept: {
				ship: {
					canEquip: function(upgrade,ship,fleet) {
						if( upgrade.type == "borg" )
							return upgrade.cost <= 5;
						return true;
					}
				}
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
			// data has wrong class name
			class: "Negh'var Class"
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
					source: "Sakharov (-2 SP)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								cost = (cost instanceof Function ? cost(upgrade, ship, fleet, cost) : cost) - 2;
								return cost;
							}
						}
					}
				}
			]
		},
		
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
		
		
		
		// CAPTAINS
		
		// Khan Singh
		"captain:2008": {
			intercept: {
				ship: {
					// No faction penalty for upgrades
					factionPenalty: function(upgrade, ship, fleet, cost) {
						return upgrade.type != "captain" && upgrade.type != "admiral" ? 0 : cost;
					}
				}
			}
		},
		
		// Khan Singh (GenCon)
		"captain:2009": {
			intercept: {
				ship: {
					// No faction penalty for Khan or Talents
					factionPenalty: function(upgrade, ship, fleet, cost) {
						return upgrade.type == "captain" || upgrade.type == "talent" ? 0 : cost;
					}
				}
			}
		},
		
		// James T. Kirk
		"captain:2011": {
			// Two talent slots. Cost is overridden to be 3.
			upgradeSlots: [
				{
					type: ["talent"],
					source: "James T. Kirk (=3 SP)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								return 3;
							},
							factionPenalty: function() { return 0; }
						}
					}
				},
				{
					type: ["talent"],
					source: "James T. Kirk (=3 SP)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								return 3;
							},
							factionPenalty: function() { return 0; }
						}
					}
				}
			]
		},
		
		// Christopher Pike
		"captain:2012": {
			// Reduce cost of all crew by 1 SP
			intercept: {
				ship: {
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew") {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, cost) : cost) - 1;
						}
						return cost;
					}
				}
			}
		},
		
		// Thot Gor
		"captain:2023": {
			// Reduce cost of all weapons by 1 SP
			intercept: {
				ship: {
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon") {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, cost) : cost) - 1;
						}
						return cost;
					}
				}
			}
		},
		
		// Kira Nerys
		"captain:2030": {
			// No faction penalty for Federation ships
			factionPenalty: function(upgrade, ship, fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet ) ? 0 : 1;
			}
		},
		
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
								var occCost = slot.occupant.cost instanceof Function ? slot.occupant.cost(slot.occupant,ship,fleet,0) : slot.occupant.cost;
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
		
		// Styles
		"captain:3106": {
			upgradeSlots: [
				{
					type: ["tech"],
					source: "Styles"
				}
			]
		},
		
		"captain:weyoun_71279": {
			// Two crew slots, each with -1 SP if equipped with Dominion crew
			upgradeSlots: [ 
				{/* Existing Talent Slot */},
				{
					type: ["crew"], 
					source: "Weyoun (-1 SP Dominion)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								if( $factions.hasFaction(upgrade,"dominion", ship, fleet) )
									cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
								return cost;
							}
						}
					}
				},
				{
					type: ["crew"], 
					source: "Weyoun (-1 SP Dominion)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								if( $factions.hasFaction(upgrade,"dominion", ship, fleet) )
									cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
								return cost;
							}
						}
					}
				}
			]
		},
		
		// Tahna Los
		"captain:tahna_los_op6prize": {
			// Add a Tech slot. Cost = 3. Can't have a ship/class specific restriction
			// TODO Add check for ship/class restriction. Woe is me.
			upgradeSlots: [
				{/* Existing Talent Slot */},
				{
					type: ["tech"],
					source: "Tahna Los (=3 SP)",
					intercept: {
						ship: {
							cost: function(upgrade, ship, fleet, cost) {
								return 3;
							},
							factionPenalty: function() { return 0; }
						}
					}
				}
			]
		},
		
		// Tavek
		"captain:tavek_71446": {
			// Add one crew slot
			upgradeSlots: [
				{
					type: ["crew"],
					source: "Tavek"
				}
			]
		},
		
		// Hugh
		"captain:hugh_71522": {
			intercept: {
				ship: {
					// All crew cost -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "crew" )
							return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
						return cost;
					},
					// No faction penalty for borg upgrades
					factionPenalty: function(upgrade, ship, fleet, factionPenalty) {
						if( upgrade.type != "captain" && upgrade.type != "admiral" && $factions.hasFaction(upgrade,"borg", ship, fleet) )
							return 0;
						return factionPenalty;
					}
				}
			}
			
		},
		
		// Lore
		"captain:lore_71522": {
			upgradeSlots: [
				// Extend existing talent slot
				{
					source: "Lore (No Faction Restriction or Penalty)",
					intercept: {
						ship: {
							// Remove faction restrictions
							canEquipFaction: function() { return true; },
							factionPenalty: function() { return 0; }
						}
					}
				},
				// Add one crew slot
				{
					type: ["crew"],
					source: "Lore"
				}
			]
		},
		
		// Vanik
		"captain:vanik_71508": {
			intercept: {
				ship: {
					// All Vulcan/Federation tech is -2 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "tech" && ( $factions.hasFaction(upgrade,"vulcan", ship, fleet) || $factions.hasFaction(upgrade,"federation", ship, fleet) ) ) {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 2;
						}
						return cost;
					},
				}
			}
		},
		
		// Magnus Hansen
		"captain:magnus_hansen_71509": {
			// No faction penalty on Federation ships
			factionPenalty: function(upgrade, ship, fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) ? 0 : 1;
			}
		},
		
		// Jonathan Archer
		"captain:jonathan_archer_71526": {
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"],
					source: "Jonathan Archer"
				}
			]
		},
		
		// Sopek
		"captain:sopek_71527": {
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"],
					source: "Sopek"
				}
			]
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
		
		// Jean-Luc Picard 6
		"captain:jean_luc_picard_71510": {
			upgradeSlots: [
				// existing talent slot
				{},
				// Add one crew slot
				{
					type: ["crew"],
					source: "Jean-Luc Picard"
				}
			]
		},
		
		// Haron
		"captain:haron_71646c": {
			upgradeSlots: [
				// Add one weapon slot
				{
					type: ["weapon"],
					source: "Haron"
				}
			],
			intercept: {
				ship: {
					// All Kazon weapons are -1 SP
					cost: function(upgrade, ship, fleet, cost) {
						if( upgrade.type == "weapon" && $factions.hasFaction(upgrade,"kazon", ship, fleet) ) {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
						}
						return cost;
					},
				}
			}
		},
		
		// Picard 8
		"captain:jean_luc_picard_b_71531": {
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["crew","tech","weapon","talent"], 
					source: "Jean-Luc Picard" 
				}
			]
		},
		
		// Chakotay 6
		"captain:chakotay_71528": {
			upgradeSlots: [ 
				{/* Existing Talent Slot */}, 
				{ 
					type: ["weapon","crew"], 
					source: "Chakotay" 
				}
			]
		},
		
		// Calvin Hudson
		"captain:calvin_hudson_71528": {
			upgradeSlots: [ 
				{ 
					type: ["tech","weapon","crew"], 
					source: "Calvin Hudson" 
				}
			],
			// Reduce cost of all Upgrades by 1 SP if on Independent ship
			intercept: {
				ship: {
					cost: function(upgrade,ship,fleet,cost) {
						if( $factions.hasFaction(ship,"independent", ship, fleet) && isUpgrade(upgrade) ) {
							cost = (cost instanceof Function ? cost(upgrade,ship,fleet,0) : cost) - 1;
						}
						return cost;
					}
				}
			}
		},
		
		// Miles O'Brien MU
		"captain:miles_o_brien_71529": {
			upgradeSlots: [ 
				{}, // Existing talent slot
				{ 
					type: ["tech"], 
					source: "Miles O'Brien" 
				}
			]
		},
		
		// Borg Queen
		"captain:borg_queen_71513a": {
			upgradeSlots: [ 
				{}, // Existing talent slot
				{ 
					type: ["borg"], 
					source: "Borg Queen" 
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
					source: "Gareb",
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
					type: ["tech"], 
					source: "Valdore" 
				}
			]
		},
		
		// Slar
		"captain:slar_71797": {
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					source: "Slar (Salvage Only)",
					canEquip: function(upgrade) {
						return upgrade.name == "Salvage";
					}
				}
			]
		},
		
		
		
		
		
		
		// UPGRADES
		
		
		
		
		
		// Photon Torpedoes (Vor'cha Bonus)
		"weapon:3010": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Vor'cha Class" ? 6 : 5;
			}
		},
		
		// Varel
		"crew:3039": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Romulan Science Vessel" ? 10 : 5;
			}
		},
		
		// Muon Feedback Wave
		"tech:3041": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Romulan Science Vessel";
			}
		},
		
		// Photon Torpedoes (Negh'var Bonus)
		"weapon:3051": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Negh'var Class" ? 6 : 5;
			}
		},
		
		// Energy Dissipator
		"weapon:3059": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Breen") < 0 ? 10 : 5;
			}
		},
		
		// Cloaking Device (Defiant)
		"tech:3068": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.name != "U.S.S. Defiant" ? 9 : 4;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") < 0 ? 10 : 5;
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
		
		// Enhanced Weaponry
		"weapon:3096": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Keldon Class" ? 6 : 5;
			}
		},
		
		// Cloaking Device (Keldon)
		"tech:3099": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Keldon Class" ? 9 : 4;
			}
		},
		
		// Cold Storage Unit
		"tech:cold_storage_unit_op5prize": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					source: "Cold Storage Unit" 
				},
				{ 
					type: ["weapon"], 
					source: "Cold Storage Unit" 
				}
			]
		},
		
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
		
		// Kudak'Etan
		"crew:kudak_etan_71279": {
			canEquip: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") >= 0;
			}
		},
		
		// Ikat'Ika
		"crew:ikat_ika_71279": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") < 0 ? 10 : 5;
			}
		},
		
		// Photon Torpedoes (Jem'Hadar Battleship Bonus)
		"weapon:photon_torpedoes_71279": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Jem'Hadar Battleship" ? 7 : 5;
			}
		},
		
		// Phased Polaron Beam
		"weapon:phased_polaron_beam_71279": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Jem'Hadar") < 0 ? 10 : 5;
			}
		},
		
		// I Am Kohn-Ma
		"talent:i_am_kohn_ma_op6prize": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"bajoran", ship, fleet);
			}
		},
		
		// Ablative Generator
		"tech:ablative_generator_71280": {
			// Equip only on Voyager
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "U.S.S. Voyager";
			}
		},
		
		// B'elanna Torres
		"crew:b_elanna_torres_71280": {
			name: "B'Elanna Torres",
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					source: "B'Elanna Torres" 
				},
				{ 
					type: ["tech"], 
					source: "B'Elanna Torres" 
				}
			]
		},
		
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
		
		// Kazon Raiding Party
		"crew:kazon_raiding_party_71282": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon", ship, fleet);
			}
		},
		
		// Masking Circuitry
		"tech:masking_circuitry_71282": {
			cost: function(upgrade,ship,fleet) {
				return ship &&  $factions.hasFaction(ship,"kazon", ship, fleet) ? 8 : 3;
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
			cost: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"species-8472", ship, fleet) ? 10 : 5;
			}
		},
		
		// Biological Attack
		"weapon:biological_attack_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		
		// Cutting Beam
		"tech:cutting_beam_71283": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		
		// Energy Blast
		"weapon:energy_blast_71281": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Species 8472 Bioship" ? 7 : 5;
			}
		},
		
		// Energy Focusing Ship
		"weapon:energy_focusing_ship_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472", ship, fleet);
			}
		},
		
		// Transphasic Torpedoes
		"weapon:transphasic_torpedoes_71280": {
			// Equip only on Voyager
			canEquip: function(upgrade,ship,fleet) {
				return ship.name == "U.S.S. Voyager";
			}
		},
		
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
		
		// Vulcan High Command
		"talent:vulcan_high_command_2_0_71446": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain &&  $factions.hasFaction(ship,"vulcan", ship, fleet) &&  $factions.hasFaction(ship.captain,"vulcan", ship, fleet);
			},
			upgradeSlots: [ 
				{ 
					type: ["tech","crew"], 
					source: "Vulcan High Command" 
				},
				{ 
					type: ["tech","crew"], 
					source: "Vulcan High Command" 
				}
			]
		},
		
		// Warp Drive Refit
		"tech:warp_drive_refit_71445": {
			// TODO Need to check ship maneuver card - not imported yet
			canEquip: function(upgrade,ship,fleet) {
				return true;
			}
		},
		
		// Maneuverability
		"tech:maneuverability_71445": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Bajoran Interceptor" ? 10 : 5;
			}
		},
		
		// Assimilated Access Codes
		"talent:assimilated_access_codes_71444": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"borg", ship, fleet);
			}
		},
		
		// Phaser Strike
		"weapon:phaser_strike_71445": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Bajoran Interceptor" ? 9 : 4;
			},
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			}
		},
		
		// Full Assault
		"weapon:full_assault_71444": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Borg Tactical Cube" ? 9 : 6;
			}
		},
		
		// Borg Missile
		"weapon:borg_missile_71444": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg", ship, fleet);
			}
		},
		
		// Sakonna
		"crew:sakonna_gavroche": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					source: "Sakonna" 
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
		
		// Self-Destruct Sequence
		"talent:self_destruct_sequence_71523": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		
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
		
		// Unnecessary Bloodshed
		"talent:unnecessary_bloodshed_71524": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"dominion", ship, fleet);
			}
		},
		
		// Photon Torpedoes (Borg)
		"weapon:photon_torpedoes_71522": {
			attack: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"borg", ship, fleet) ? 6 : 5;
			}
		},
		
		// Forward Weapons Array
		"weapon:forward_weapons_array_71522": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg", ship, fleet) ? 11 : 6;
			}
		},
		
		// Volley of Torpedoes
		"weapon:volley_of_torpedoes_71524": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Jem'Hadar Battleship" || ship.class == "Jem'Hadar Battle Cruiser";
			}
		},
		
		// Combat Vessel Variant
		"tech:combat_vessel_variant_71508": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Suurok Class";
			},
			intercept: {
				ship: {
					attack: function(upgrade,ship,fleet,attack) {
						if( upgrade.type == "ship" ) {
							if( attack instanceof Function )
								attack = attack(upgrade,ship,fleet,0);
							attack++;
						}
						return attack;
					},
					hull: function(upgrade,ship,fleet,hull) {
						if( upgrade.type == "ship" ) {
							if( hull instanceof Function )
								hull = hull(upgrade,ship,fleet,0);
							hull++;
						}
						return hull;
					}
				}
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.name != "U.S.S. Raven" ? 10 : 5;
			}
		},
		
		// Quark
		"crew:quark_71786": {
			// TODO Fix card text and remove duplicate
			upgradeSlots: [ 
				{ 
					type: ["weapon","tech"], 
					source: "Quark (Non-Borg, 5SP or less)",
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
							cost: function() {
								return 0;
							},
							factionPenalty: function() {
								return 0;
							}
						}
					}
				}
			]
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
					source: "T'Rul",
				}
			]
		},
		
		// Elim Garak
		"crew:elim_garak_71786": {
			talents: 1,
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					source: "Elim Garak (No Faction Penalty)",
					intercept: {
						ship: {
							factionPenalty: function() { return 0; }
						}
					}
				}
			],
			factionPenalty: 0
		},
		
		// Enhanced Hull Plating
		"tech:enhanced_hull_plating_71526": {
			// Only one per ship
			canEquip: onePerShip("Enhanced Hull Plating"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation", ship, fleet );
			}
		},
		
		// T'Pol
		"crew:t_pol_71526": {
			upgradeSlots: [ 
				{ 
					type: ["tech"], 
					source: "T'Pol",
				}
			],
			factionPenalty: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "vulcan", ship, fleet ) ? 0 : 1;
			}
		},
		
		// Vulcan Commandos
		"crew:vulcan_commandos_71527": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "vulcan", ship, fleet );
			}
		},
		
		// Combat Vessel Variant
		"tech:combat_vessel_variant_71527": {
			upgradeSlots: [
				{
					type: ["weapon"],
					source: "Combat Vessel Variant"
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
					attack: function(upgrade,ship,fleet,attack) {
						if( upgrade.type == "ship" ) {
							if( attack instanceof Function )
								attack = attack(upgrade,ship,fleet,0);
							attack++;
						}
						return attack;
					},
					hull: function(upgrade,ship,fleet,hull) {
						if( upgrade.type == "ship" ) {
							if( hull instanceof Function )
								hull = hull(upgrade,ship,fleet,0);
							hull++;
						}
						return hull;
					},
					// Prevent other CVV while this one equipped
					canEquip: function(upgrade,ship,fleet) {
						return upgrade.name != "Combat Vessel Variant";
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
		
		// Tactical Station
		"weapon:tactical_station_71510": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					source: "Tactical Station",
				}
			]
		},
		
		// Fire All Weapons
		"weapon:fire_all_weapons_71510b": {
			cost: function(upgrade,ship,fleet) {
				if( !ship )
					return 7;
				return ship.class == "Galaxy Class" || ship.class == "Intrepid Class" || ship.class == "Sovereign Class" ? 7 : 12;
			}
		},
		
		// Biogenic Charge
		// TODO Implement occupying two slots somehow?
		
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
		
		// Cloaking Device (Mirror)
		"tech:cloaking_device_71646b": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"mirror-universe", ship, fleet) ? 9 : 4;
			}
		},
		
		// Tractor Beam
		"tech:tractor_beam_71646c": {
			// Only one per ship
			canEquip: onePerShip("Tractor Beam")
		},

		// Vulcan Logic
		"talent:vulcan_logic_71646e": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"vulcan", ship, fleet) && $factions.hasFaction(ship,"vulcan", ship, fleet);
			}
		},
		
		// Photonic Charges
		"weapon:photonic_charges_71646c": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Predator Class" ? 8 : 4;
			}
		},
		
		// Proton beam
		"weapon:proton_beam_71646d": {
			name: "Proton Beam",
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg", ship, fleet) ? 9 : 4;
			}
		},
		
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
					type: ["borg"], 
					source: "Borg Alliance" 
				}
			]
		},
		
		// Advanced Shields
		"tech:advanced_shields_71531": {
			// Only one per ship
			canEquip: onePerShip("Advanced Shields")
		},
		
		// William T. Riker (Ent-E)
		"crew:william_t_riker_71531": {
			upgradeSlots: [ 
				{ 
					type: ["crew"], 
					source: "William T. Riker" 
				}
			]
		},
		
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
		
		// Ramming Attack
		"weapon:ramming_attack_71528": {
			// Equip only on a ship with hull 3 or less
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull <= 3;
			}
		},
		
		// Photon Torpedoes (Sovereign)
		"weapon:photon_torpedoes_71531": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Sovereign Class" ? 6 : 5;
			}
		},
		
		// Dorsal Phaser Array
		"weapon:dorsal_phaser_array_71531": {
			// Cost is primary weapon + 1
			cost: function(upgrade,ship,fleet) {
				return ship ? ship.attack + 1 : 0;
			},
			// Attack is same as ship primary
			attack: function(upgrade,ship,fleet) {
				return ship ? ship.attack : 0;
			},
			// Equip only on a Federation ship with hull 4 or more
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) && ship.hull >= 4;
			}
		},
		
		// Multi Kinetic Neutronic Mines
		"weapon:multi_kinetic_neutronic_mines_71530": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg", ship, fleet) ? 15 : 10;
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
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg", ship, fleet) ? 10 : 5;
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
					type: ["tech"], 
					source: "Jennifer Sisko" 
				}
			]
		},
		
		// Shinzon Romulan Talents
		"talent:shinzon_romulan_talents_71533": {
			upgradeSlots: [ 
				{ 
					type: ["talent"], 
					source: "Shinzon (Romulan Talent Only)",
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(upgrade) {
								return $factions.hasFaction( upgrade, "romulan", ship, fleet );
							}
						}
						
					}
				},
				{ 
					type: ["talent"], 
					source: "Shinzon (Romulan Talent Only)",
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(upgrade) {
								return $factions.hasFaction( upgrade, "romulan", ship, fleet );
							}
						}
					}
				},
				{ 
					type: ["talent"], 
					source: "Shinzon (Romulan Talent Only)",
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(upgrade) {
								return $factions.hasFaction( upgrade, "romulan", ship, fleet );
							}
						}
					}
				},
				{ 
					type: ["talent"], 
					source: "Shinzon (Romulan Talent Only)",
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(upgrade) {
								return $factions.hasFaction( upgrade, "romulan", ship, fleet );
							}
						}
					}
				}
			],
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Reman Warbird" ? 10 : 5;
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
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Reman Warbird" ? 7 : 5;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.captain && ship.captain.skill > 5 ? 10 : 5;
			}
		},
		
		// Elim Garak (Mirror)
		"crew:elim_garak_71535": {
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain && $factions.hasFaction(ship,"mirror-universe", ship, fleet) )
							skill = (skill instanceof Function ? skill(upgrade,ship,fleet,0) : skill) + 2;
						return skill;
					}
				}
			}
		},
		
		// Cloaking Device (Regent's Flagship)
		"tech:cloaking_device_71535": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.name != "Regent's Flagship" ? 9 : 4;
			}
		},
		
		// Photon Torpedoes (Negh'var Bonus) (Mirror)
		"weapon:photon_torpedoes_71535": {
			attack: function(upgrade,ship,fleet) {
				return ship && ship.class == "Negh'var Class" ? 6 : 5;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.captain && ship.captain.name != "Karr" && ship.captain.name.indexOf("Hirogen") < 0 ? 9 : 4;
			}
		},
		
		// Subnucleonic Beam
		"weapon:subnucleonic_beam_71808": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf( "Hirogen" ) < 0 ? 10 : 5;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Romulan Drone Ship" ? 8 : 3;
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
			upgradeSlots: [ 
				{ 
					type: ["weapon"], 
					source: "Triphasic Emitter (Non-Borg, 5SP or less)",
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
							canEquip: function(upgrade, ship, fleet) {
								return !$factions.hasFaction(upgrade,"borg", ship, fleet) && upgrade.cost <= 5;
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
					type: ["talent"],
					source: "William T. Riker"
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
					type: ["weapon"], 
					source: "Turanj" 
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
		
		// First Maje
		// TODO Add a free slot for this on all Kazon ships? :(
		"talent:first_maje_71793": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon", ship, fleet) && ship.captain && $factions.hasFaction(ship.captain,"kazon", ship, fleet);
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
							skill = (skill instanceof Function ? skill(card,ship,fleet,0) : skill) + 1;
						return skill;
					}
				}
			}
		},
		
		// Tricobalt Warhead
		"weapon:tricobalt_warhead_71795": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class.indexOf("Tholian") < 0 ? 9 : 4;
			}
		},
		
		// Disruptor Pulse
		"weapon:disruptor_pulse_71794": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction( ship, "romulan", ship, fleet ) ? 10 : 5;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Gorn Raider" ? 8 : 4;
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
					type: ["tech"],
					source: "Annorax"
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Krenim Weapon Ship" ? 12 : 6;
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
						if( upgrade.type != "captain" && upgrade.type != "admiral" )
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
						if( upgrade.type == "tech" ) {
							cost = cost instanceof Function ? cost(upgrade,ship,fleet,0) : cost;
							if( cost > 0 )
								cost -= 1;
						}
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Oberth Class" ? 10 : 5;
			}
		},
		
		// Eric Motz
		"crew:eric_motz_71801": {
			upgradeSlots: [
				{
					type: ["tech"],
					source: "Eric Motz"
				}
			]
		},
		
		// William T. Riker
		"crew:william_t_riker_71801": {
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain ) {
							skill = skill instanceof Function ? skill(upgrade,ship,fleet,0) : skill;
							skill += 3;
						}
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
					type: ["crew"],
					source: "Krim"
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
							attack += 1;
						return attack;
					},
					shields: function(card,ship,fleet,shields) {
						if( card == ship )
							shields += 1;
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
		
		
		
		// Korinar
		
		// TODO It's not clear whether Mauk-to'Vor should get a faction penalty or cost=3 avoids this
		"captain:kurn_71999p": {
			upgradeSlots: [
				{
					type: ["talent"],
					source: "Kurn (Mauk-to'Vor Only at 3SP)",
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
					type: ["tech"],
					source: "Systems Upgrade"
				}
			],
			intercept: {
				ship: {
					shields: function(upgrade,ship,fleet,shields) {
						return shields + 1;
					}
				}
			},
			canEquip: onePerShip("Systems Upgrade"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet);
			}
		},
		
		"crew:systems_upgrade_c_71998p": {
			upgradeSlots: [
				{
					type: ["tech"],
					source: "Systems Upgrade"
				}
			],
			intercept: {
				ship: {
					shields: function(upgrade,ship,fleet,shields) {
						return shields + 1;
					}
				}
			},
			canEquip: onePerShip("Systems Upgrade"),
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet);
			}
		},
		
		"weapon:systems_upgrade_w_71998p": {
			upgradeSlots: [
				{
					type: ["tech"],
					source: "Systems Upgrade"
				}
			],
			intercept: {
				ship: {
					shields: function(upgrade,ship,fleet,shields) {
						return shields + 1;
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
				if( ship.attack <= 3 ) {
					return onePerShip("Type 8 Phaser Array")(upgrade,ship,fleet);
				}
				return false;
			}
		},
		
		
		// RESOURCES
		
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
							return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
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
							return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
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
							return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
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
							return (cost instanceof Function ? cost(card, ship, fleet, 0) : cost) - 1;
						
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
			upgradeSlots: [
				{
					type: ["talent"],
					source: "Sideboard",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += slot.occupant.cost instanceof Function ? slot.occupant.cost() : slot.occupant.cost;
						} );
						
						var cost = card.cost instanceof Function ? card.cost() : card.cost;
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: function() { return true; },
							canEquipFaction: function() { return true; },
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["crew"],
					source: "Sideboard",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += slot.occupant.cost instanceof Function ? slot.occupant.cost() : slot.occupant.cost;
						} );
						
						var cost = card.cost instanceof Function ? card.cost() : card.cost;
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: function() { return true; },
							canEquipFaction: function() { return true; },
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["tech"],
					source: "Sideboard",
					canEquip: function(card,ship,fleet,upgradeSlot) {
						
						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += slot.occupant.cost instanceof Function ? slot.occupant.cost() : slot.occupant.cost;
						} );
						
						var cost = card.cost instanceof Function ? card.cost() : card.cost;
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: function() { return true; },
							canEquipFaction: function() { return true; },
							factionPenalty: function() { return 0; }
						}
					},
				},
				{
					type: ["weapon"],
					source: "Sideboard",
					canEquip: function(card,ship,fleet,upgradeSlot) {

						var total = 0;
						$.each( fleet.resource.upgradeSlots, function(i,slot) {
							if( slot.occupant && slot != upgradeSlot )
								total += slot.occupant.cost instanceof Function ? slot.occupant.cost() : slot.occupant.cost;
						} );
						
						var cost = card.cost instanceof Function ? card.cost() : card.cost;
						return total + cost <= 20;
						
					},
					intercept: {
						ship: {
							// Remove all restrictions
							canEquip: function() { return true; },
							canEquipFaction: function() { return true; },
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
					factions: function(card,ship,fleet) {
						var factions = card.factions;
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
					factions: function(card,ship,fleet) {
						var factions = card.factions;
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
					factions: function(card,ship,fleet) {
						var factions = card.factions;
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
					factions: function(card,ship,fleet) {
						var factions = card.factions;
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
					type: ["crew"],
					source: "Kor",
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
					canEquip: function(card,ship,fleet) {
						if( card.type == "crew" && !$factions.hasFaction(card,"romulan", ship, fleet) )
							return false;
						return true;
					},
					// Can only equip Romulan captain
					canEquipCaptain: function(card,ship,fleet) {
						return $factions.hasFaction(card,"romulan", ship, fleet);
					},
					// All non-borg tech and weapon upgrades cost -1 SP
					cost: function(card,ship,fleet,cost) {
						if( (card.type == "tech" || card.type == "weapon") && !$factions.hasFaction(card,"borg", ship, fleet) )
							cost = (cost instanceof Function ? cost(card, ship, fleet, 0) : cost) - 1;
						return cost;
					},
					// No faction penalty for romulan upgrades
					factionPenalty: function(card,ship,fleet,factionPenalty) {
						if( card.type != "captain" && card.type != "admiral" && $factions.hasFaction(card,"romulan", ship, fleet) )
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
			cost: function(card,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"klingon", ship, fleet) ? 10 : 5;
			},
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
			cost: function(card,ship,fleet) {
				return ship && ship.name != "U.S.S. Prometheus" ? 8 : 4;
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
			skill: function(card,ship,fleet) {
				return ship && ship.class == "Dauntless Class" ? 8 : 3;
			},
		},
		
		// Auto-Navigation
		"tech:auto_navigation_71805": {
			skill: function(card,ship,fleet) {
				return ship && !ship.captain ? 2 : undefined;
			},
			upgradeSlots: [
				{
					type: ["tech"],
					source: "Auto-Navigation",
				}
			]
		},
		
		// Force Field
		"tech:force_field_71805": {
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Dauntless Class" ? 8 : 3;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "D'deridex Class" ? 6 : 3;
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
			cost: function(upgrade,ship,fleet) {
				return ship && ship.class != "Intrepid Class" ? 10 : 6;
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
					source: "K'Temoc (Klingon Talents Only)",
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
			cost: function(card,ship,fleet) {
				return !ship || hasFaction(ship,"klingon",ship,fleet) ? 2 : 5;
			},
			canEquip: onePerShip("Tactical Officer")
		},
		
		// Cryogenic Stasis
		"tech:cryogenic_stasis_72009": {
			upgradeSlots: [
				{
					type: ["crew"],
					source: "Cryogenic Stasis (Non-Borg, Cost 5 or less)",
					canEquip: function(card,ship,fleet) {
						return !hasFaction(card,"borg",ship,fleet) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							cost: function() { return 0; },
							factionPenalty: function() { return 0; },
						}
					}
				},
				{
					type: ["crew"],
					source: "Cryogenic Stasis (Non-Borg, Cost 5 or less)",
					canEquip: function(card,ship,fleet) {
						return !hasFaction(card,"borg",ship,fleet) && valueOf(card,"cost",ship,fleet) <= 5;
					},
					intercept: {
						ship: {
							cost: function() { return 0; }
						}
					}
				}
			]
		},
		
		
		
		
	};
	
}]);