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
					$.each(fleet,function(i,ship) {
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
		
		function loadCaptain(captain) {
			
			if( isDuplicate(captain, cards) ) {
				console.log( "Duplicate card definition ignored", captain.id );
				return;
			}
			
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
			canEquipFaction: true
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
		
		function loadUpgrade(upgrade) {
			
			if( isDuplicate(upgrade, cards) ) {
				console.log( "Duplicate card definition ignored", upgrade.id );
				return;
			}
			
			// Apply specific card rules
			if( cardRules[upgrade.type+":"+upgrade.id] )
				$.extend( true, upgrade, cardRules[upgrade.type+":"+upgrade.id] );
			
			cards.push( upgrade );
			
		}
		
		cardLoaderSpacedock.loadCards( loadShip, loadCaptain, loadAdmiral, loadUpgrade, function() {
			
			cardLoaderSupplemental.loadCards( loadShip, loadCaptain, loadAdmiral, loadUpgrade );

			if( callback )
				callback();
			
		} );
	
	};

});