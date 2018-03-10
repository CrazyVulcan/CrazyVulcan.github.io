/*
 * grunt-utopia-data
 * https://github.com/ComaToes/staw-utopia
 *
 * Copyright (c) 2015 ComaToes
 * Licensed under the LGPLv3 license.
 */

'use strict';

var xml2js = require("xml2js");

var ignoreCards = [ "jean_luc_picard_71531", "jean_luc_picard_c_71531", "jean_luc_picard_d_71531", 
					"chakotay_b_71528", "calvin_hudson_b_71528", "calvin_hudson_c_71528", 
					"sakharov_c_71997p",
					"systems_upgrade_c_71998p", "systems_upgrade_w_71998p",
					"assault_vessel_upgrade_w_71803", "assault_vessel_upgrade_c_71803",
					"quark_weapon_71786",
				  ];
var factions = [ "Federation", "Klingon", "Romulan", "Dominion", "Borg", "Species 8472", "Kazon", "Xindi", "Bajoran", "Ferengi", "Vulcan", "Independent", "Mirror Universe", "Q Continuum" ];

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('utopia_data', 'The best Grunt plugin ever.', function() {
	
    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
		var src = f.src.filter(function(filepath) {
			// Warn on and remove invalid source files (if nonull was set).
			if (!grunt.file.exists(filepath)) {
				grunt.log.warn('Source file "' + filepath + '" not found.');
				return false;
			} else {
				return true;
			}
		});

		var out = {
			sets: [],
			ships: [],
			shipClasses: [],
			captains: [],
			admirals: [],
			upgrades: [],
			resources: [],
			others: [],
		};
	  
		src.forEach( function(file) {

			if( file.indexOf(".xml") >= 0 ) {
				console.log(file);
				parseXML( grunt, file, out );
			}

		} );

		src.forEach( function(file) {
			
			if( file.indexOf(".json") >= 0 ) {
				console.log(file);
				parseJSON( grunt, file, out );
			}

		} );
		
      // Write the destination file.
      grunt.file.write(f.dest, JSON.stringify(out));

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};

function parseXML( grunt, file, out ) {
	
	var xml = xml2js.parseString( grunt.file.read(file), {explicitArray: false}, function(err, result) {
		
		var data = result.Data;
		
		grunt.log.writeln(data.$.version);
		
		data.Sets.Set.forEach( function(data) {
			
			var set = {
				type: "set",
				id: data.$.id,
				name: data._,
				releaseDate: data.$.releaseDate,
				parentSet: data.$.overallSetName,
			};

			out.sets.push(set);
			
		});
		
		data.Ships.Ship.forEach( function(shipData) {
			
			var ship = {
				type: "ship",
				id: shipData.Id,
				set: shipData.Set.split(","),
				name: shipData.Title,
				class: shipData.ShipClass,
				classId: shipData.ShipClassDetailsId,
				actions: [],
				upgrades: [],
				attack: Number( shipData.Attack ),
				agility: Number( shipData.Agility ),
				hull: Number( shipData.Hull ),
				shields: Number( shipData.Shield ),
				cost: Number( shipData.Cost ),
				text: convertIconTags( shipData.Ability ),
				unique: (shipData.Unique == "Y") || (shipData.MirrorUniverseUnique == "Y"),
				factions: [shipData.Faction.toLowerCase()],
				intercept: { ship: {}, fleet: {} }
			};
			
			if( shipData.AdditionalFaction )
				ship.factions.push( shipData.AdditionalFaction.toLowerCase() );
			
			adjustFactions(ship);
			
			if( shipData.EvasiveManeuvers > 0 )
				ship.actions.push( "evade" );
			if( shipData.TargetLock > 0 )
				ship.actions.push( "target-lock" );
			if( shipData.Scan > 0 )
				ship.actions.push( "scan" );
			if( shipData.Battlestations > 0 )
				ship.actions.push( "battlestations" );
			if( shipData.Cloak > 0 )
				ship.actions.push( "cloak" );
			if( shipData.SensorEcho > 0 )
				ship.actions.push( "sensor-echo" );
			if( shipData.Regenerate > 0 )
				ship.actions.push( "regenerate" );
			
			for( var i = 0; i < Number( shipData.Borg ); i++ )
				ship.upgrades.push( "borg" );
			for( var i = 0; i < Number( shipData.Tech ); i++ )
				ship.upgrades.push( "tech" );
			for( var i = 0; i < Number( shipData.Weapon ); i++ )
				ship.upgrades.push( "weapon" );
			for( var i = 0; i < Number( shipData.Crew ); i++ )
				ship.upgrades.push( "crew" );
			var squadronUpgradeCount = Number( shipData.SquadronUpgrade );
			for( var i = 0; i < squadronUpgradeCount; i++ )
				ship.upgrades.push( "squadron" );

			// Mark as squadron
			ship.squadron = squadronUpgradeCount > 0 || ship.class.indexOf("Squadron") >= 0;
			
			if( ignoreCards.indexOf(ship.id) < 0 )
				out.ships.push(ship);
			
		});
		
		data.ShipClassDetails.ShipClassDetail.forEach( function(data) {
			
			var shipClass = {
				type: "ship-class",
				id: data.Id,
				name: data.Name,
				frontArc: data.FrontArc,
				rearArc: data.RearArc,
				maneuvers: {
					min: 9, max: 0,
				},
			};
			
			data.Maneuvers.Maneuver.forEach( function(maneuver) {
				
				var speed = Number( maneuver.$.speed );
				var type = maneuver.$.kind;
				var color = maneuver.$.color;
				
				if( type.indexOf("right-") == 0 ) {
					type = type.substring(6);
				} else if( type.indexOf("left-") == 0 )
					return;
				
				shipClass.maneuvers[speed] = shipClass.maneuvers[speed] || {};
				shipClass.maneuvers[speed][type] = color;
				
				if( speed < shipClass.maneuvers.min )
					shipClass.maneuvers.min = speed;
				if( speed > shipClass.maneuvers.max )
					shipClass.maneuvers.max = speed;
				
			});

			out.shipClasses.push(shipClass);
			
		});
		
		data.Captains.Captain.forEach( function(data) {
			
			var card = {
				type: "captain",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				unique: (data.Unique == "Y") || (data.MirrorUniverseUnique == "Y"),
				text: convertIconTags( data.Ability ),
				factions: [data.Faction.toLowerCase()],
				cost: Number( data.Cost ),
				skill: Number( data.Skill ),
				talents: Number( data.Talent ),
			};

			if( data.AdditionalFaction )
				card.factions.push( data.AdditionalFaction.toLowerCase() );
			
			adjustFactions(card);
			
			if( ignoreCards.indexOf(card.id) < 0 )
				out.captains.push(card);
			
		});
		
		data.Admirals.Admiral.forEach( function(data) {
			
			var card = {
				type: "admiral",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				unique: (data.Unique == "Y") || (data.MirrorUniverseUnique == "Y"),
				text: convertIconTags( data.AdmiralAbility ),
				factions: [data.Faction.toLowerCase()],
				cost: Number( data.AdmiralCost ),
				skill: Number( data.SkillModifier ),
				talents: Number( data.AdmiralTalent ),
			};

			if( data.AdditionalFaction )
				card.factions.push( data.AdditionalFaction.toLowerCase() );
			
			adjustFactions(card);
			
			if( ignoreCards.indexOf(card.id) < 0 )
				out.admirals.push(card);
			
		});
		
		data.Upgrades.Upgrade.forEach( function(data) {
			
			var card = {
				type: data.Type.toLowerCase(),
				id: data.Id,
				set: data.Set.split(","),
				name: filterName(data.Title),
				unique: (data.Unique == "Y") || (data.MirrorUniverseUnique == "Y"),
				text: convertIconTags( data.Ability ),
				factions: [data.Faction.toLowerCase()],
				cost: Number( data.Cost ),
				skill: Number( data.Skill ),
				talents: Number( data.Talent ),
				attack: Number( data.Attack ),
				range: data.Range,
			};

			if( data.AdditionalFaction )
				card.factions.push( data.AdditionalFaction.toLowerCase() );
			
			adjustFactions(card);
			
			if( card.range )
				card.range = card.range.trim().replace( /(.)\-(.)/, "$1 - $2" );
			
			if( ignoreCards.indexOf(card.id) < 0 )
				out.upgrades.push(card);
			
		});
		
		data.Resources.Resource.forEach( function(data) {
			
			var card = {
				type: "resource",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				text: convertIconTags( data.Ability ),
				cost: Number( data.Cost ),
				showShipResourceSlot: false,
			};

			out.resources.push(card);
			
		});
		
		data.FleetCaptains.FleetCaptain.forEach( function(data) {
			
			var card = {
				type: "fleet-captain",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				factions: [data.Faction.toLowerCase()],
				text: convertIconTags( data.Ability ),
				cost: Number( data.Cost ),
				skill: Number( data.CaptainSkillBonus ),
				upgradeSlots: [],
				isSkillModifier: true,
				showType: true,
				canEquip: true,
				intercept: { ship: {}, fleet: {} },
				factionPenalty: 0,
				unique: true,
				talentAdd: Number( data.TalentAdd ),
				techAdd: Number( data.TechAdd ),
				weaponAdd: Number( data.WeaponAdd ),
				crewAdd: Number( data.CrewAdd ),
			};

			out.others.push(card);
			
		});
		
		data.Officers.Officer.forEach( function(data) {
			
			var card = {
				type: "officer",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				factions: [data.Faction.toLowerCase()],
				text: convertIconTags( data.Ability ),
				cost: Number( data.Cost ),
				upgradeSlots: [],
				showType: true,
				canEquip: true,
				canEquipFaction: true,
				intercept: { ship: {}, fleet: {} },
				factionPenalty: 0,
				unique: true,
			};
			
			card.upgradeSlots.push( { type: ["crew"], source: "Crew to be assigned as "+card.name } );

			out.others.push(card);
			
		});
		
		data.Flagships.Flagship.forEach( function(data) {
			
			var card = {
				type: "flagship",
				id: data.Id,
				set: data.Set.split(","),
				name: data.Title,
				class: "Flagship",
				factions: [data.Faction.toLowerCase()],
				text: convertIconTags( data.Ability ),
				cost: 10,
				actions: [],
				upgrades: [],
				upgradeSlots: [],
				attack: Number( data.Attack ),
				agility: Number( data.Agility ),
				hull: Number( data.Hull ),
				shields: Number( data.Shield ),
				showType: true,
				canEquip: true,
				canEquipFaction: true,
				isShipModifier: true,
				intercept: { ship: {}, fleet: {} },
				factionPenalty: 0,
				unique: true,
			};
			
			if( data.EvasiveManeuvers > 0 )
				card.actions.push( "evade" );
			if( data.TargetLock > 0 )
				card.actions.push( "target-lock" );
			if( data.Scan > 0 )
				card.actions.push( "scan" );
			if( data.Battlestations > 0 )
				card.actions.push( "battlestations" );
			if( data.Cloak > 0 )
				card.actions.push( "cloak" );
			if( data.SensorEcho > 0 )
				card.actions.push( "sensor-echo" );
			if( data.Regenerate > 0 )
				card.actions.push( "regenerate" );

			for( var i = 0; i < Number( data.Talent ); i++ ) {
				card.upgrades.push( { type: ["talent"], source: "Flagship" } );
				card.upgradeSlots.push( { type: ["talent"], source: "Flagship" } );
			}
			for( var i = 0; i < Number( data.Tech ); i++ ) {
				card.upgrades.push( { type: ["tech"], source: "Flagship" } );
				card.upgradeSlots.push( { type: ["tech"], source: "Flagship" } );
			}
			for( var i = 0; i < Number( data.Weapon ); i++ ) {
				card.upgrades.push( { type: ["weapon"], source: "Flagship" } );
				card.upgradeSlots.push( { type: ["weapon"], source: "Flagship" } );
			}
			for( var i = 0; i < Number( data.Crew ); i++ ) {
				card.upgrades.push( { type: ["crew"], source: "Flagship" } );
				card.upgradeSlots.push( { type: ["crew"], source: "Flagship" } );
			}
			
			out.others.push(card);
			
		});
		
		factions.forEach( function(faction) {
			
			var faction = {
				type: "faction",
				id: "faction_" + faction.toLowerCase().replace(/ /g,"_"),
				showType: true,
				name: faction,
				factions: [faction.toLowerCase().replace(/ /g,"-")],
				text: "This card represents the " + faction + " faction and is used with the Officer Exchange Program Resource.",
				cost: 0,
				unique: true,
				canEquip: true,
				canEquipFaction: true,
				intercept: { ship: {}, fleet: {} },
			}
			
			out.others.push(faction);
			
		});
		
	} );
			
	
}

function convertIconTags(str) {
	str = str.replace( /attack:? \[target lock\]/ig, "ATTACK: (Target Lock)" );
	str = str.replace( /\[hit\]/ig, "[hit]" );
	str = str.replace( /\[crit(ical)?( hit)?\]/ig, "[crit]" );
	str = str.replace( /\[eva(de|sive|sion)( maneuvers)?\]/ig, "[evade]" );
	str = str.replace( /\[target ?lock\]/ig, "[target-lock]" );
	str = str.replace( /\[scan\]/ig, "[scan]" );
	str = str.replace( /\[battle ?stations?\]/ig, "[battlestations]" );
	str = str.replace( /\[cloak\]/ig, "[cloak]" );
	str = str.replace( /\[sensor ?echo\]/ig, "[sensor-echo]" );
	str = str.replace( /\[regenerate\]/ig, "[regenerate]" );
	str = str.replace( /\[(elite )?talent\]/ig, "[talent]" );
	str = str.replace( /\[elite]/ig, "[talent]" );
	str = str.replace( /\[crew\]/ig, "[crew]" );
	str = str.replace( /\[tech\]/ig, "[tech]" );
	str = str.replace( /\[weapon\]/ig, "[weapon]" );
	str = str.replace( /\[borg\]/ig, "[borg]" );
	str = str.replace( /\[straight\]/ig, "[forward]" );
	str = str.replace( /\[([1-9]) forward\]/ig, "$1 [forward]" );
	str = str.replace( /\[reverse\]/ig, "[reverse]" );
	str = str.replace( /\[reverse direction\]/ig, "[come-about]" );
	str = str.replace( /\[double hit\]/ig, "[hit][hit]" );
	return str;
}

function filterName(name) {
	// Remove ship name additions to some photon torps
	return name.replace( / \(.* Bonus\)/i, "" );
}

function adjustFactions(card) {

	for( var i = 0; i < card.factions.length; i++ ) {
		card.factions[i] = card.factions[i].replace(/ /g,"-");
	}
	
}

// Any cards defined in .json overwrite .xml cards
function addToList( item, list ) {

	if( item.id )
		for( var i = 0; i < list.length; i++ )
			if( list[i].id == item.id ) {
				console.log("Overwriting duplicate:",item.type,item.id);
				list[i] = item;
				return;
			}

	list.push(item);
	
}

function parseJSON( grunt, file, out ) {
	
	var data = JSON.parse( grunt.file.read(file) );
	
	Object.keys(data).forEach( function(key) {
		data[key].forEach( function(item) {
			addToList( item, out[key] );
		});
	});
	
}