var module = angular.module("utopia-fleet-export", []);

module.directive( "fleetExport", function() {

	return {

		scope: {
			fleet: "=",
			sets: "=",
			searchOptions: "="
		},

		templateUrl: "fleet-export.html",

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
			//ttsExportStyle should not load at start.
			$scope.ttsExportStyle = false;

			var valueOf = $filter("valueOf");

			$scope.$watch( "fleet", function(fleet) {
				fleetToText(fleet);
			}, true );

			$scope.$watch( "showSetNames", function() {
				fleetToText($scope.fleet);
			});

			//allow script to use ttsExportStyle

			// $scope.$watch( "fleet", function(fleet) {
			// 	fleetToText(fleet);
			// }, true );

			$scope.$watch( "exportType", function() {
				fleetToText($scope.fleet);
			});

			function fleetToText(fleet) {
				// if ($scope.ttsExportStyle) ttsToText(fleet);
				if ($scope.exportType == "fleetSheet") fleetSheet(fleet);
				else if ($scope.exportType == "tts") ttsToText(fleet);
				else {
					var fleetText = "";

					var totalCost = 0;

					fleetText += "Save your URL for easy Reloading\n\n";

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

					fleetText += "Generated by Utopia " + self.url;

					$scope.fleetText = fleetText;
				}
			}

			//ttsToText function to act independent of fleetToText
			function ttsToText(fleet) {

				var ttsText = "";

				$.each( fleet.ships, function(i,ship) {

					var res = cardToTextTTS(ship,ship,fleet);
					ttsText += res.text + "\n";
				});

				if( fleet.resource ) {
					var res = cardToTextTTS(fleet.resource,{},fleet);
					ttsText += res.text + "\n";
				}

				ttsText += "------------------------------------------\n"
				
				$.each( fleet.ships, function(i,ship) {

					var resB = cardToAltTextTTS(ship,ship,fleet);
					ttsText += resB.text + "\n";
				});
				
				if( fleet.resource ) {
					var resB = cardToAltTextTTS(fleet.resource,{},fleet);
					ttsText += resB.text + "\n";
				}
				
				ttsText += "------------------------------------------\n"
				ttsText += "Generated by Utopia for Tabletop Simulator";
				$scope.fleetText = ttsText;

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
				//Lets cut out the dead weight
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

		//################################################
		//New Block for use with Tabletop Simulator Export
			function cardToTextTTS(card, ship, fleet) {
				//console.log("You found me");

				var text = "";
				
				if( card.type == "ship" && !card.unique) {
					// Show class name for generic ships
					text = card.class;
				} else text = card.name;
						
				text += "\n";
				if( card.resource ) {
					var res = cardToTextTTS(card.resource, ship, fleet);
					text += res.text;
				}

				if( card.captain ) {
					var res = cardToTextTTS(card.captain, ship, fleet);
					text += res.text;
				}

				if( card.admiral ) {
					var res = cardToTextTTS(card.admiral, ship, fleet);
					text += res.text;
				}

				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var res = cardToTextTTS(slot.occupant, ship, fleet);
						text += res.text;
					}
				});

				$.each( card.upgradeSlots || [], function(i,slot) {
					if( slot.occupant ) {
						var res = cardToTextTTS(slot.occupant, ship, fleet);
						text += res.text;
						// if( countSlotCost )
						// 	cost += res.cost;
					}
				});
				return { cost: 0, text: text };
				cardToAltTextTTS(fleet);
			};
			/////////////////////////////////////////////////////////////	
			//Trying to see if I can make it only spit out the needed card by using the ID instead of the Name
			function cardToAltTextTTS(card, ship, fleet) {	
				
				var text = "";
				
				if( card.type == "ship" && !card.unique) {
					// Show class ID for generic ships
					text = card.id;
				} else text = card.id;
				
				text += "\n";
				if( card.resource ) {
					var resB = cardToAltTextTTS(card.resource, ship, fleet);
					text += resB.text;
				}

				if( card.captain ) {
					var resB = cardToAltTextTTS(card.captain, ship, fleet);
					text += resB.text;
				}

				if( card.admiral ) {
					var resB = cardToAltTextTTS(card.admiral, ship, fleet);
					text += resB.text;
				}

				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextTTS(slot.occupant, ship, fleet);
						text += resB.text;
					}
				});

				$.each( card.upgradeSlots || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextTTS(slot.occupant, ship, fleet);
						text += resB.text;
						// if( countSlotCost )
						// 	cost += resB.cost;
					}
				});

				return { cost: 0, text: text };
			};

			function fleetSheet(fleet) {
				var fleetData = {cost:fleet.totalCost, ships:[], resource:{}};

				$.each( fleet.ships, function(i,ship) {
					var cards = [];
					cardToFleetData(ship, ship, fleet, cards);
					cards = $.grep(cards,function(n){ return n == 0 || n });
					cards.sort(function(a,b){ return a.priority - b.priority; });
					$.each( cards, function(j, card){
						delete card['priority'];
						card.index = j;
					});
					fleetData.ships.push({cards:cards.slice(), cost:ship.totalCost});
				});

				if( fleet.resource ) {
					fleetData.resource.name = fleet.resource.name;
					fleetData.resource.cost = valueOf(fleet.resource,"cost",{},fleet);
				}

				fleetData.ships.sort(function(a,b){ return b.cost - a.cost; });

				$scope.fleetText = JSON.stringify(fleetData, null, 2);

			};

			function cardToFleetData(card, ship, fleet, card_stack) {
				var data = {name:card.name,
										type:typeConvert(card.type),
										faction:factionConvert(card.factions),
										cost:valueOf(card,"cost",ship,fleet),
										priority:0
									 };

				if (card.type == "ship" && !card.unique)
					data.name = "Generic " + card.class;

				switch(data.type){
					case "Ship":
						data.priority = 0; break;
					case "Captain":
						data.priority = 1; break;
					case "Admiral":
						data.priority = 2; break;
					default:
						data.priority = 3;
				}

				card_stack.push(data);

				if( card.resource ){
					card_stack.push(cardToFleetData(card.resource, ship, fleet, card_stack));
				}
				if( card.captain ){
					card_stack.push(cardToFleetData(card.captain, ship, fleet, card_stack));
				}
				if( card.admiral ){
					card_stack.push(cardToFleetData(card.admiral, ship, fleet, card_stack));
				}
				if(card.upgrades && card.upgrades.length > 0){
					$.each( card.upgrades, function(i,slot) {
						if( slot.occupant )
							card_stack.push(cardToFleetData(slot.occupant, ship, fleet, card_stack));
					});
				}
				if(card.upgradeSlots && card.upgradeSlots.length > 0){
					$.each( card.upgradeSlots || [], function(i,slot) {
						if( slot.occupant )
							card_stack.push(cardToFleetData(slot.occupant, ship, fleet, card_stack));
					});
				}
			};

			function factionConvert(factionList){
			  var factions = {
			    "federation":"FED",
			    "klingon":"KLI",
			    "romulan":"ROM",
			    "dominion":"DOM",
			    "borg":"BOR",
			    "species-8472":"SPE",
			    "kazon":"KAZ",
			    "xindi":"XIN",
			    "bajoran":"BAJ",
			    "ferengi":"FER",
			    "vulcan":"VUL",
			    "independent":"IND",
			    "mirror-universe":"MIR",
			    "q-continuum":"Q"
			  }
			  var updatedFactionList = [];
			  $.each( factionList, function(i, faction){
			    if(faction in factions) updatedFactionList.push(factions[faction]);
			    else console.error("Unknown Faction: " + faction);
			  });
			  return updatedFactionList.join('/');
			};

			function typeConvert(cardType){
			  var typeTable = {
			    "ship":"Ship",
			    "captain":"Captain",
			    "admiral":"A",
			    "crew":"C",
			    "talent":"E",
					"tech":"T",
			    "weapon":"W",
			    "borg":"B",
			    "squadron":"S"
			  };
				return typeTable[cardType];
			};

		}]

	};

} );
