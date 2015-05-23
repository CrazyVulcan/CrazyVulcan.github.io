var module = angular.module("utopia", ["ngSanitize", "utopia-card-ship", "utopia-card-upgrade", "utopia-dragdrop", "utopia-fleet-builder", "utopia-card-loader", "utopia-card-rules"]);

module.filter( "cardFilter", function($factions) {

	return function( cards, options ) {

		return $.map( cards, function(card) {

			// Uniqueness options
			if( options.unique && !card.unique && !options.generic )
				return null;

			if( options.generic && card.unique && !options.unique)
				return null;

			// Text search
			if( options.query ) {
				if( card.name.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 &&
					( !card.class || card.class.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) &&
					( card.text.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) )
					return null;
			}

			// Faction selection
			var noneSelected = true;
			var hasAFaction = false;
			$.each( options.factions, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					hasAFaction |= $factions.hasFaction(card,name);
				}
			});
			if( !(noneSelected || hasAFaction) )
				return null;

			// Type selection
			var noneSelected = true;
			$.each( options.types, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					return false;
				}
			});
			if( !(noneSelected || options.types[card.type].search) )
				return null;

			return card;
		});

	}

});

module.filter( "shipCardNamed", function($filter) {
	
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

});

module.filter( "fleetCardNamed", function($filter) {

	var shipCardNamed = $filter("shipCardNamed");

	return function( fleet, name ) {
		
		if( !fleet ) {
			return false;
		}

		var match = false;
		$.each( fleet, function(i, ship) {
			match = shipCardNamed(ship, name);
			if( match )
				return false;
		});
		
		return match;

	}

});

module.factory( "isMobile", function() {
	// From detectmobilebrowsers.com
	var userAgent = navigator.userAgent||navigator.vendor||window.opera;
	return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test( userAgent )
						||
					  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test( userAgent.substr(0,4) );
} );

module.controller( "UtopiaCtrl", function($scope, $http, $filter, cardLoader) {

	$scope.search = {
		query: "",
		unique: false,
		generic: false,
		factions: {},
		types: { "ship": {}, "captain": {}, "admiral": {} }
	};
	
	$scope.resetSearch = function() {
		$scope.search.query = "";
		$scope.search.unique = false;
		$scope.search.generic = false;
		$.each( $scope.search.factions, function(i,faction) {
			faction.search = false;
		} );
		$.each( $scope.search.types, function(i,types) {
			types.search = false;
		} );
	};
	
	$scope.$watch( "search", function() {
		$scope.resultLimit = 10;
	}, true);
	
	$scope.drag = {};

	$scope.cards = [];
	$scope.activeFleet = [];

	$scope.loading = true;
	cardLoader( $scope.cards, function() {

		$.each( $scope.cards, function(i, card) {
			if( !$scope.search.types[card.type] )
				$scope.search.types[card.type] = {};
			$.each( card.factions, function(j, faction) {
				if( !$scope.search.factions[faction] )
					$scope.search.factions[faction] = {};
			} );
				
		});
	
		$scope.$broadcast("cardsLoaded");
		$scope.loading = false;
		
	});
	
});

module.filter( "group", function() {

	return function( items, size ) {

		if( items ) {

			var arr = [];
			for( var i = 0; i < items.length; i += size ) {
				if( i + size > items.length )
					arr.push( items.slice(i) );
				else
					arr.push( items.slice(i, i+size) );
			}

			return arr;

		}

	};

});