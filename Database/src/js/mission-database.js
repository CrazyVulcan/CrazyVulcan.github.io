var module = angular.module("utopia-mission-database", ["utopia"]);

module.controller( "UtopiaMissionCtrl", [ "$scope", "$filter", "cardLoader", "$factions", function($scope, $filter, cardLoader, $factions) {

	$scope.cards = [];
	$scope.missions = {};
	$scope.missionList = [];
	$scope.shipClasses = {};
	$scope.token = {};

	$scope.viewer = {};
	$scope.activemission = false;
	$scope.missionCards = [];
	
	cardLoader( $scope.cards, $scope.missions, $scope.shipClasses, $scope.token, function() {

		var missionId = location.hash ? location.hash.substring(1) : false;
		
		$.each( Object.keys( $scope.missions ), function(i, missionSet) {
			var mission = $scope.missions[missionSet];
			if( mission.missionSet == missionId || mission.name == missionId )
				$scope.viewer.mission = mission;
			$scope.missionList.push(mission);
		});
		
	});
	
	$scope.$watch( "viewer.mission", function(mission) {
		
		$scope.missionCards = [];
		if( mission ) {
			location.hash = mission.missionSet;
			$.each( $scope.cards, function(i, card) {
				if( $.inArray( mission.missionSet, card.mission ) >= 0 )
					$scope.missionCards.push( card );
			});
			$scope.missionCards.sort(displaySort);
		}
		
	} );
	
	
	
}] );