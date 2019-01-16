var module = angular.module("utopia-card-missions", []);

module.directive( "cardMission", function() {
//debug line
	return {

		scope: {
			cardMission: "=",
			ship: "=",
			fleet: "=",
			dragStore: "=",
			dragSource: "="
		},

		templateUrl: "card-missions.html",

		controller: [ "$scope", function($scope) {

			$scope.range = function(size) {
				return new Array(size);
			};
			
			$scope.isDefined = function(value) {
				return value !== undefined;
			};
		
		}]

	};

} );