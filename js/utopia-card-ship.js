var module = angular.module("utopia-card-ship", []);

module.filter( "icons", function() {

	return function( text ) {
		return text.replace( /\[([^\]]*)\]/g, "<i class='fs fs-$1'></i>" ).replace( /\n/g, "<br/>" );
	};

});

module.directive( "cardShip", function() {

	return {

		scope: {
			ship: "=",
			fleet: "=",
			dragStore: "="
		},

		templateUrl: "card-ship.html",

		controller: function($scope) {

		}

	};

} );