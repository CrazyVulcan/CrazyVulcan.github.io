/*
	Parses Space Dock's data.xml and converts to JSON
*/

var module = angular.module("utopia-card-loader-spacedock", ["utopia-card-rules"]);

module.factory( "cardLoaderSpacedock", function($http, $filter, cardRules, $factions) {

	function convertIconTags(str) {
		str = str.replace( /\attack: \[target lock\]/ig, "ATTACK: (Target Lock)" );
		str = str.replace( /\[hit\]/ig, "[hit]" );
		str = str.replace( /\[crit(ical)?( hit)?\]/ig, "[crit]" );
		str = str.replace( /\[eva(de|sive|sion)( maneuvers)?\]/ig, "[evade]" );
		str = str.replace( /\[target ?lock\]/ig, "[target-lock]" );
		str = str.replace( /\[scan\]/ig, "[scan]" );
		str = str.replace( /\[battle ?stations\]/ig, "[battlestations]" );
		str = str.replace( /\[cloak\]/ig, "[cloak]" );
		str = str.replace( /\[sensor ?echo\]/ig, "[sensor-echo]" );
		str = str.replace( /\[(elite )?talent\]/ig, "[talent]" );
		str = str.replace( /\[elite]/ig, "[talent]" );
		str = str.replace( /\[crew\]/ig, "[crew]" );
		str = str.replace( /\[tech\]/ig, "[tech]" );
		str = str.replace( /\[weapon\]/ig, "[weapon]" );
		str = str.replace( /\[borg\]/ig, "[borg]" );
		str = str.replace( /\[straight\]/ig, "[forward]" );
		str = str.replace( /\[reverse\]/ig, "[reverse]" );
		str = str.replace( /\[double hit\]/ig, "[hit][hit]" );
		return str;
	}

	function filterName(name) {
		// Remove ship name additions to some photon torps
		return name.replace( / \(.* Bonus\)/i, "" );
	}

	return {

		loadCards: function( loadSet, loadShip, loadCaptain, loadAdmiral, loadUpgrade, loadResource, loadOther, callback ) {

			// Load from Space Dock data file
			$http.get( "data/data.xml" ).success( function(data) {
				var doc = $( $.parseXML(data) );

				// Load ships
				doc.find("Ship").each( function(i, data) {

					data = $(data);

					var ship = {
						type: "ship",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						class: data.find("ShipClass").text(),
						actions: [],
						upgrades: [],
						attack: Number( data.find("Attack").text() ),
						agility: Number( data.find("Agility").text() ),
						hull: Number( data.find("Hull").text() ),
						shields: Number( data.find("Shield").text() ),
						cost: Number( data.find("Cost").text() ),
						text: convertIconTags( data.find("Ability").text() ),
						unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
						factions: [data.find("Faction").text().toLowerCase()],
						intercept: { ship: {}, fleet: {} }
					};

					var additionalFaction = data.find("AdditionalFaction").text().toLowerCase();
					if( additionalFaction )
						ship.factions.push(additionalFaction);

					for( var i = 0; i < ship.factions.length; i++ ) {
						ship.factions[i] = ship.factions[i].replace(/ /g,"-");
						if( ship.factions[i] == "mirror-universe" )
							ship.mirror = true;
					}

					if( data.find("EvasiveManeuvers").text() == "1" )
						ship.actions.push( "evade" );
					if( data.find("TargetLock").text() == "1" )
						ship.actions.push( "target-lock" );
					if( data.find("Scan").text() == "1" )
						ship.actions.push( "scan" );
					if( data.find("Battlestations").text() == "1" )
						ship.actions.push( "battlestations" );
					if( data.find("Cloak").text() == "1" )
						ship.actions.push( "cloak" );
					if( data.find("SensorEcho").text() == "1" )
						ship.actions.push( "sensor-echo" );
					if( data.find("Regenerate").text() == "1" )
						ship.actions.push( "regenerate" );

					for( var i = 0; i < Number( data.find("Borg").text() ); i++ )
						ship.upgrades.push( "borg" );
					for( var i = 0; i < Number( data.find("Tech").text() ); i++ )
						ship.upgrades.push( "tech" );
					for( var i = 0; i < Number( data.find("Weapon").text() ); i++ )
						ship.upgrades.push( "weapon" );
					for( var i = 0; i < Number( data.find("Crew").text() ); i++ )
						ship.upgrades.push( "crew" );
					var squadronUpgradeCount = Number( data.find("SquadronUpgrade").text() );
					for( var i = 0; i < squadronUpgradeCount; i++ )
						ship.upgrades.push( "squadron" );

					// Mark as squadron
					ship.squadron = squadronUpgradeCount > 0 || ship.class.indexOf("Squadron") >= 0;

					loadShip(ship);

				});

				doc.find("Captain").each( function(i, data) {

					data = $(data);

					var captain = {
						type: "captain",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
						text: convertIconTags( data.find("Ability").text() ),
						factions: [data.find("Faction").text().toLowerCase()],
						cost: Number( data.find("Cost").text() ),
						skill: Number( data.find("Skill").text() ),
						talents: Number( data.find("Talent").text() ),
						set: data.find("Set").text()
					};

					var additionalFaction = data.find("AdditionalFaction").text().toLowerCase();
					if( additionalFaction )
						captain.factions.push(additionalFaction);

					for( var i = 0; i < captain.factions.length; i++ ) {
						captain.factions[i] = captain.factions[i].replace(/ /g,"-");
						if( captain.factions[i] == "mirror-universe" )
							captain.mirror = true;
					}

					// Filter out duplicates (xml has a dupe captains for each slot type they could add - Picard 8, Chak 5, Cal Hudson)
					var ignore = [ "jean_luc_picard_71531", "jean_luc_picard_c_71531", "jean_luc_picard_d_71531", "chakotay_b_71528", "calvin_hudson_b_71528", "calvin_hudson_c_71528" ];
					if( $.inArray( captain.id, ignore ) >= 0 )
						captain = false;

					if( captain )
						loadCaptain(captain);

				});

				doc.find("Admiral").each( function(i, data) {

					data = $(data);

					var admiral = {
						type: "admiral",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
						text: convertIconTags( data.find("Ability").text() ),
						factions: [data.find("Faction").text().toLowerCase()],
						cost: Number( data.find("AdmiralCost").text() ),
						skill: Number( data.find("SkillModifier").text() ),
						talents: Number( data.find("AdmiralTalent").text() ),
						set: data.find("Set").text()
					}

					var additionalFaction = data.find("AdditionalFaction").text().toLowerCase();
					if( additionalFaction )
						admiral.factions.push(additionalFaction);

					for( var i = 0; i < admiral.factions.length; i++ ) {
						admiral.factions[i] = admiral.factions[i].replace(/ /g,"-");
						if( admiral.factions[i] == "mirror-universe" )
							admiral.mirror = true;
					}

					loadAdmiral(admiral);

				});

				doc.find("Upgrade").each( function(i, data) {

					data = $(data);

					var upgrade = {
						type: data.find("Type").text().toLowerCase(),
						id: data.find("Id").text(),
						name: filterName( data.find("Title").text() ),
						set: data.find("Set").text(),
						unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
						text: convertIconTags( data.find("Ability").text() ),
						factions: [data.find("Faction").text().toLowerCase()],
						cost: Number( data.find("Cost").text() ),
						skill: Number( data.find("Skill").text() ),
						talents: Number( data.find("Talent").text() ),
						attack: Number( data.find("Attack").text() ),
						range: data.find("Range").text().trim()
					}

					var additionalFaction = data.find("AdditionalFaction").text().toLowerCase();
					if( additionalFaction )
						upgrade.factions.push(additionalFaction);

					// TODO make this a function
					for( var i = 0; i < upgrade.factions.length; i++ ) {
						upgrade.factions[i] = upgrade.factions[i].replace(/ /g,"-");
						if( upgrade.factions[i] == "mirror-universe" )
							upgrade.mirror = true;
					}

					// Add spaces to range strings
					if( upgrade.range ) {
						upgrade.range = upgrade.range.replace( /(.)\-(.)/, "$1 - $2" );
					}

					// Skip duplicates of VHC and restore original text
					// TODO move this to rules?
					if( upgrade.name == "Vulcan High Command" ) {
							if( upgrade.id == "vulcan_high_command_2_0_71446" )
								upgrade.text = upgrade.text.replace( /Add 2 \[tech\] Upgrade/, "Add 2 Upgrade" );
							else
								return;
					}

					loadUpgrade(upgrade);

				});


				doc.find("Resource").each( function(i, data) {

					data = $(data);

					var resource = {
						type: "resource",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						text: convertIconTags( data.find("Ability").text() ),
						cost: Number( data.find("Cost").text() ),
						showShipResourceSlot: function() {return false;},
					};

					loadResource( resource );

				} );


				doc.find("FleetCaptain").each( function(i, data) {

					data = $(data);

					var fleetCaptain = {
						type: "fleet-captain",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						factions: [data.find("Faction").text().toLowerCase()],
						skill: Number( data.find("CaptainSkillBonus").text() ),
						text: convertIconTags( data.find("Ability").text() ),
						cost: Number( data.find("Cost").text() ),
						upgradeSlots: [],
						isSkillModifier: true,
						showType: true,
						canEquip: true,
						intercept: { ship: {}, fleet: {} },
						factionPenalty: 0,
						unique: true,
					};

					for( var i = 0; i < Number( data.find("TalentAdd").text() ); i++ )
						// Special talent slot, which allows a free talent if captain already has an empty talent slot
						fleetCaptain.upgradeSlots.push( { 
							type: ["talent"],
							source: "Fleet Captain (Free talent if another talent slot is empty)",
							showOnCard: true,
							intercept: {
								ship: {
									cost: function(upgrade, ship, fleet, cost) {
										var slots = $filter("upgradeSlots")(ship);
										var emptyTalentSlot = false;
										$.each(slots, function(i,slot) {
											if( slot.type.indexOf("talent") >= 0 && !slot.occupant )
												emptyTalentSlot = true;
										});
										return emptyTalentSlot ? 0 : cost;
									}
								}
							}
						} );
					for( var i = 0; i < Number( data.find("TechAdd").text() ); i++ )
						fleetCaptain.upgradeSlots.push( { type: ["tech"], source: "Fleet Captain", showOnCard: true } );
					for( var i = 0; i < Number( data.find("WeaponAdd").text() ); i++ )
						fleetCaptain.upgradeSlots.push( { type: ["weapon"], source: "Fleet Captain", showOnCard: true } );
					for( var i = 0; i < Number( data.find("CrewAdd").text() ); i++ )
						fleetCaptain.upgradeSlots.push( { type: ["crew"], source: "Fleet Captain", showOnCard: true } );

					// Add skill modifier to Captain skill evaluation
					fleetCaptain.intercept.ship.skill = function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain ) {
							skill = (skill instanceof Function ? skill(upgrade,ship,fleet,0) : skill) + fleetCaptain.skill;
						}
						return skill;
					};
					
					loadOther( fleetCaptain );

				} );

				doc.find("Officer").each( function(i, data) {

					data = $(data);

					var officer = {
						type: "officer",
						id: data.find("Id").text(),
						name: data.find("Title").text(),
						text: convertIconTags( data.find("Ability").text() ),
						cost: Number( data.find("Cost").text() ),
						factions: [data.find("Faction").text().toLowerCase()],
						unique: true,
						upgradeSlots: [],
						showType: true,
						canEquip: true,
						canEquipFaction: true,
						intercept: { ship: {}, fleet: {} },
						factionPenalty: 0,
					};
					
					officer.upgradeSlots.push( { type: ["crew"], source: "Crew to be assigned as "+officer.name } );

					loadOther( officer );

				} );
				
				doc.find("Flagship").each( function(i, data) {

					data = $(data);

					var flagship = {
						type: "flagship",
						id: data.find("Id").text(),
						class: "Flagship",
						name: data.find("Title").text(),
						text: convertIconTags( data.find("Ability").text() ),
						cost: 10,
						factions: [data.find("Faction").text().toLowerCase()],
						unique: true,
						actions: [],
						upgrades: [],
						upgradeSlots: [],
						attack: Number( data.find("Attack").text() ),
						agility: Number( data.find("Agility").text() ),
						hull: Number( data.find("Hull").text() ),
						shields: Number( data.find("Shield").text() ),
						showType: true,
						canEquip: true,
						canEquipFaction: true,
						displayAsShip: true,
						isShipModifier: true,
						factionPenalty: 0,
						intercept: { ship: {}, fleet: {} },
					};
					
					flagship.intercept.ship = {
						attack: function(card,ship,fleet,attack) {
							if( card == ship && ship.type != "flagship" )
								return (attack instanceof Function ? attack(card,ship,fleet,0) : attack) + flagship.attack;
							return attack;
						},
						agility: function(card,ship,fleet,agility) {
							if( card == ship && ship.type != "flagship" )
								return (agility instanceof Function ? agility(card,ship,fleet,0) : agility) + flagship.agility;
							return agility;
						},
						hull: function(card,ship,fleet,hull) {
							if( card == ship && ship.type != "flagship" )
								return (hull instanceof Function ? hull(card,ship,fleet,0) : hull) + flagship.hull;
							return hull;
						},
						shields: function(card,ship,fleet,shields) {
							if( card == ship && ship.type != "flagship" )
								return (shields instanceof Function ? shields(card,ship,fleet,0) : shields) + flagship.shields;
							return shields;
						},
					};
					
					if( data.find("EvasiveManeuvers").text() == "1" )
						flagship.actions.push( "evade" );
					if( data.find("TargetLock").text() == "1" )
						flagship.actions.push( "target-lock" );
					if( data.find("Scan").text() == "1" )
						flagship.actions.push( "scan" );
					if( data.find("Battlestations").text() == "1" )
						flagship.actions.push( "battlestations" );
					if( data.find("Cloak").text() == "1" )
						flagship.actions.push( "cloak" );
					if( data.find("SensorEcho").text() == "1" )
						flagship.actions.push( "sensor-echo" );
					if( data.find("Regenerate").text() == "1" )
						flagship.actions.push( "regenerate" );

					for( var i = 0; i < Number( data.find("Talent").text() ); i++ ) {
						flagship.upgrades.push( { type: ["talent"], source: "Flagship" } );
						flagship.upgradeSlots.push( { type: ["talent"], source: "Flagship" } );
					}
					for( var i = 0; i < Number( data.find("Tech").text() ); i++ ) {
						flagship.upgrades.push( { type: ["tech"], source: "Flagship" } );
						flagship.upgradeSlots.push( { type: ["tech"], source: "Flagship" } );
					}
					for( var i = 0; i < Number( data.find("Weapon").text() ); i++ ) {
						flagship.upgrades.push( { type: ["weapon"], source: "Flagship" } );
						flagship.upgradeSlots.push( { type: ["weapon"], source: "Flagship" } );
					}
					for( var i = 0; i < Number( data.find("Crew").text() ); i++ ) {
						flagship.upgrades.push( { type: ["crew"], source: "Flagship" } );
						flagship.upgradeSlots.push( { type: ["crew"], source: "Flagship" } );
					}

					loadOther( flagship );

				} );
				
				doc.find("Set").each( function(i, data) {

					data = $(data);

					var set = {
						type: "set",
						id: data.attr("id"),
						name: data.text(),
					};

					loadSet( set );

				} );
				
				if(callback)
					callback();

			} );

		}

	}


});