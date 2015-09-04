var module = angular.module("utopia-card-ship-class", []);

module.directive( "cardShipClass", function() {

	return {

		scope: {
			shipClass: "=",
			fleet: "="
		},

		templateUrl: "card-ship-class.html",

		controller: [ "$scope", function($scope) {

			$scope.range = function(size) {
				return new Array(size);
			};
			
			$scope.abs = Math.abs;
			
			$scope.speeds = [];
			
			var m = $scope.shipClass.maneuvers;
			
			for( var speed = m.max; speed >= m.min; speed-- ) {
				if( speed != 0 )
					$scope.speeds.push(speed);
			}
			
			var top = true;
			while( $scope.speeds.length < 7 ) {
				if( top )
					$scope.speeds.unshift(9);
				else
					$scope.speeds.push(9);
				top = !top;
			}
		
		}]

	};

} );