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
		str = str.replace( /\[crew\]/ig, "[crew]" );
		str = str.replace( /\[tech\]/ig, "[tech]" );
		str = str.replace( /\[weapon\]/ig, "[weapon]" );
		str = str.replace( /\[borg\]/ig, "[borg]" );
		str = str.replace( /\[straight\]/ig, "[forward]" );
		str = str.replace( /\[reverse\]/ig, "[reverse]" );
		return str;
	}

	function filterName(name) {
		// Remove ship name additions to some photon torps
		return name.replace( / \(.* Bonus\)/i, "" );
	}
	
	return {
	
		loadCards: function( loadShip, loadCaptain, loadAdmiral, loadUpgrade, callback ) {
			
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
						if( ship.factions[i] == "mirror universe" ) {
							ship.factions[i] = "mirror";
							ship.mirror = true;
						} else if(ship.factions[i] == "species 8472")
							ship.factions[i] = "species-8472"
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
					}

					var additionalFaction = data.find("AdditionalFaction").text().toLowerCase();
					if( additionalFaction )
						captain.factions.push(additionalFaction);

					for( var i = 0; i < captain.factions.length; i++ ) {
						if( captain.factions[i] == "mirror universe" ) {
							captain.factions[i] = "mirror";
							captain.mirror = true;
						} else if(captain.factions[i] == "species 8472")
							captain.factions[i] = "species-8472"
					}

					// Filter out duplicates (xml has a dupe captains for each slot type they could add - Picard 8, Chak 5, Cal Hudson)
					var ignore = [ "jean_luc_picard_71531", "jean_luc_picard_c_71531", "jean_luc_picard_d_71531", "chakotay_b_71528", "calvin_hudson_b_71528", "calvin_hudson_c_71528" ];
					if( $.inArray( captain.id, ignore ) >= 0 )
						return false;

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
						if( admiral.factions[i] == "mirror universe" ) {
							admiral.factions[i] = "mirror";
							admiral.mirror = true;
						} else if(admiral.factions[i] == "species 8472")
							admiral.factions[i] = "species-8472"
					}

					loadAdmiral(admiral);

				});
				
				doc.find("Upgrade").each( function(i, data) {

					data = $(data);

					var upgrade = {
						type: data.find("Type").text().toLowerCase(),
						id: data.find("Id").text(),
						name: filterName( data.find("Title").text() ),
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
						if( upgrade.factions[i] == "mirror universe" ) {
							upgrade.factions[i] = "mirror";
							upgrade.mirror = true;
						} else if(upgrade.factions[i] == "species 8472")
							upgrade.factions[i] = "species-8472"
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
				
				if(callback)
					callback();

			} );
		
		}
	
	}
	
	
});