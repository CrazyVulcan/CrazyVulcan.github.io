/*
	Provides definitions for new cards that aren't yet in Space Dock's data.xml
	All rules are still in utopia-card-rules
*/
var module = angular.module("utopia-card-loader-supplemental", ["utopia-card-rules"]);

module.factory( "cardLoaderSupplemental", function($http, $filter, cardRules, $factions) {
	
	return {
		
		loadCards: function( loadShip, loadCaptain, loadAdmiral, loadUpgrade ) {
			
			var data = [
			
				{
					id: "71800",
					
					// TODO set data
					
					cards: [
					
						{
							id: "i_s_s_avenger_71800",
							type: "ship",
							name: "I.S.S. Avenger",
							class: "Terran NX Class",
							text: "During the Roll Attack Dice step, if there is an Auxiliary Power Token beside your ship, gain +2 attack dice when attacking with your Primary Weapon.",
							factions: ["mirror"],
							unique: true,
							attack: 2,
							agility: 3,
							hull: 3,
							shields: 0,
							actions: ["evade","target-lock","scan","battlestations"],
							upgrades: ["tech","weapon","crew","crew"],
							cost: 16
						}
						
					]
					
				}
			
			];
			
			
			$.each( data, function(i, set) {
				$.each( set.cards || [], function(i,card) {
					card.set = set.id;
					switch( card.type ) {
						case "ship": loadShip(card); break;
						case "captain": loadCaptain(card); break;
						case "admiral": loadAdmiral(card); break;
						default: loadUpgrade(card)
					}
				});
			});
			
		}
		
	}
	
});