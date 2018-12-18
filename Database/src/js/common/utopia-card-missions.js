var module = angular.module("utopia-card-missions", []);

module.directive( "cardMissions", function() {
//debug line
	return {

		scope: {
			mission: "=",
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