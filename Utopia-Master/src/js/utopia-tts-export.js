var module = angular.module("utopia-tts-export", []);

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
			
			$scope.$watch( "showSetNames", function() {
				fleetToText($scope.fleet);
			});
			
			function fleetToText(fleet) {
				
				var fleetText = "";
				
				var totalCost = 0;
				
				$.each( fleet.ships, function(i,ship) {
					
					var res = cardToText(ship,ship,fleet);
					fleetText += res.text + "Ship Total: " + res.cost + " SP\n\n";
					totalCost += res.cost;
					
				});
				
				if( fleet.resource ) {
					var res = cardToText(fleet.resource,{},fleet);
					fleetText += "Resource: " + res.text + "\n";
					totalCost += res.cost;
				}
				
				fleetText += "Fleet Total: " + totalCost + " SP\n\n";
				
				fleetText += "Generated by Utopia\nhttp://kfnexus.github.io/staw-utopia/";
				
				$scope.fleetText = fleetText;
				
			}
			
			function getSetNames(sets) {
				var names = "";
				$.each( sets, function(i,id) {
					names += $scope.sets[id] ? $scope.sets[id].name : id;
					if( i < sets.length-1 )
						names += ", ";
				});
				return names;
			}
			
			function cardToText(card, ship, fleet, indent, hideCost) {
				
				var text = "";
				indent = indent || 0;
				for( var i = 0; i < indent; i ++ )
					text += "- ";
				
				var cost = valueOf(card,"cost",ship,fleet);
				var free = valueOf(card,"free",ship,fleet);
				var countSlotCost = true;
				
				if( card.type == "resource" )
					countSlotCost = false;
				
				text += card.name;
				
				if( card.type == "captain" )
					text += " " + card.skill + " (Captain)";
				if( card.type == "admiral" )
					text += " (Admiral)";
				if( card.type == "fleet-captain" )
					text += " Fleet Captain";
				if( card.type == "flagship" )
					text += " Flagship";
				if( card.type == "faction" )
					text += " Faction";
				
				if( card.type == "ship" ) {
					// Show class name for generic ships
					text += card.unique ? "" : " ("+card.class+")";
				} else if( $scope.showSetNames ){
					// Show set names for non-ships
					text += card.set ? " (" + getSetNames(card.set) + ")" : "";
				}
				
				// Show cost if appropriate
				if( free )
					cost = 0;
				if( !hideCost )
					text += " [" + cost + "]";
				text += "\n";
				
				if( card.resource ) {
					var res = cardToText(card.resource, ship, fleet, indent+1);
					text += res.text;
					cost += res.cost;
				}
				
				if( card.captain ) {
					var res = cardToText(card.captain, ship, fleet, indent+1);
					text += res.text;
					cost += res.cost;
				}
				
				if( card.admiral ) {
					var res = cardToText(card.admiral, ship, fleet, indent+1);
					text += res.text;
					cost += res.cost;
				}
				
				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var res = cardToText(slot.occupant, ship, fleet, indent+1);
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