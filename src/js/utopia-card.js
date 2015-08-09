var module = angular.module("utopia-card", ["utopia-tooltip", "utopia-card-ship", "utopia-card-upgrade", "utopia-card-resource", "utopia-dragdrop"]);

module.directive( "card", function() {
	
	return  {
		
		scope: {
			card: "=",
			ship: "=",
			fleet: "=",
			dragStore: "=",
			dragSource: "@",
		},
		
		restrict: "E",
		
		templateUrl: "card.html",
		
	};
	
} );