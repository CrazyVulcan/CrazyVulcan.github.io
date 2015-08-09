var module = angular.module("utopia-search", ["utopia-card", "utopia-dragdrop", "utopia-card-loader", "utopia-card-rules"]);

module.filter( "cardFilter", [ "$factions", "$filter", function($factions, $filter) {

	return function( cards, options ) {

		var valueOf = $filter("valueOf");
	
		return $.map( cards, function(card) {

			// Uniqueness options
			if( options.unique && !card.unique && !options.generic )
				return null;

			if( options.generic && card.unique && !options.unique)
				return null;
			
			// Filter by selected expansions
			if( card.set && !options.ignoreSetsFilter && options.sets ) {
				var setSelected = false;
				$.each( card.set, function(i,id) {
					if( options.sets[id].search )
						setSelected = true;
				});
				if( !setSelected )
					return null;
			}
			
			// Custom filter
			if( options.filterField && options.filterOperator && options.filterValue ) {
				var value = valueOf(card,options.filterField);
				if( !value )
					return null;
				switch( options.filterOperator ) {
					case "<": if( value >= options.filterValue ) return null; break;
					case "<=": if( value > options.filterValue ) return null; break;
					case "=": if( value != options.filterValue ) return null; break;
					case ">=": if( value < options.filterValue ) return null; break;
					case ">": if( value <= options.filterValue ) return null; break;
				}
			}

			// Text search
			if( options.query ) {
				if( card.name.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 &&
					( !card.class || card.class.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) &&
					( card.text.toLowerCase().indexOf( options.query.toLowerCase() ) < 0 ) )
					return null;
			}

			// Type selection
			var noneSelected = true;
			$.each( options.types, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					return false;
				}
			});
			if( !(noneSelected || options.types[card.type].search) )
				return null;

			// Resources skip faction
			if( card.type == "resource" )
				return card;
			
			// Faction selection
			var noneSelected = true;
			var hasAFaction = false;
			$.each( options.factions, function(name, data) {
				if( data.search ) {
					noneSelected = false;
					hasAFaction |= $factions.hasFaction(card,name);
				}
			});
			if( !(noneSelected || hasAFaction) )
				return null;
			
			return card;
		});

	}

}]);

module.filter( "sortBy", [ "$filter", function($filter) {
	
	return function( cards, sortBy, ascending ) {
		ascending = ascending === true || ascending == "true";
		return $filter("orderBy")( cards, function(card) { 
			var value = $filter("valueOf")(card,sortBy); 
			return value || 0;
		}, !ascending );
	};
	
}]);

module.directive( "search", function() {
	
	return  {
		
		scope: {
			cards: "=",
			sets: "=",
			setList: "=",
			dragStore: "=",
			search: "=searchOptions",
			defaults: "=",
		},
		
		templateUrl: "search.html",
		
		controller: [ "$scope", "$factions", function($scope, $factions) {

			// Set initial search parameters
			$scope.search = {
				query: "",
				unique: false,
				generic: false,
				factions: {},
				types: { "ship": {}, "captain": {}, "admiral": {} },
				columns: 1,
				sortBy: "cost",
				ascending: "false",
				filterField: "",
				filterOperator: "<=",
				filterValue: "",
			};
			
			// Load search defaults
			if( $scope.defaults.search )
				angular.copy( $scope.defaults.search, $scope.search );
			else
				$scope.defaults.search = angular.copy($scope.search);
			
			// Clears search parameters
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
				$scope.search.sortBy = $scope.defaults.search.sortBy || "name";
				$scope.search.ascending = $scope.defaults.search.ascending || "true";
				$scope.search.filterField = "";
				$scope.search.filterOperator = "<=";
				$scope.search.filterValue = "";
			};
			
			// Controls search results expand/collapse
			$scope.modifySearchColumns = function(amount) {
				
				$scope.search.columns += amount;
				
				if( $scope.search.columns < 0 )
					$scope.search.columns = 0;
				
				if( $scope.search.columns > 5 )
					$scope.search.columns = 5;
				
			};
			
			// Reset result display count when search changes
			$scope.$watch( "search", function() {
				$scope.resultLimit = 10;
			}, true);
			
			// Store changes to expansions filter
			$scope.$watch( "search.sets", function(sets) {
				if( sets )
					localStorage.sets = angular.toJson( sets );
			}, true);
					
			// Construct faction list from hard-coded list
			$.each( $factions.list, function(i, faction) {
				$scope.search.factions[faction.toLowerCase().replace(/ /g,"-")] = {};
			});
			
			$scope.sortables = [
				{
					value: "name",
					name: "Name"
				},
				{
					value: "cost",
					name: "Cost"
				},
				{
					value: "attack",
					name: "Attack"
				},
				{
					value: "agility",
					name: "Agility"
				},
				{
					value: "hull",
					name: "Hull"
				},
				{
					value: "shields",
					name: "Shields"
				},
				{
					value: "skill",
					name: "Skill Value"
				}
			];
			
			$scope.$on( "cardsLoaded", function() {
				// Construct list of card types from those available
				$.each( $scope.cards, function(i, card) {
					if( !$scope.search.types[card.type] )
						$scope.search.types[card.type] = {};
				});
				
				// Load stored owned expansions
				try {
					$scope.search.sets = localStorage.sets ? angular.fromJson( localStorage.sets ) : {};
				} catch(e) {
					$scope.search.sets = {};
				}
				
				// Add new sets to filter
				$.each( $scope.sets, function(i, set) {
					if( !$scope.search.sets[set.id] ) {
						console.log("New set: " + set.name);
						$scope.search.sets[set.id] = { search: true };
					}
					$scope.setList.push( set );
				});
			});
			
		}]
		
	};
	
} );

module.directive( "searchFilterGroup", function() {
	
	return  {
		
		scope: {
			title: "@",
		},
		
		templateUrl: "search-filter-group.html",
		
		transclude: true,
		
		link: function(scope,element,attrs) {
			if( attrs.open != undefined )
				scope.showContent = true;
		},
		
	};
	
} );