var module = angular.module("utopia-set-viewer", ["utopia"]);

module.controller( "UtopiaSetCtrl", [ "$scope", "$filter", "cardLoader", "$factions", function($scope, $filter, cardLoader, $factions) {

	$scope.cards = [];
	$scope.sets = {};
	$scope.setList = [];
	$scope.shipClasses = {};

	$scope.viewer = {};
	$scope.activeSet = false;
	$scope.setCards = [];
	
	cardLoader( $scope.cards, $scope.sets, $scope.shipClasses, function() {

		var setId = location.hash ? location.hash.substring(1) : false;
		
		$.each( Object.keys( $scope.sets ), function(i, id) {
			var set = $scope.sets[id];
			console.log( set.id );
			if( set.id == setId || set.name == setId )
				$scope.viewer.set = set;
			$scope.setList.push(set);
		});
		
	});
	
	$scope.$watch( "viewer.set", function(set) {
		
		$scope.setCards = [];
		if( set ) {
			$.each( $scope.cards, function(i, card) {
				if( $.inArray( set.id, card.set ) >= 0 )
					$scope.setCards.push( card );
			});
		}
		
	} );
	
}] );