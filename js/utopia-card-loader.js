var module = angular.module("utopia-card-loader", ["utopia-card-rules"]);

module.factory( "cardLoader", function($http, $filter, cardRules, $factions) {

	function convertIconTags(str) {
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
	
	var valueOf = $filter("valueOf");

	return function(cards, callback) {
		
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
					intercept: { ship: {}, fleet: {} },
					canJoinFleet: true
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
					ship.actions.push( { name: "evade", source: "ship" } );
				if( data.find("TargetLock").text() == "1" )
					ship.actions.push( { name: "target-lock", source: "ship" } );
				if( data.find("Scan").text() == "1" )
					ship.actions.push( { name: "scan", source: "ship" } );
				if( data.find("Battlestations").text() == "1" )
					ship.actions.push( { name: "battlestations", source: "ship" } );
				if( data.find("Cloak").text() == "1" )
					ship.actions.push( { name: "cloak", source: "ship" } );
				if( data.find("SensorEcho").text() == "1" )
					ship.actions.push( { name: "sensor-echo", source: "ship" } );
				if( data.find("Regenerate").text() == "1" )
					ship.actions.push( { name: "regenerate", source: "ship" } );

				for( var i = 0; i < Number( data.find("Borg").text() ); i++ )
					ship.upgrades.push( { type: ["borg"], source: "ship" } );
				for( var i = 0; i < Number( data.find("Tech").text() ); i++ )
					ship.upgrades.push( { type: ["tech"], source: "ship" } );
				for( var i = 0; i < Number( data.find("Weapon").text() ); i++ )
					ship.upgrades.push({ type: ["weapon"], source: "ship" } );
				for( var i = 0; i < Number( data.find("Crew").text() ); i++ )
					ship.upgrades.push( { type: ["crew"], source: "ship" } );
				var squadronUpgradeCount = Number( data.find("SquadronUpgrade").text() );
				for( var i = 0; i < squadronUpgradeCount; i++ )
					ship.upgrades.push( { type: ["squadron"], source: "ship" } );
				
				// Mark as squadron
				ship.squadron = squadronUpgradeCount > 0 || ship.class.indexOf("Squadron") >= 0;
				
				// Add squadron equip rule
				// TODO Player can remove ship with hull > 3 after this check
				if( ship.squadron ) {
					ship.canJoinFleet = function(ship,ship2,fleet) {
						var numShipsHull4Plus = 0;
						var numSquadrons = 0;
						$.each(fleet,function(i,ship) {
							if( ship.squadron )
								numSquadrons++;
							else if( ship.hull >= 4 )
								numShipsHull4Plus++;
						});
						return numShipsHull4Plus > numSquadrons;
					};
				}
				
				// Apply specific card rules
				if( cardRules[ship.type+":"+ship.id] )
					$.extend( true, ship, cardRules[ship.type+":"+ship.id] );

				// Add faction penalties to cost calculation
				var costIntercept = ship.intercept.ship.cost;
				ship.intercept.ship.cost = function(upgrade, ship, fleet, cost) {
					if( costIntercept )
						cost = costIntercept(upgrade, ship, fleet, cost);
					if( !$factions.match( upgrade, ship ) ) {
						var penalty = valueOf(upgrade,"factionPenalty",ship,fleet);
						console.log("penalty",penalty);
						return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost ) + penalty;
					}
					return cost;
				};
				
				cards.push(ship);
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
					set: data.find("Set").text(),
					factionPenalty: 1,
					intercept: { ship: {}, fleet: {} },
					canEquip: true,
					canEquipCaptain: true,
					canEquipFaction: true
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
				// TODO Make this better - A pre-filter based on ID?
				if( captain.name == "Jean-Luc Picard" && captain.set == "71531" && captain.id != "jean_luc_picard_b_71531" )
					captain = false;
				else {
					$.each( cards, function(i, upg) {
						if( upg.type == captain.type && upg.name == captain.name && upg.set == captain.set && upg.factions == captain.factions ) {
							captain = false;
						}
					});
				}
				
				if( !captain )
					return;
				
				// Add talent slots
				captain.upgradeSlots = [];
				for( var i = 0; i < captain.talents || 0; i++ )
					captain.upgradeSlots.push( { type: ["talent"], source: captain.name } );

				// Apply specific card rules
				if( cardRules[captain.type+":"+captain.id] )
					$.extend( true, captain, cardRules[captain.type+":"+captain.id] );
				
				cards.push( captain );

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
					set: data.find("Set").text(),
					factionPenalty: 3,
					intercept: { ship: {}, fleet: {} },
					canEquip: true,
					canEquipAdmiral: true,
					canEquipFaction: true
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

				// Add talent slots
				admiral.upgradeSlots = [];
				for( var i = 0; i < admiral.talents || 0; i++ )
					admiral.upgradeSlots.push( { type: ["talent"], source: admiral.name } );

				// Add skill modifier to Captain skill evaluation
				admiral.intercept.ship.skill = function(upgrade,ship,fleet,skill) {
					if( upgrade == ship.captain ) {
						skill = (skill instanceof Function ? skill(upgrade,ship,fleet,0) : skill) + admiral.skill;
					}
					return skill;
				};

				// Apply specific card rules
				if( cardRules[admiral.type+":"+admiral.id] )
					$.extend( true, admiral, cardRules[admiral.type+":"+admiral.id] );
				
				cards.push( admiral );

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
					range: data.find("Range").text().trim(),
					factionPenalty: 1,
					intercept: { ship: {}, fleet: {} },
					canEquip: true,
					canEquipFaction: true
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
				
				// Apply specific card rules
				if( cardRules[upgrade.type+":"+upgrade.id] )
					$.extend( true, upgrade, cardRules[upgrade.type+":"+upgrade.id] );
				
				cards.push( upgrade );

			});
			
			if(callback)
				callback();

		} );
	
	};

});