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
		list: [ "Federation", "Klingon", "Vulcan", "Romulan", "Bajoran", "Dominion", "Independent", "Borg", "Ferengi", "Species 8472", "Kazon", "Mirror Universe", "Xindi", "Q Continuum" ],
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
	
	//Add a new var to serch for the value of the modifyer "Printed Value"
//	var printedValue = upgrade.printedValue;
	
	
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
				//console.log(slot.type, i);
				type = slot.type;
				return false;
				}
			}
		);

		return type;
	}

	/**
	 * A function to check if assigned upgrade type matches or slot matches as appropriate
	 *
	 * @param {string} type Upgrade/Slot type to check against
	 * @param {Object} upgrade The upgrade who's assigned slot we want to check
	 * @param {Object} ship The current assigned ship
	 * @returns {boolean}
	 */
	var checkUpgrade = function(type, upgrade, ship){
		/** Default return value is false */
		var returnValue = false;

		if (upgrade.type == type)
			returnValue = true;

		/** Only check for question type upgrades with countsAsUpgrade set to true */
		else if (upgrade.type == "question" && upgrade.countsAsUpgrade) {
			/** List of slots on current ship */
			var slots = $filter("upgradeSlots")(ship);

			/** Loop over all of the slots on the ship */
			for ( var i = 0; i < slots.length; i++){

				/** See if the slot is occupied by the upgrade and is the right type */
				if (slots[i].occupant &&
					  slots[i].occupant.id == upgrade.id &&
					  $.inArray(type, slots[i].type) > -1){

						/** If so, set to return true and break out of the loop */
						returnValue = true;
						break;
				}
			}
		}
		return returnValue;
	}

	return {

	
	
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

	
	};	
}]);
