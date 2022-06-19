			/////////////////////////////////////////////////////////////	
			//Trying to make it build a better URL by only listing the ship ID's concated by ship. 
			function cardToAltTextURL(card, ship, fleet) {	
				
				var text = "";
				
				if( card.type == "ship" && !card.unique) {
					// Show class ID for generic ships
					text = card.id;
				} else text = card.id;
				
				text += ",";
				if( card.resource ) {
					var resB = cardToAltTextURL(card.resource, ship, fleet);
					text += resB.text;
				}

				if( card.captain ) {
					var resB = cardToAltTextURL(card.captain, ship, fleet);
					text += resB.text;
				}

				if( card.admiral ) {
					var resB = cardToAltTextURL(card.admiral, ship, fleet);
					text += resB.text;
				}

				$.each( card.upgrades || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextURL(slot.occupant, ship, fleet);
						text += resB.text;
					}
				});

				$.each( card.upgradeSlots || [], function(i,slot) {
					if( slot.occupant ) {
						var resB = cardToAltTextURL(slot.occupant, ship, fleet);
						text += resB.text;
						// if( countSlotCost )
						// 	cost += resB.cost;
					}
				});

				return { cost: 0, text: text };
			};