var module = angular.module("utopia-card-upgrade", []);

module.filter( "upgradeSlots", function() {
	
	return function( ship ) {

		var toCheck = [];
		if( ship.resource && ship.resource.upgradeSlots )
			toCheck = toCheck.concat(ship.resource.upgradeSlots);
		if( ship.captain && ship.captain.upgradeSlots )
			toCheck = toCheck.concat(ship.captain.upgradeSlots);
		if( ship.admiral && ship.admiral.upgradeSlots )
			toCheck = toCheck.concat(ship.admiral.upgradeSlots);
		
		toCheck = toCheck.concat( ship.upgrades ).concat( ship.upgradeSlots );
		
		var slots = [];
		
		while( toCheck.length > 0 ) {
			var slot = toCheck.shift();
			if( slot ) {
				slots.push( slot );
				if( slot.occupant && slot.occupant.upgradeSlots )
					toCheck = slot.occupant.upgradeSlots.concat( toCheck );
			}
		}
	
		return slots;
		
	}
	
} );

module.filter( "shipInterceptors", function($filter) {
	
	var upgradeSlots = $filter("upgradeSlots");
	
	return function( card, ship, type, field, upgradeSlot ) {
		
		var interceptors = [];
		
		var slots = upgradeSlots(ship);
		
		$.each( slots, function(i, slot) {
			if( slot.occupant && slot.occupant.intercept[type][field] )
				interceptors.push( slot.occupant.intercept[type][field] );
			if( (upgradeSlot && slot == upgradeSlot) || (card == slot.occupant) ) {
				if( slot.intercept && slot.intercept[type] && slot.intercept[type][field] ) {
					interceptors.push( slot.intercept[type][field] );
				}
			}
		});

		if( ship.resource && ship.resource.intercept[type][field] )
			interceptors.push( ship.resource.intercept[type][field] );
		
		if( ship.captain && ship.captain.intercept[type][field] )
			interceptors.push( ship.captain.intercept[type][field] );

		if( ship.admiral && ship.admiral.intercept[type][field] )
			interceptors.push( ship.admiral.intercept[type][field] );
		
		if( ship.intercept && ship.intercept[type][field] )
			interceptors.push( ship.intercept[type][field] );
	
		return interceptors;
		
	}
	
} );

module.filter( "interceptors", function($filter) {
	
	var shipInterceptors = $filter("shipInterceptors");
	
	return function( card, ship, fleet, field, upgradeSlot ) {

		var interceptors = [];
		
		if( ship )
			interceptors = interceptors.concat( shipInterceptors(card,ship,"ship",field,upgradeSlot) );
	
		if( fleet ) {

			$.each( fleet.ships || [], function(i, ship) {
				interceptors = interceptors.concat( shipInterceptors(card,ship,"fleet",field) );
			});

			if( fleet.resource ) {
				interceptors = interceptors.concat( shipInterceptors(card,fleet.resource,"fleet",field) );
			}
			
		}
		
		return interceptors;
		
	}
	
} );

module.filter( "valueOf", function($filter) {

	var interceptorsFilter = $filter("interceptors");

	return function( card, field, ship, fleet, upgradeSlot ) {
		
		data = card[field];

		if( ship )
			$.each( interceptorsFilter( card, ship, fleet, field, upgradeSlot ), function(i, interceptor) {
				data = interceptor( card, ship, fleet, data );
			});
	
		if( data instanceof Function )
			return data(card, ship, fleet);
		return data;

	}

});

module.directive( "cardUpgrade", function() {

	return {

		scope: {
			upgrade: "=",
			ship: "=",
			fleet: "=",
			dragStore: "=",
			dragSource: "@"
		},

		templateUrl: "card-upgrade.html",

		controller: function($scope) {

			$scope.range = function(size) {
				return new Array(size);
			};
			
			$scope.isDefined = function(value) {
				return value !== undefined;
			};
		
		}

	};

} );