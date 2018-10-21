var module = angular.module("utopia-mission-database", ["utopia"]);

module.controller( "UtopiamissionCtrl", [ "$scope", "$filter", "cardLoader", "$factions", function($scope, $filter, cardLoader, $factions) {

	$scope.cards = [];
	$scope.missions = {};
	$scope.missionList = [];
	$scope.shipClasses = {};
	$scope.token = {};

	$scope.viewer = {};
	$scope.activemission = false;
	$scope.missionCards = [];
	
	cardLoader( $scope.cards, $scope.missions, $scope.shipClasses, $scope.token, function() {

		var missionmission = location.hash ? location.hash.substring(1) : false;
		
		$.each( Object.keys( $scope.missions ), function(i, id) {
			var mission = $scope.missions[id];
			if( mission.id == missionmission || mission.name == missionmission )
				$scope.viewer.mission = mission;
			$scope.missionList.push(mission);
		});
		
	});
	
	$scope.$watch( "viewer.mission", function(mission) {
		
		$scope.missionCards = [];
		if( mission ) {
			location.hash = mission.id;
			$.each( $scope.cards, function(i, card) {
				if( $.inArray( mission.id, card.mission ) >= 0 )
					$scope.missionCards.push( card );
			});
			$scope.missionCards.sort(displaySort);
		}
		
	} );
	
	
	
}] );