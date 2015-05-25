/*
	Provides definitions for new cards that aren't yet in Space Dock's data.xml
	All rules are still in utopia-card-rules
*/
var module = angular.module("utopia-card-loader-supplemental", ["utopia-card-rules"]);

module.factory( "cardLoaderSupplemental", function($http, $filter, cardRules, $factions) {
	
	return {
		
		loadCards: function( loadShip, loadCaptain, loadAdmiral, loadUpgrade, loadResource ) {
			
			var data = [

				{
					id: "71799",
					
					name: "Kyana Prime Expansion",
					
					cards: [
					
						{
							type: "ship",
							name: "Kyana Prime",
							class: "Krenim Weapon Ship",
							text: "ACTION: Roll 3 defense dice. For every [evade] result, place 1 [evade] Token beside your ship.",
							factions: ["independent","mirror"],
							unique: true,
							attack: 4,
							agility: 1,
							hull: 6,
							shields: 4,
							actions: ["target-lock","scan","battlestations"],
							upgrades: ["tech","tech","weapon","weapon"],
							cost: 30
						},
						
						{
							type: "captain",
							name: "Annorax",
							text: "Add 1 [tech] Upgrade slot to your Upgrade Bar.\n\nIf Annorax is assinged to a Krenim weapon ship, any time you roll dice, for any reason, you may disable 1 of your Upgrades to choose one of those dice and re-roll it.",
							factions: ["independent","mirror"],
							unique: true,
							skill: 8,
							talents: 1,
							cost: 5
						},
						
						{
							type: "captain",
							name: "Obrist",
							text: "At the start of the game, place 1 Mission Token on this card.\n\nACTION: If you performed a Green Maneuver this round, discard the Mission Token from this card and 1 of your [weapon] Upgrades to target a ship at Range 1-3. You cannot attack or be attacked by that ship this round. You cannot perform any free Actions this round.",
							factions: ["independent","mirror"],
							unique: true,
							skill: 4,
							talents: 0,
							cost: 3
						},
						
						{
							type: "talent",
							name: "Causality Paradox",
							text: "ACTION: Discard this card to target a ship at Range 1-3. Discard 1 Upgrade of your choice on the target ship. Then remove 1 Disabled Upgrade Token from 1 of your Upgrades, if possible.\n\nThis upgrade may only be purchased for Annorax or any other Krenim Captain assigned to a Krenim weapon ship.",
							factions: ["independent","mirror"],
							unique: true,
							cost: 5
						},
					
						{
							type: "weapon",
							name: "Chroniton Torpedoes",
							text: "ATTACK: (Target Lock) Spend your target lock and disable this card to perform this attack.\n\nAll damage inflicted by this attack ignores the opposing ship's Shields.\n\nYou may fire this weapon from your forward or rear firing arcs. This Upgrade costs +5 SP for any ship other than a Krenim weapon ship.",
							factions: ["independent","mirror"],
							cost: 6,
							range: "2 - 3",
							attack: 5
						},
						
						{
							type: "weapon",
							name: "Temporal Incursion",
							text: "ATTACK: (Target Lock) Spend your target lock and disable this card to perform this attack.\n\n In addition to normal damage, for every uncancelled [crit] result, discard 1 Upgrade at random on the target ship. Then for every uncancelled [hit] result, disable 1 Upgrade at random on the target ship. This Upgrade may only be purchased for a Krenim weapon ship.",
							factions: ["independent","mirror"],
							cost: 9,
							range: "3",
							attack: 8
						},
						
						{
							type: "tech",
							name: "Temporal Wave Front",
							text: "ACTION: Discard this card to target every ship in your forward firing arc within Range 1-3. Each target ship must roll 3 defense dice. For every blank result a ship rolls, that ship must disable 1 of its cards at random (Captain, Admiral, or Upgrade card).\n\nThis Upgrade may only be purchased for a Krenim weapon ship.",
							factions: ["independent","mirror"],
							unique: true,
							cost: 6
						},
						
						{
							type: "tech",
							name: "Temporal Core",
							text: "ACTION: Disable this card to perform this Action. When defending this round, all ships roll -2 attack dice against your ship until the End Phase. This Action cannot reduce an attack below 1 attack die. You cannot perform any free Actions this round.\n\nThis Upgrade may only be purchased for a Krenim weapon ship.",
							factions: ["independent","mirror"],
							cost: 6
						},
						
						{
							type: "tech",
							name: "Spatial Distortion",
							text: "ACTION: Discard this card to remove your ship from the play area and discard all Tokens that are beside your ship except for Auxiliary Power Tokens. During the End Phase, place your ship back in the play area. You cannot place your ship within Range 1-3 of any enemy ship.\n\nThis Upgrade may only be purchased for a Krenim weapon ship.",
							factions: ["independent","mirror"],
							cost: 6
						},
					
					]
					
				},
			
				{
					id: "71800",
					
					name: "I.S.S. Avenger Expansion",
					
					cards: [
					
						{
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
						},
						
						{
							type: "admiral",
							name: "Black",
							text: "FLEET ACTION: Perform a [sensor-echo] Action with a 1 [forward] Maneuver Template, even if your ship is not cloaked or does not have the [sensor-echo] icon on its Action Bar. Each time you defend this round, during the Modify Defense Dice step, tou may re-roll one of your blank results. PLace an Auxiliary Power Token beside your ship.",
							factions: ["mirror"],
							unique: true,
							skill: 1,
							talents: 1,
							cost: 3
						},
						
						{
							type: "admiral",
							name: "Gardner",
							text: "FLEET ACTION: When attacking with your Primary Weapon, during the Roll Attack Dice step, gain +1 attach die this round. Each time you defend this round, during the Roll Defense Dice step, roll -1 defense die. You cannot perform any free Actions this round.",
							factions: ["mirror"],
							unique: true,
							skill: 0,
							talents: 0,
							cost: 2
						},
						
						{
							type: "captain",
							name: "Soval",
							text: "You do not pay a faction penalty when deploying any Upgrades to your ship.",
							factions: ["mirror"],
							unique: true,
							skill: 4,
							talents: 1,
							cost: 3
						},
						
						{
							type: "talent",
							name: "Sabotage",
							text: "ACTION: Discard this card to target a ship at Range 1-3. Target ship must disable 2 Active Shields, if possible. If the target ship has no Active Shields or if this Action causes the target ship to have no Active Shields, place and Auxiliary Power Token beside the target ship.",
							factions: ["mirror"],
							unique: true,
							cost: 3
						},
						
						{
							type: "crew",
							name: "Orion Tactical Officer",
							text: "If you damage an opponent's Hull with a [crit], you may immediately discard this card to search the Damage Deck for a \"Weapons Malfunction\" or a \"Munitions Failure\" card instead of drawing a random Damage Card. Re-shuffle the Damage Deck when you are done. No ship may be equipped with more than one \"Orion Tactical Officer\" Upgrade.",
							factions: ["mirror"],
							cost: 2
						},
						
						{
							type: "crew",
							name: "Andorian Helmsman",
							text: "During the Combat Phase, after you complete your attack, you may discard this card to immediately perform a 1 or 2 Maneuver (straight or back). If you do so, place an Auxiliary Power Token beside your ship. No ship may be equipped with more than one \"Andorian Helmsman\" Upgrade.",
							factions: ["mirror"],
							cost: 2
						},
						
						{
							type: "weapon",
							name: "Photonic Torpedoes",
							text: "ATTACK: (Target Lock) Spend your target lock and disable this card to perform this attack. You may fire this weapon from your forward or rear firing arcs.",
							factions: ["mirror"],
							cost: 2,
							range: "2 - 3",
							attack: 4
						},
						
						{
							type: "weapon",
							name: "Plasma Cannons",
							text: "ATTACK: Disable this card to perform this attack. You may fire this weapon from your forward or rear firing arcs.",
							factions: ["mirror"],
							cost: 2,
							range: "1 - 3",
							attack: 3
						},
						
						{
							type: "tech",
							name: "Emergency Bulkheads",
							text: "ACTION: Disable this card to flip all critical damage cards assigned to your ship face down. If your ship is not cloaked and you have no Active Shields, each time you defend this round, roll +1 defense die.",
							factions: ["mirror"],
							cost: 4
						},
						
						{
							type: "tech",
							name: "Enhanced Hull Plating",
							text: "During the Roll Defense Dice step of the Combat Phase, if your ship is not Cloaked and you have no Active Shields, you may add up to 2 [evade] results to your defense roll. If you do so, place 1 Auxiliary Power Token beside your ship for each [evade] result you added with this Upgrade. This Upgrade may only be purchased for a Mirror Universe ship with a Hull value of 4 or less. You cannot deploy more than 1 Enhanced Hull Plating [tech] Upgrade to any ship.",
							factions: ["mirror"],
							cost: 4
						}

						
					]
					
				},

			
			];
			
			
			$.each( data, function(i, set) {
				$.each( set.cards || [], function(i,card) {
					card.set = set.id;
					card.id = card.id || (card.name.toLowerCase().replace(/[^a-z]+/g,"_") + "_" + set.id);
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