var module = angular.module("utopia-fleet-builder", ["utopia-card-upgrade","utopia-dragdrop"]);

module.directive( "fleetBuilder", function($filter) {

	return {

		scope: {
			fleet: "=",
			cards: "=",
			dragStore: "="
		},

		templateUrl: "fleet-builder.html",

		controller: function($scope, isMobile) {
			
			$scope.isMobile = isMobile;
			
			$scope.$watch( "fleet", function(fleet) {
				location.hash = angular.toJson( $scope.saveFleet(fleet) );
			}, true );
			
			$scope.$on( "removeFromFleet", function(ev, card) {
				console.log( "remove", ev, card );
				
				$scope.removeFromFleet( card, $scope.fleet );
				
			} );

			$scope.addFleetShip = function(fleet, ship) {
				
				// Check uniqueness
				var other = $scope.findOtherInFleet(ship, fleet);
				
				// Check interceptors
				var canJoinFleet = valueOf(ship,"canJoinFleet",ship,fleet);
				if( !canJoinFleet ) {
					console.log("joinFleet stopped by interceptor");
					return false;
				}
				
				// Fail if other
				if( other && other != ship ) {
					console.log("upgrade uniquenes check failed");
					return false;
				}
				
				// If other is this, user is moving card within fleet
				if( other ) {
					$scope.removeFromFleet( other, fleet );
				}
				
				// Clone ship
				//ship = $.extend(true,{},ship);
				ship = angular.copy(ship);
				
				fleet.push( ship );
				
				return ship;
				
			};
			
			// TODO replace references
			$scope.getUpgradeSlots = $filter("upgradeSlots");
			
			$scope.isUpgradeCompatible = function(upgrade, upgradeSlot) {
				return upgrade != upgradeSlot.occupant && $.inArray( upgrade.type, upgradeSlot.type ) >= 0;
			};
			
			var valueOf = $filter("valueOf");
			
			$scope.setShipUpgrade = function(fleet, ship, upgradeSlot, upgrade) {
				
				// Check slot type
				if( !$scope.isUpgradeCompatible(upgrade, upgradeSlot) ) {
					console.log("wrong slot type");
					return false;
				}
				
				// Check for drop onto self
				if( upgradeSlot.occupant == upgrade )
					return false;
				
				// Check interceptors
				var canEquip = valueOf(upgrade,"canEquip",ship,fleet,upgradeSlot);
				if( !canEquip ) {
					console.log("equip stopped by special card rule");
					return false;
				}
				
				// Check faction interceptors
				var canEquipFaction = valueOf(upgrade,"canEquipFaction",ship,fleet,upgradeSlot);
				if( !canEquipFaction ) {
					console.log("equip stopped by faction-specific special card rule");
					return false;
				}
				
				// Slot-specific restrictions
				if( upgradeSlot.canEquip && !upgradeSlot.canEquip(upgrade) ) {
					console.log("upgrade rejected by slot");
					return false;
				}

				// Check uniqueness
				var other = $scope.findOtherInFleet(upgrade, fleet);
				
				// Fail if other
				if( other && other != upgrade && other != upgradeSlot.occupant ) {
					console.log("upgrade uniquenes check failed");
					return false;
				}
				
				// If other is this, and user is moving card within fleet
				if( other && other != upgradeSlot.occupant ) {
					$scope.removeFromFleet( other, fleet, upgradeSlot.occupant );
				}
			
				upgradeSlot.occupant = angular.copy(upgrade);
				
				// Trigger onEquip handlers
				valueOf(upgradeSlot.occupant,"onEquip",ship,fleet);
				
				return upgradeSlot.occupant;
				
			};
			
			$scope.setShipCaptain = function(fleet,ship,captain) {
				
				if( captain.type != "captain" )
					return false;
				
				// Check interceptors
				var canEquip = valueOf(captain,"canEquipCaptain",ship,fleet);
				if( !canEquip ) {
					console.log("equip stopped by interceptor");
					return false;
				}
				
				// Uniqueness
				var other = $scope.findOtherInFleet(captain, fleet);
				
				if( other && other != captain && other != ship.captain ) {
					console.log( "captain already in fleet" );
					return false;
				}
				
				// Move if already in fleet
				if( other && other != ship.captain ) {
					$scope.removeFromFleet( other, fleet, ship.captain );
				}
				
				//ship.captain = $.extend(true,{}, captain);
				ship.captain = angular.copy(captain);

				return ship.captain;
				
			};
			
			$scope.fleetHasAdmiral = function( fleet ) {
				
				var hasAdmiral = false;
				
				$.each( fleet, function(i,ship) {
					if( ship.admiral ) {
						hasAdmiral = true;
						return false;
					}
				});
				
				return hasAdmiral;
				
			};
			
			$scope.setShipAdmiral = function(fleet,ship,admiral) {
				
				if( admiral.type != "admiral" )
					return false;
				
				// Check interceptors
				var canEquip = valueOf(admiral,"canEquipAdmiral",ship,fleet);
				if( !canEquip ) {
					console.log("equip stopped by interceptor");
					return false;
				}
				
				// Uniqueness
				var other = $scope.findOtherInFleet(admiral, fleet);
				
				if( other && other != admiral && other != ship.admiral ) {
					console.log( "admiral already in fleet" );
					return false;
				}
				
				// Move if already in fleet
				if( other && other != ship.admiral ) {
					$scope.removeFromFleet( other, fleet, ship.admiral );
				}
				
				//ship.admiral = $.extend(true,{}, admiral);
				ship.admiral = angular.copy(admiral);
				
				return ship.admiral;
				
			};
			
			$scope.findOtherInFleet = function( card, fleet ) {
				
				var clash = false;
				
				$.each( fleet, function(i, ship) {
					
					if( card == ship || isUniqueClash(card, ship) ) {
						clash = ship;
						return false;
					}
					
					if( card == ship.captain || isUniqueClash(card, ship.captain)) {
						clash = ship.captain;
						return false;
					}
					
					if( card == ship.admiral || isUniqueClash(card, ship.admiral)) {
						clash = ship.admiral;
						return false;
					}
					
					$.each( $scope.getUpgradeSlots(ship), function(j, upgradeSlot) {
						if( card == upgradeSlot.occupant || isUniqueClash(card, upgradeSlot.occupant) ) {
							clash = upgradeSlot.occupant;
							return false;
						}
					} );
					
					if( clash )
						return false;
					
				} );
				
				return clash;
				
			};
			
			function isUniqueClash( card, other ) {
				return other && card.unique && other.unique && card.name == other.name && card.mirror == other.mirror ? other : false;
			}
			
			$scope.removeFromFleet = function( card, fleet, replaceWith ) {
				
				$.each( fleet, function(i, ship) {
					
					if( card == ship ) {
						if( replaceWith && replaceWith.type == "ship" )
							fleet[i] = replaceWith;
						else
							fleet.splice(i,1);
						return false;
					}
					
					if( card == ship.captain ) {
						if( replaceWith && replaceWith.type == "captain" )
							ship.captain = replaceWith;
						else
							delete ship.captain;
						return false;
					}
					
					if( card == ship.admiral ) {
						if( replaceWith && replaceWith.type == "admiral" )
							ship.admiral = replaceWith;
						else
							delete ship.admiral;
						return false;
					}
					
					var found = false;
					
					$.each( $scope.getUpgradeSlots(ship), function(j,slot) {
						if( card == slot.occupant ) {
							if( replaceWith && $scope.isUpgradeCompatible( replaceWith, slot ) )
								slot.occupant = replaceWith;
							else
								delete slot.occupant;
							found = true;
							return false;
						}
					} );
					
					return !found;
				});
				
			};
			
			$scope.getTotalCost = function(ship, fleet) {
				
				var valueOf = $filter("valueOf");
				
				var cost = ship.cost;
				
				if( ship.captain )
					cost += valueOf(ship.captain,"cost",ship,fleet);

				if( ship.admiral )
					cost += valueOf(ship.admiral,"cost",ship,fleet);
				
				$.each( $scope.getUpgradeSlots(ship), function(i,slot) {
					if( slot.occupant )
						cost += valueOf(slot.occupant,"cost",ship,fleet);
				});
				
				return cost;
			};
			
			$scope.getFleetCost = function(fleet) {
				
				var cost = 0;
				
				$.each( fleet, function(i, ship) {
					cost += $scope.getTotalCost(ship,fleet);
				});
				
				return cost;
				
			};
			
			$scope.saveFleet = function(fleet) {
				
				var savedFleet = {
					ships: []
				};
				
				$.each( fleet, function(i, ship) {
					savedFleet.ships.push( saveCard(ship) );
				});
				
				console.log( JSON.stringify(savedFleet) );
				
				return savedFleet;
				
			};
			
			function saveCard(card) {
				
				if( !card )
					return {};
				
				var saved = {
					id: card.type+":"+card.id
				};
				
				if( card.captain )
					saved.captain = saveCard(card.captain);

				if( card.admiral )
					saved.admiral = saveCard(card.admiral);
				
				var upgrades = [];
				// TODO Consider switching ship.upgrades to .upgradeSlots
				$.each( card.upgrades || [], function(i, slot) {
					var savedSlot = {};
					if( slot.occupant ) {
						savedSlot = saveCard(slot.occupant);
					}
					upgrades.push(savedSlot);
				});
				if( upgrades.length > 0 )
					saved.upgrades = upgrades;
				
				var upgradeSlots = [];
				$.each( card.upgradeSlots || [], function(i, slot) {
					var savedSlot = {};
					if( slot.occupant ) {
						savedSlot = saveCard(slot.occupant);
					}
					upgradeSlots.push(savedSlot);
				});
				if( upgradeSlots.length > 0 )
					saved.upgradeSlots = upgradeSlots;
				
				return saved;
				
			}
			
			$scope.findCardById = function(cards, id) {
				
				var match = false;
				$.each( cards, function(i, card) {
					if( card.type+":"+card.id == id ) {
						match = card;
						return false;
					}
				} )
				return match;
				
			};
			
			function loadCard(fleet, cards, savedCard, ship) {
				
				var card = angular.copy( $scope.findCardById(cards, savedCard.id) );
				
				if( !card )
					return false;
				
				var promulgate = function(card) {
				
					console.log("prom",savedCard.id);
				
					if( savedCard.captain ) {
						var result = loadCard(fleet, cards, savedCard.captain, card);
						if( !result )
							return false;
						var captain = $scope.setShipCaptain( fleet, card, result.card );
						if( !captain )
							return false;
						result.promulgate(captain);
					}
					
					if( savedCard.admiral ) {
						var result = loadCard(fleet, cards, savedCard.admiral, card);
						if( !result )
							return false;
						var admiral = $scope.setShipAdmiral( fleet, card, result.card );
						if( !admiral )
							return false;
						result.promulgate(admiral);
					}
					
					$.each( savedCard.upgrades || [], function(i, savedUpgrade) {
						
						if( savedUpgrade && savedUpgrade.id ) {
							var result = loadCard( fleet, cards, savedUpgrade, card );
							if( !result )
								throw false;
							var upgrade = $scope.setShipUpgrade( fleet, card, card.upgrades[i], result.card );
							if( !upgrade )
								throw false;
							result.promulgate(upgrade);
						}
						
					} );
					
					$.each( savedCard.upgradeSlots || [], function(i, savedUpgrade) {
						
						if( savedUpgrade && savedUpgrade.id ) {
							var result = loadCard( fleet, cards, savedUpgrade, ship );
							if( !result )
								throw false;
							var upgrade = $scope.setShipUpgrade( fleet, ship, card.upgradeSlots[i], result.card );
							if( !upgrade )
								throw false;
							result.promulgate(upgrade);
						}
						
					} );
					
				}
				
				return { card: card, promulgate: promulgate };
				
			}
			
			$scope.loadFleet = function(cards, savedFleet) {
				
				console.log(JSON.stringify(savedFleet));
				
				var fleet = [];
				
				$.each( savedFleet.ships, function(i, savedShip) {
					
					var result = loadCard( fleet, cards, savedShip );
					
					if( !result )
						throw "error";
					
					var ship = $scope.addFleetShip( fleet, result.card )
					if( !ship )
						throw "error";
					
					console.log(ship);
					
					result.promulgate(ship);
					
				});
				
				console.log(JSON.stringify(fleet));
				
				return fleet;
				
			}
			
			var hashFleet = location.hash ? angular.fromJson( location.hash.substring(1) ) : false;
			
			$scope.$on("cardsLoaded", function() {
				console.log("cardsLoaded",$scope.cards.length);
				if( hashFleet ) {
					console.log(hashFleet);
					hashFleet = $scope.loadFleet( $scope.cards, hashFleet );
					if( hashFleet )
						$scope.fleet = hashFleet;
				}
			});
		
		}

	};

} );