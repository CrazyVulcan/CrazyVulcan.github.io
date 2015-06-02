var module = angular.module("utopia-card-loader", ["utopia-card-rules", "utopia-card-loader-spacedock", "utopia-card-loader-supplemental"]);

module.factory( "cardLoader", function($http, $filter, cardRules, $factions, cardLoaderSpacedock, cardLoaderSupplemental) {



	var valueOf = $filter("valueOf");

	return function(cards, callback) {

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
			ship.mirror = $factions.hasFaction(ship, "mirror");

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
				if( !$factions.match( upgrade, ship ) ) {
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
			canEquipFaction: true
		};

		function loadCaptain(captain) {

			if( isDuplicate(captain, cards) ) {
				console.log( "Duplicate card definition ignored", captain.id );
				return;
			}

			$.extend(true, captain, captainDefaults);

			// Set mirror flag
			captain.mirror = $factions.hasFaction(captain, "mirror");

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
			isSkillModifier: true
		};

		function loadAdmiral(admiral) {

			if( isDuplicate(admiral, cards) ) {
				console.log( "Duplicate card definition ignored", admiral.id );
				return;
			}

			$.extend(true, admiral, admiralDefaults);

			// Set mirror flag
			admiral.mirror = $factions.hasFaction(admiral, "mirror");

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
			upgrade.mirror = $factions.hasFaction(upgrade, "mirror");

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
			cards.push(resource);
		}

		// For resource special cards or anything else that doesn't need any special handling
		function loadOther(card) {
			cards.push(card);
		}


		cardLoaderSpacedock.loadCards( loadShip, loadCaptain, loadAdmiral, loadUpgrade, loadResource, loadOther, function() {

			cardLoaderSupplemental.loadCards( loadShip, loadCaptain, loadAdmiral, loadUpgrade, loadResource, loadOther );

			if( callback )
				callback();

		} );

	};

});