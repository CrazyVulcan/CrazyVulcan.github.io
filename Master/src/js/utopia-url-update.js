			/////////////////////////////////////////////////////////////	
			//Trying to make it build a better URL by only listing the ship ID's concated by ship. 
			function cardToAltTextURL(card, ship, fleet) {	
				
				var FleetStringID = "";
				
				if( card.type == "ship") {
					// Show class ID for generic ships
					FleetStringID = card.id;
				} else FleetStringID = card.id;
				
				FleetStringID += ",";
				if( card.resource ) {
					var resB = cardToAltTextURL(card.resource, ship, fleet);
					FleetStringID += resB.FleetStringID;
				}

				if( card.captain ) {
					var resB = cardToAltTextURL(card.captain, ship, fleet);
					FleetStringID += resB.FleetStringID;
				}

				if( card.admiral ) {
					var resB = cardToAltTextURL(card.admiral, ship, fleet);
					FleetStringID += resB.FleetStringID;
				}

				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextURL(slot.occupant, ship, fleet);
						FleetStringID += resB.FleetStringID;
					}
				});

				$.each( card.upgradeSlots || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextURL(slot.occupant, ship, fleet);
						FleetStringID += resB.FleetStringID;
						// if( countSlotCost )
						// 	cost += resB.cost;
					}
				});

				return { cost: 0, FleetStringID: FleetStringID };
			};