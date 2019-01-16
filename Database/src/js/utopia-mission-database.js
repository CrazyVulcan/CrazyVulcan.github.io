var module = angular.module("utopia-mission-database", ["utopia"]);

module.controller( "UtopiaMissionCtrlBackup", [ "$scope", "$filter", "cardLoader", "$factions", function($scope, $filter, cardLoader, $factions) {
	$scope.missionData = [];
	$scope.missionSets = {};
	$scope.missionList = [];

	$scope.viewer = {};
	$scope.activeSet = false;
	$scope.missionSetCards = [];
	
	cardLoader( $scope.missionData, $scope.missionSets, function() {

		var sourceID = location.hash ? location.hash.substring(1) : false;
		
		$.each( Object.keys( $scope.missionSets ), function(i, sourceID) {
			var missionSet = $scope.missionSets[sourceID];
			if( missionSet.sourceID == sourceID || missionSet.name == sourceID )
			{$scope.viewer.missionSet = missionSet;
			$scope.missionList.push(missionSet);
		};
		
	});
	
	$scope.$watch( "viewer.missionSet", function(missionSet) {
		
		$scope.missionSetCards = [];
		if( missionSet ) {
			location.hash = missionSet.sourceID;
			$.each( $scope.missionData, function(i, card) {
				if( $.inArray( missionSet.sourceID, card.missionSet ) >= 0 )
					$scope.missionSetCards.push( card );
			});
			$scope.missionSetCards.sort(displaySort);
		}
		
	} );
	
} )

}]);

//edit 1.15.19