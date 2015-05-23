var module = angular.module("utopia-card-rules", []);

module.factory( "$factions", function() {
	return {
		hasFaction: function(card, faction) {
			if( !card )
				return false;
			return $.inArray( faction, card.factions ) >= 0;
		},
		match: function(card, other) {
			var match = false;
			$.each( card.factions, function(i, cardFaction) {
				$.each( other.factions, function(i, otherFaction) {
					if( cardFaction == otherFaction ) {
						match = true;
						return false;
					}
				});
				if( match )
					return false;
			});
			return match;
		}
	}
} );

module.factory( "cardRules", function($filter, $factions) {

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
				$.each( fleet, function(i, other) {
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
				$.each( fleet, function(i, other) {
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
								if( cost < 0 )
									cost = 0;
								return cost;
							}
						}
					}
				}
			]
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
							}
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
							}
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
							if( cost < 0 )
								cost = 0;
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
							if( cost < 0 )
								cost = 0;
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
				return $factions.hasFaction( ship, "federation" ) ? 0 : 1;
			}
		},
		
		// Luaran
		"captain:2035": {
			// One Dominion upgrade is -2 SP. Argh.
			// This is a messy implementation. It reduces the cost of Luaran instead, so long as there is a valid Dominion upgrade.
			cost: function(upgrade,ship,fleet) {
				
				if( !ship )
					return 2;
				
				var candidate = false;
				var candCost = 0;
				
				// Find the upgrade with the highest cost
				$.each( $filter("upgradeSlots")(ship), function(i, slot) {
					if( slot.occupant && slot.occupant != upgrade && slot.occupant.type != "admiral" && $factions.hasFaction(slot.occupant,"dominion") ) {
						var occCost = valueOf(slot.occupant,"cost",ship,fleet);
						if( occCost > candCost ) {
							candidate = slot.occupant;
							candCost = valueOf(slot.occupant,"cost",ship,fleet);
						}
					}
				});
				
				// Subtract up to 2 from Luaran's cost
				return candCost > 2 ? 0 : 2 - candCost;
				
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
								if( $factions.hasFaction(upgrade,"dominion") )
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
								if( $factions.hasFaction(upgrade,"dominion") )
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
							}
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
						if( upgrade.type != "captain" && upgrade.type != "admiral" && $factions.hasFaction(upgrade,"borg") )
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
						if( upgrade.type == "tech" && ( $factions.hasFaction(upgrade,"vulcan") || $factions.hasFaction(upgrade,"federation") ) ) {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 2;
							if( cost < 0 )
								cost = 0;
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
				return $factions.hasFaction(ship,"federation") ? 0 : 1;
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
						if( upgrade.type == "weapon" && $factions.hasFaction(upgrade,"kazon") ) {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost) - 1;
							if( cost < 0 )
								cost = 0;
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
			]
		},
		
		// Miles O'Brien MU
		"captain:miles_o_brien_71529": {
			upgradeSlots: [ 
				{ 
					type: ["tech"], 
					source: "Miles O'Brien" 
				}
			]
		},
		
		// Borg Queen
		"captain:borg_queen_71513a": {
			upgradeSlots: [ 
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
								console.log("gareb onequip");
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
					if( cost < 0 )
						cost = 0;
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
				return ship.captain && $factions.hasFaction(ship.captain,"klingon");
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
				return ship.captain && $factions.hasFaction(ship.captain,"bajoran");
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
				return $factions.hasFaction(ship,"species-8472");
			}
		},
		
		// Extraordinary Immune Response
		"tech:extraordinary_immune_response_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472");
			}
		},
		
		// Kazon Raiding Party
		"crew:kazon_raiding_party_71282": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon");
			}
		},
		
		// Masking Circuitry
		"tech:masking_circuitry_71282": {
			cost: function(upgrade,ship,fleet) {
				return ship &&  $factions.hasFaction(ship,"kazon") ? 8 : 3;
			}
		},
		
		// Quantum Singularity
		"tech:quantum_singularity_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472");
			}
		},
		
		// The Weak Will Perish
		"talent:the_weak_will_perish_71281": {
			cost: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"species-8472") ? 10 : 5;
			}
		},
		
		// Biological Attack
		"weapon:biological_attack_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"species-8472");
			}
		},
		
		// Cutting Beam
		"tech:cutting_beam_71283": {
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg");
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
				return $factions.hasFaction(ship,"species-8472");
			}
		},
		
		// Transphasic Torpedoes
		"tech:transphasic_torpedoes_71280": {
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
		"weapon:energy_focusing_ship_71281": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class == "Tholian Vessel";
			}
		},
		
		// Vulcan High Command
		"talent:vulcan_high_command_2_0_71446": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain &&  $factions.hasFaction(ship,"vulcan") &&  $factions.hasFaction(ship.captain,"vulcan");
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
				return ship.captain && $factions.hasFaction(ship.captain,"borg");
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
				return $factions.hasFaction(ship,"borg");
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
					cost: function(upgrade,ship,fleet,cost) {
						if( upgrade.type == "weapon" ) {
							cost = (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost);
							if( cost <= 5 )
								cost -= 2;
						}
						return cost;
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
				return $factions.hasFaction( ship, "federation" );
			}
		},
		
		// Experimental Link
		"talent:experimental_link_71522": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"borg");
			}
		},
		
		// Transwarp Conduit
		"borg:transwarp_conduit_71522": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"borg");
			}
		},
		
		// Unnecessary Bloodshed
		"talent:unnecessary_bloodshed_71524": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"dominion");
			}
		},
		
		// Photon Torpedoes (Borg)
		"weapon:photon_torpedoes_71522": {
			attack: function(upgrade,ship,fleet) {
				return ship && $factions.hasFaction(ship,"borg") ? 6 : 5;
			}
		},
		
		// Forward Weapons Array
		"weapon:forward_weapons_array_71522": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg") ? 11 : 6;
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
				return $factions.hasFaction(ship,"federation");
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
								return upgrade.cost <= 5;
							},
							canEquipFaction: function(upgrade,ship,fleet) {
								return !$factions.hasFaction(upgrade,"borg");
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
				return ship && $factions.hasFaction(ship,"federation") ? 0 : 1;
			}
		},
		
		// Vic Fontaine
		"tech:vic_fontaine_tech_71786": {
			factionPenalty: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation" ) ? 0 : 1;
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
				return $factions.hasFaction( ship, "federation" );
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
				return $factions.hasFaction( ship, "vulcan" ) ? 0 : 1;
			}
		},
		
		// Vulcan Commandos
		"crew:vulcan_commandos_71527": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "vulcan" );
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
				return $factions.hasFaction(ship,"ferengi");
			}
		},
		
		// Vengeance
		"talen:vengeance_71646a": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return ship.captain && $factions.hasFaction(ship.captain,"ferengi") && $factions.hasFaction(ship,"ferengi");
			}
		},
		
		// Cloaking Device (Mirror)
		"tech:cloaking_device_71646b": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"mirror") ? 9 : 4;
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
				return ship.captain && $factions.hasFaction(ship.captain,"vulcan") && $factions.hasFaction(ship,"vulcan");
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
				return ship && !$factions.hasFaction(ship,"borg") ? 9 : 4;
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
				return ship.captain && !$factions.hasFaction(ship.captain,"borg") && !$factions.hasFaction(ship,"borg");
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
				return $factions.hasFaction(ship,"borg");
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
				return $factions.hasFaction(ship,"federation") && ship.hull >= 4;
			}
		},
		
		// Multi Kinetic Neutronic Mines
		"weapon:multi_kinetic_neutronic_mines_71530": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg") ? 15 : 10;
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
				return ship.captain && $factions.hasFaction(ship.captain,"klingon");
			}
		},

		// Command Interface
		"borg:command_interface_71513a": {
			cost: function(upgrade,ship,fleet) {
				return ship && !$factions.hasFaction(ship,"borg") ? 10 : 5;
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
				return ship.captain && $factions.hasFaction(ship.captain,"klingon");
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
								return $factions.hasFaction( upgrade, "romulan" );
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
								return $factions.hasFaction( upgrade, "romulan" );
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
								return $factions.hasFaction( upgrade, "romulan" );
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
								return $factions.hasFaction( upgrade, "romulan" );
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
						if( upgrade == ship.captain && $factions.hasFaction(ship,"mirror") )
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
							canEquip: function(upgrade) {
								return !$factions.hasFaction(upgrade,"borg") && upgrade.cost <= 5;
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
				return ship && $factions.hasFaction(ship,"klingon") ? 0 : 1;
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
				return ship && $factions.hasFaction(ship,"klingon") ? 0 : 1;
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
				return $factions.hasFaction(ship,"kazon");
			}
		},
		
		// Haliz
		"crew:haliz_71793": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon");
			}
		},
		
		// First Maje
		// TODO Add a free slot for this on all Kazon ships? :(
		"talent:first_maje_71793": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"kazon") && ship.captain && $factions.hasFaction(ship.captain,"kazon");
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
				return $factions.hasFaction(ship,"romulan") && ship.captain && $factions.hasFaction(ship.captain,"romulan");
			}
		},
		
		// Romulan Sub Lieutenant
		"crew:romulan_sub_lieutenant_71794": {
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "romulan" );
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
				return ship && $factions.hasFaction( ship, "romulan" ) ? 10 : 5;
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
				return $factions.hasFaction( ship, "dominion" );
			}
		},
		
		// Aft Weapons Array
		"weapon:aft_weapons_array_71798": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.hull >= 4;
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "dominion" );
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
				return $factions.hasFaction( ship, "federation" );
			}
		},
		
		// Warp Drive
		"tech:warp_drive_71997p": {
			canEquip: function(upgrade,ship,fleet) {
				return ship.class.indexOf("Shuttlecraft") >= 0 && onePerShip("Warp Drive")(upgrade,ship,fleet);
			},
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction( ship, "federation" );
			}
		},
		
		
		
		
		// SQUADRONS
		
		
		
	};
	
} );