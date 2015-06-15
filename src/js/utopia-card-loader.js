var module = angular.module("utopia-card-loader", ["utopia-card-rules", "utopia-card-loader-spacedock", "utopia-card-loader-supplemental"]);

module.factory( "cardLoader", [ "$filter", "cardRules", "$factions", "cardLoaderSpacedock", "cardLoaderSupplemental", function($filter, cardRules, $factions, cardLoaderSpacedock, cardLoaderSupplemental) {

	var valueOf = $filter("valueOf");

	return function(cards, sets, shipClasses, callback) {

		function isDuplicate(card, cards) {
			var dupe = false;
			$.each( cards, function(i,other) {
				if( card.id == other.id && card.type == other.type ) {
					dupe = true;
					return false;
				}
			});
			return dupe;
		}

		var shipDefaults = {
			canJoinFleet: true,
			intercept: { ship:{}, fleet: {} }
		};

		function loadShip(ship) {

			if( isDuplicate(ship, cards) ) {
				console.log( "Duplicate card definition ignored", ship.id );
				return;
			}

			// Set mirror flag
			ship.mirror = $factions.hasFaction(ship, "mirror-universe");

			// Expand shorthand upgrade slots
			for( var i = 0; i < ship.upgrades.length; i++ )
				if( typeof ship.upgrades[i] == "string" )
					ship.upgrades[i] = { type: [ ship.upgrades[i] ], source: "ship" };

			$.extend(true, ship, shipDefaults);

			// Add squadron equip rule
			// TODO Player can remove ship with hull > 3 after this check
			if( ship.squadron ) {
				ship.canJoinFleet = function(ship,ship2,fleet) {
					var numShipsHull4Plus = 0;
					var numSquadrons = 0;
					$.each(fleet.ships,function(i,ship) {
						if( ship.squadron )
							numSquadrons++;
						else if( ship.hull >= 4 )
							numShipsHull4Plus++;
					});
					return numShipsHull4Plus > numSquadrons;
				};
			}

			// Apply specific card rules
			if( cardRules[ship.type+":"+ship.id] )
				$.extend( true, ship, cardRules[ship.type+":"+ship.id] );

			// Add faction penalties to cost calculation
			var costIntercept = ship.intercept.ship.cost;
			ship.intercept.ship.cost = function(upgrade, ship, fleet, cost) {
				if( costIntercept )
					cost = costIntercept(upgrade, ship, fleet, cost);
				if( !$factions.match( upgrade, ship, ship, fleet ) ) {
					var penalty = valueOf(upgrade,"factionPenalty",ship,fleet);
					return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost ) + penalty;
				}
				return cost;
			};

			cards.push(ship);

		}

		var captainDefaults = {
			factionPenalty: 1,
			intercept: { ship: {}, fleet: {} },
			canEquip: true,
			canEquipCaptain: true,
			canEquipFaction: true,
			showType: true,
		};

		function loadCaptain(captain) {
			
			if( isDuplicate(captain, cards) ) {
				console.log( "Duplicate card definition ignored", captain.id );
				return;
			}

			$.extend(true, captain, captainDefaults);

			// Set mirror flag
			captain.mirror = $factions.hasFaction(captain, "mirror-universe");

			// Add talent slots
			captain.upgradeSlots = [];
			for( var i = 0; i < captain.talents || 0; i++ )
				captain.upgradeSlots.push( { type: ["talent"], source: captain.name } );

			// Apply specific card rules
			if( cardRules[captain.type+":"+captain.id] )
				$.extend( true, captain, cardRules[captain.type+":"+captain.id] );

			cards.push( captain );

		}

		var admiralDefaults = {
			factionPenalty: 3,
			intercept: { ship: {}, fleet: {} },
			canEquip: true,
			canEquipAdmiral: true,
			canEquipFaction: true,
			isSkillModifier: true,
			showType: true
		};

		function loadAdmiral(admiral) {

			if( isDuplicate(admiral, cards) ) {
				console.log( "Duplicate card definition ignored", admiral.id );
				return;
			}

			$.extend(true, admiral, admiralDefaults);

			// Set mirror flag
			admiral.mirror = $factions.hasFaction(admiral, "mirror-universe");

			// Add talent slots
			admiral.upgradeSlots = [];
			for( var i = 0; i < admiral.talents || 0; i++ )
				admiral.upgradeSlots.push( { type: ["talent"], source: admiral.name } );

			// Add skill modifier to Captain skill evaluation
			admiral.intercept.ship.skill = function(upgrade,ship,fleet,skill) {
				if( upgrade == ship.captain ) {
					skill = (skill instanceof Function ? skill(upgrade,ship,fleet,0) : skill) + admiral.skill;
				}
				return skill;
			};

			// Apply specific card rules
			if( cardRules[admiral.type+":"+admiral.id] )
				$.extend( true, admiral, cardRules[admiral.type+":"+admiral.id] );

			cards.push( admiral );

		}

		var upgradeDefaults = {
			factionPenalty: 1,
			intercept: { ship: {}, fleet: {} },
			canEquip: true,
			canEquipFaction: true
		};

		function loadUpgrade(upgrade) {

			if( isDuplicate(upgrade, cards) ) {
				console.log( "Duplicate card definition ignored", upgrade.id );
				return;
			}

			$.extend(true, upgrade, upgradeDefaults);

			// Set mirror flag
			upgrade.mirror = $factions.hasFaction(upgrade, "mirror-universe");

			// Apply specific card rules
			if( cardRules[upgrade.type+":"+upgrade.id] )
				$.extend( true, upgrade, cardRules[upgrade.type+":"+upgrade.id] );

			cards.push( upgrade );

		}

		// TODO Lots of extra logic for specific resources
		// Flagship, Fleet Captain, Officer Cards, Attack Fighters, Officer Exchange Program, Sideboard, High Yield Photons
		// The rest should just be a card with a fixed cost.

		var resourceDefaults = {
			intercept: { ship: {}, fleet: {} },
			canEquip: true,
			canEquipFaction: true
		};

		function loadResource(resource) {

			$.extend(true, resource, resourceDefaults);

			// Apply specific card rules
			if( cardRules[resource.type+":"+resource.id] )
				$.extend( true, resource, cardRules[resource.type+":"+resource.id] );

			cards.push(resource);
		}

		// For resource special cards or anything else that doesn't need any special handling
		function loadOther(card) {
			
			// Apply specific card rules
			if( cardRules[card.type+":"+card.id] )
				$.extend( true, card, cardRules[card.type+":"+card.id] );
			
			cards.push(card);
			
		}
		
		function loadSet(set) {
			
			if( sets[set.id] ) {
				console.log("Duplicate set",set.id,set.name);
				return;
			}
			
			sets[set.id] = set;
			
		}
		
		function loadShipClass(shipClass) {
			
			if( shipClasses[shipClass.id] ) {
				console.log("Duplicate ship class",shipClass.id,shipClass.name,shipClasses[shipClass.id].name);
				return;
			}
			
			shipClasses[shipClass.id] = shipClass;
			
		}

		cardLoaderSpacedock.loadCards( loadSet, loadShip, loadShipClass, loadCaptain, loadAdmiral, loadUpgrade, loadResource, loadOther, function() {

			cardLoaderSupplemental.loadCards( loadSet, loadShip, loadShipClass, loadCaptain, loadAdmiral, loadUpgrade, loadResource, loadOther );
			
			// Assign classes to ships
			// TODO This should really be done in the subloader
			$.each( cards, function(i,card) {
				if( card.type == "ship" ) {
					if( !card.classId ) {
						$.each( shipClasses, function(id,shipClass) {
							if( shipClass.name == card.class ) {
								card.classId = id;
								return false;
							}
						} );
					}
					if( !card.classId || !shipClasses[card.classId] )
						console.log( "No class for ship", card.id, card.name, card.classId );
				}
			});

			if( callback )
				callback();

		} );

	};

}]);