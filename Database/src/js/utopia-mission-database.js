var module = angular.module("utopia-mission-database", ["utopia"]);

module.controller( "UtopiaMissionCtrlBackup", [ "$scope", "$filter", "cardLoader", "$factions", function($scope, $filter, cardLoader, $factions) {

	$scope.missionData = [];
	$scope.missions = {};
	$scope.missionList = [];

	$scope.viewer = {};
	$scope.activemission = false;
	$scope.missionCards = [];
	
	cardLoader( $scope.missionData, $scope.missions, function() {

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
			$.each( $scope.mission.Data, function(i, missionInfo) {
				if( $.inArray( mission.missionSet, missionInfo.mission ) >= 0 )
					$scope.missionCards.push( missionInfo );
			});
			$scope.missionCards.sort(displaySort);
		}
		
	} );
	
	
	
}] );