var module = angular.module("utopia", ["ngSanitize", "utopia-card-ship", "utopia-card-upgrade", "utopia-dragdrop", "utopia-fleet-builder", "utopia-card-rules"]);

module.filter( "cardFilter", function() {

	return function( cards, options ) {

		return $.map( cards, function(card) {

			// Uniqueness options
			if( options.unique && !card.unique && !options.generic )
				return null;

			if( options.generic && card.unique && !options.unique)
				return null;

			// Text search
			if( options.query ) {
				if( card.name.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 &&
					( !card.class || card.class.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) &&
					( card.text.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) )
					return null;
			}

			// Faction selection
			var noneSelected = true;
			$.each( options.factions, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					return false;
				}
			});
			if( !(options.factions[card.faction].search || noneSelected) )
				return null;

			// Type selection
			var noneSelected = true;
			$.each( options.types, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					return false;
				}
			});
			if( !(options.types[card.type].search || noneSelected) )
				return null;

			return card;
		});

	}

});

module.filter( "shipCardNamed", function($filter) {
	
	var upgradeSlotsFilter = $filter("upgradeSlots");
	
	return function( ship, name ) {

		if( ship.name == name )
			return ship;
		
		if( ship.captain && ship.captain.name == name )
			return ship.captain;
		
		var match = false;
		$.each( upgradeSlotsFilter(ship), function(i, slot) {
			if( slot.occupant && slot.occupant.name == name ) {
				match = slot.occupant;
				return false;
			}
		});
		
		return match;

	}

});

module.filter( "fleetCardNamed", function($filter) {

	var shipCardNamed = $filter("shipCardNamed");

	return function( fleet, name ) {
		
		if( !fleet ) {
			console.log("no fleet");
			return false;
		}

		var match = false;
		$.each( fleet, function(i, ship) {
			match = shipCardNamed(ship, name);
			if( match )
				return false;
		});
		
		return match;

	}

});

module.factory( "isMobile", function() {
	// From detectmobilebrowsers.com
	var userAgent = navigator.userAgent||navigator.vendor||window.opera;
	return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test( userAgent )
						||
					  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test( userAgent.substr(0,4) );
} );

module.controller( "UtopiaCtrl", function($scope, $http, $filter, cardRules) {

	$scope.search = {
		query: "",
		unique: false,
		generic: false,
		factions: {},
		types: { "ship": {}, "captain": {}, "admiral": {} }
	};
	
	$scope.resetSearch = function() {
		$scope.search.query = "";
		$scope.search.unique = false;
		$scope.search.generic = false;
		$.each( $scope.search.factions, function(i,faction) {
			faction.search = false;
		} );
		$.each( $scope.search.types, function(i,types) {
			types.search = false;
		} );
	};
	
	$scope.$watch( "search", function() {
		$scope.resultLimit = 10;
	}, true);
	
	$scope.drag = {};

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

	$scope.cards = [];
	$scope.activeFleet = [];

	var valueOf = $filter("valueOf");
	
	$http.get( "data/data.xml" ).success( function(data) {
		var doc = $( $.parseXML(data) );

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
				faction: data.find("Faction").text().toLowerCase(),
				intercept: { ship: {}, fleet: {} },
				canJoinFleet: true
			};

			if( ship.faction == "mirror universe" ) {
				ship.faction = "mirror";
				ship.mirror = true;
			} else if(ship.faction == "species 8472")
				ship.faction = "species-8472"
			
			// Compile list of factions
			if( !$scope.search.factions[ship.faction] )
				$scope.search.factions[ship.faction] = {};

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
				if( upgrade.faction != ship.faction ) {
					var penalty = valueOf(upgrade,"factionPenalty",ship,fleet);
					console.log("penalty",penalty);
					return (cost instanceof Function ? cost(upgrade, ship, fleet, 0) : cost ) + penalty;
				}
				return cost;
			};
			
			$scope.cards.push(ship);
		});

		doc.find("Captain").each( function(i, data) {

			data = $(data);

			var captain = {
				type: "captain",
				id: data.find("Id").text(),
				name: data.find("Title").text(),
				unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
				text: convertIconTags( data.find("Ability").text() ),
				faction: data.find("Faction").text().toLowerCase(),
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

			if( captain.faction == "mirror universe" ) {
				captain.faction = "mirror";
				captain.mirror = true;
			} else if(captain.faction == "species 8472")
				captain.faction = "species-8472"

			// Filter out duplicates (xml has a dupe captains for each slot type they could add - Picard 8, Chak 5, Cal Hudson)
			// TODO Make this better - A pre-filter based on ID?
			if( captain.name == "Jean-Luc Picard" && captain.set == "71531" && captain.id != "jean_luc_picard_b_71531" )
				captain = false;
			else {
				$.each( $scope.cards, function(i, upg) {
					if( upg.type == captain.type && upg.name == captain.name && upg.set == captain.set && upg.faction == captain.faction ) {
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
			
			$scope.cards.push( captain );

		});

		doc.find("Admiral").each( function(i, data) {

			data = $(data);

			var admiral = {
				type: "admiral",
				id: data.find("Id").text(),
				name: data.find("Title").text(),
				unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
				text: convertIconTags( data.find("Ability").text() ),
				faction: data.find("Faction").text().toLowerCase(),
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

			if( admiral.faction == "mirror universe" ) {
				admiral.faction = "mirror";
				admiral.mirror = true;
			} else if(admiral.faction == "species 8472")
				admiral.faction = "species-8472"

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
			
			$scope.cards.push( admiral );

		});
		
		doc.find("Upgrade").each( function(i, data) {

			data = $(data);

			var upgrade = {
				type: data.find("Type").text().toLowerCase(),
				id: data.find("Id").text(),
				name: filterName( data.find("Title").text() ),
				unique: (data.find("Unique").text() == "Y") || (data.find("MirrorUniverseUnique").text() == "Y"),
				text: convertIconTags( data.find("Ability").text() ),
				faction: data.find("Faction").text().toLowerCase(),
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

			if( upgrade.faction == "mirror universe" ) {
				upgrade.faction = "mirror";
				upgrade.mirror = true;
			} else if(upgrade.faction == "species 8472")
				upgrade.faction = "species-8472"

			// Add spaces to range strings
			if( upgrade.range ) {
				upgrade.range = upgrade.range.replace( /(.)\-(.)/, "$1 - $2" );
			}
			
			// Add to list of types
			if( !$scope.search.types[upgrade.type] )
				$scope.search.types[upgrade.type] = {};
			
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
			
			$scope.cards.push( upgrade );

		});
		
		$scope.$broadcast("cardsLoaded");

	} );
	
});

module.filter( "group", function() {

	return function( items, size ) {

		if( items ) {

			var arr = [];
			for( var i = 0; i < items.length; i += size ) {
				if( i + size > items.length )
					arr.push( items.slice(i) );
				else
					arr.push( items.slice(i, i+size) );
			}

			return arr;

		}

	};

});