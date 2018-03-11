var module = angular.module("utopia-tts-export", []);
console.log("I Am Here")
module.directive( "tabeltopSimExport", function() {

	return {

		scope: {
			fleet: "=",
			sets: "=",
			searchOptions: "="
		},

		templateUrl: "tts-export.html",
		
		link: function(scope,element) {
			
			$(element).find("textarea").focus(function() {
				$this = $(this);
				
				$this.select();
				
				window.setTimeout(function() {
					$this.select();
				}, 1);
				
				// Work around WebKit's little problem
				$this.mouseup(function() {
					// Prevent further mouseup intervention
					$this.unbind("mouseup");
					return false;
				});
			});
			
		},

		controller: [ "$scope", "$filter", function($scope, $filter) {
			
			$scope.fleetText = "";
			$scope.showSetNames = false;
			
			var valueOf = $filter("valueOf");
			
			$scope.$watch( "fleet", function(fleet) {
				fleetToText(fleet);
			}, true );
			
			function fleetToText(fleet) {
				
				var fleetText = "";
								
				$scope.fleetText = fleetText;
				
			}
			
			
			function cardToText(card, ship, fleet, indent, hideCost) {
								
				
				if( card.type == "resource" )
					countSlotCost = false;
				
				text += card.name;
								
				if( card.type == "ship" ) {
					// Show class name for generic ships
					text += card.unique ? "" : " ("+card.class+")";
				}

				text += "\n";
				
				if( card.resource ) {
					var res = cardToText(card.resource, ship, fleet, indent+1);
					text += res.text;
				}
								
				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var res = cardToText(slot.occupant, ship, fleet, indent+0);
						text += res.text;
						if( countSlotCost )
							cost += res.cost;
					}
				});
				
				$.each( card.upgradeSlots || [], function(i,slot) {
					if( slot.occupant ) {
						var res = cardToText(slot.occupant, ship, fleet, indent+1, !countSlotCost);
						text += res.text;
						if( countSlotCost )
							cost += res.cost;
					}
				});
				
				return { cost: cost, text: text };
			}

		}]

	};

} );