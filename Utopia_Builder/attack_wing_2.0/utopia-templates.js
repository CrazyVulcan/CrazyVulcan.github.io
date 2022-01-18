angular.module('utopia').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('fleet-builder.html',
    "<div class=\"fleet-open-export\" ng-show=\"!searchOptions.showExport\">\n" +
    "	<button class=\"fleet-search-bigger\" ng-click=\"searchOptions.showExport = true\"><i class=\"fa fa-chevron-left\"></i> Export</button>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"fleet-open-search\" ng-show=\"searchOptions.columns < 1\">\n" +
    "	<button class=\"fleet-search-bigger\" ng-click=\"searchOptions.columns = 1\">Search <i class=\"fa fa-chevron-right\"></i></button>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"fleet-ship-container\" ng-repeat=\"ship in fleet.ships track by $index\">\n" +
    "\n" +
    "	<div class=\"fleet-ship-top\">\n" +
    "		<div class=\"fleet-ship-top-left\" ng-class=\"{'fleet-ship-top-left-first':$first}\"></div>\n" +
    "		<div class=\"fleet-ship-title font-staw\" ng-class=\"{'fleet-ship-title-long': ship.name.length >= 18, 'fleet-ship-title-longer': ship.name.length >= 21}\">{{ ship.name }}</div>\n" +
    "		<div class=\"fleet-ship-top-spacer\"></div>\n" +
    "		<div class=\"fleet-ship-title fleet-ship-cost font-staw\">{{ getTotalCost(ship,fleet) }} SP</div>\n" +
    "		<div class=\"fleet-ship-top-spacer\"></div>\n" +
    "		<div class=\"fleet-ship-top-spacer\"></div>\n" +
    "		<div class=\"toggle-button-value pull-left\" ng-class=\"{'toggle-button-value-active': !ship.hideEmptySlots}\"></div>\n" +
    "		<div class=\"fleet-ship-title fleet-ship-cost font-staw\">\n" +
    "			<button class=\"title-button\" ng-click=\"ship.hideEmptySlots = !ship.hideEmptySlots\">Show Empty Slots</button>\n" +
    "		</div>\n" +
    "		<div class=\"fleet-ship-top-right\"></div>\n" +
    "	</div>\n" +
    "	<div class=\"fleet-ship-middle\">\n" +
    "		<div class=\"fleet-ship-left\"></div>\n" +
    "\n" +
    "		<div class=\"fleet-ship-inner\">\n" +
    "\n" +
    "			<div class=\"card-container\" ng-class=\"{'zoom':zoom}\">\n" +
    "				<card card=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "			Stupid whitespace breaks card alignment\n" +
    "		 --><div class=\"card-container\" ng-class=\"{'zoom':zoom}\">\n" +
    "				<card card=\"ship.classData\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "		 --><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-show=\"!ship.squadron && fleet.resource && (fleet.resource|valueOf:'showShipResourceSlot':ship:fleet)\" droppable can-drop=\"$item.type == fleet.resource.slotType\" drop=\"setShipResource(fleet,ship,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes([fleet.resource.slotType])\">\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\">\n" +
    "							<i class=\"fs fs-{{fleet.resource.slotType}}\"></i><br/>{{fleet.resource.slotType|removeDashes}}\n" +
    "						</div>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "				<card card=\"ship.resource\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "\n" +
    "		 --><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-hide=\"ship.squadron\" droppable can-drop=\"$item.type == 'captain' && $item != ship.captain\" drop=\"setShipCaptain(fleet,ship,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(['captain'])\">\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\">\n" +
    "							<i class=\"fs fs-captain\"></i><br/>Captain\n" +
    "						</div>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "				<card card=\"ship.captain\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "\n" +
    "		 --><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-hide=\"!ship.admiral && ( ship.squadron || ship.hideEmptySlots || fleetHasAdmiral(fleet) )\"\n" +
    "				droppable can-drop=\"$item.type == 'admiral' && $item != ship.admiral\" drop=\"setShipAdmiral(fleet,ship,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(['admiral'])\">\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\">\n" +
    "							<i class=\"fs fs-admiral\"></i><br/>Admiral\n" +
    "						</div>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "				<card card=\"ship.admiral\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "\n" +
    "			--><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-hide=\"!ship.ambassador && ( ship.squadron || ship.hideEmptySlots || fleetHasAmbassador(fleet) )\"\n" +
    "				 droppable can-drop=\"$item.type == 'ambassador' && $item != ship.ambassador\" drop=\"setShipAmbassador(fleet,ship,$item)\" drag-store=\"dragStore\">\n" +
    "				 <div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(['ambassador'])\">\n" +
    "					 <div class=\"card-drop-target-inner\">\n" +
    "						 <div class=\"card-drop-target-type\">\n" +
    "							 <i class=\"fs fs-ambassador\"></i><br/>Ambassador\n" +
    "						 </div>\n" +
    "					 </div>\n" +
    "				 </div>\n" +
    "				 <card card=\"ship.ambassador\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			 </div><!--\n" +
    "\n" +
    "		 --><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-mouseenter=\"hover = true\" ng-mouseleave=\"hover = false\"\n" +
    "				ng-repeat=\"upgradeSlot in ship|upgradeSlots\" ng-hide=\"!upgradeSlot.occupant && (ship.hideEmptySlots || (upgradeSlot|valueOf:'hide':ship:fleet))\"\n" +
    "				droppable can-drop=\"isUpgradeCompatible($item, upgradeSlot, ship, fleet)\" drop=\"setUpgrade(fleet,ship,upgradeSlot,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(upgradeSlot.type)\">\n" +
    "					<div class=\"card-drop-target-title\" ng-class=\"{'card-drop-target-title-hover':hover || upgradeSlot.occupant == dragStore.item}\" ng-show=\"upgradeSlot.source && upgradeSlot.source != 'ship'\">{{upgradeSlot.source}}<div ng-show=\"upgradeSlot.rules\">{{upgradeSlot.rules}}</div></div>\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\" ng-repeat=\"type in upgradeSlot|valueOf:'type':ship:fleet\">\n" +
    "							<i class=\"fs fs-{{type}}\"></i><br/>{{type|removeDashes}}\n" +
    "						</div>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "				<div class=\"card-drop-target-subtitle\">{{upgradeSlot|valueOf:'show':ship:fleet}}</div>\n" +
    "				<card card=\"upgradeSlot.occupant\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div>\n" +
    "\n" +
    "		</div>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"fleet-ship-bottom\" ng-show=\"$last && searchOptions.columns < 1 && !fleet.resource\">\n" +
    "		<div class=\"fleet-ship-bottom-left\" ng-class=\"{'fleet-ship-bottom-left-long': fleet.ships.length > 0 || fleet.resource}\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"fleet-ship-container\" ng-hide=\"loading || ( searchOptions.columns < 1 && !fleet.resource )\">\n" +
    "\n" +
    "	<div class=\"fleet-ship-top\">\n" +
    "		<div class=\"fleet-ship-top-left\" ng-class=\"{'fleet-ship-top-left-first': fleet.ships.length == 0}\"></div>\n" +
    "		<div class=\"fleet-ship-title font-staw\">Fleet Total</div>\n" +
    "		<div class=\"fleet-ship-top-spacer\"></div>\n" +
    "		<div class=\"fleet-ship-title fleet-ship-cost font-staw\">{{ getFleetCost(fleet) }} SP</div>\n" +
    "		<div class=\"fleet-ship-top-right\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"fleet-ship-middle\">\n" +
    "		<div class=\"fleet-ship-left\"></div>\n" +
    "\n" +
    "		<div class=\"fleet-ship-inner\">\n" +
    "\n" +
    "			<div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-hide=\"searchOptions.columns < 1\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(['ship'])\"\n" +
    "					droppable can-drop=\"$item.type == 'ship'\" drop=\"addFleetShip(fleet,$item)\" drag-store=\"dragStore\">\n" +
    "					<div class=\"card-drop-target-title\" ng-if=\"!isMobile\">Click to search this card type</div>\n" +
    "					<div class=\"card-drop-target-title\" ng-if=\"isMobile\">Tap to search this card type</div>\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\">\n" +
    "							<i class=\"fs fs-ship\"></i><br/>Ship\n" +
    "						</div>\n" +
    "					</div>\n" +
    "					<div ng-show=\"!isMobile\" class=\"card-drop-target-subtitle\">Drag here to add to fleet</div>\n" +
    "					<div ng-show=\"isMobile && (!dragStore.item || dragStore.item.type != 'ship')\" class=\"card-drop-target-subtitle\">Tap a ship card to select it</div>\n" +
    "					<div ng-show=\"isMobile && dragStore.item && dragStore.item.type == 'ship'\" class=\"card-drop-target-subtitle\">Tap here to add selected ship to fleet</div>\n" +
    "				</div>\n" +
    "			</div><!--\n" +
    "\n" +
    "			--><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" droppable can-drop=\"$item.type == 'resource' && $item != fleet.resource\" drop=\"setFleetResource(fleet,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(['resource'])\">\n" +
    "					<div class=\"card-drop-target-title\"></div>\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\">\n" +
    "							<i class=\"fs fs-resource\"></i><br/>Resource\n" +
    "						</div>\n" +
    "					</div>\n" +
    "					<div class=\"card-drop-target-subtitle\"></div>\n" +
    "				</div>\n" +
    "				<card card=\"fleet.resource\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div><!--\n" +
    "\n" +
    "			--><div class=\"card-container\" ng-class=\"{'zoom':zoom}\" ng-repeat=\"upgradeSlot in fleet.resource.upgradeSlots\"\n" +
    "				droppable can-drop=\"isUpgradeCompatible($item, upgradeSlot) && $item != upgradeSlot.occupant\" drop=\"setUpgrade(fleet,fleet.resource,upgradeSlot,$item)\" drag-store=\"dragStore\">\n" +
    "				<div class=\"card-outer card-drop-target font-staw\" ng-click=\"setSearchTypes(upgradeSlot.type)\">\n" +
    "					<div class=\"card-drop-target-title\">{{upgradeSlot.source}}<div ng-show=\"upgradeSlot.rules\">{{upgradeSlot.rules}}</div></div>\n" +
    "					<div class=\"card-drop-target-inner\">\n" +
    "						<div class=\"card-drop-target-type\" ng-repeat=\"type in upgradeSlot.type\">\n" +
    "							<i class=\"fs fs-{{type}}\"></i><br/>{{type|removeDashes}}\n" +
    "						</div>\n" +
    "					</div>\n" +
    "					<div class=\"card-drop-target-subtitle\"></div>\n" +
    "				</div>\n" +
    "				<card card=\"upgradeSlot.occupant\" ship=\"ship\" fleet=\"fleet\" drag-store=\"dragStore\"></card>\n" +
    "			</div>\n" +
    "\n" +
    "		</div>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"fleet-ship-bottom\">\n" +
    "		<div class=\"fleet-ship-bottom-left fleet-ship-bottom-left-long\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('fleet-export.html',
    "<div class=\"fleet-close-export\" ng-show=\"searchOptions.showExport\">\n" +
    "	<button class=\"fleet-search-bigger\" ng-click=\"searchOptions.showExport = false\"><i class=\"fa fa-chevron-right\"></i> Export</button>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"export-container\">\n" +
    "	<div class=\"u-search-header\"><div class=\"u-search-header-text\">Copy Text Listing</div></div>\n" +
    "	<label class=\"export-option\"><input type=\"checkbox\" ng-model=\"showSetNames\">Include Expansion Names</label>\n" +
    "	<!-- New checkbox here for the table-top simulator option. -->\n" +
    "	<label class=\"export-option\"><input type=\"radio\" ng-model=\"exportType\" value=\"traditional\">Traditional Export</label>\n" +
    "	<label class=\"export-option\"><input type=\"radio\" ng-model=\"exportType\" value=\"tts\">Table-Top Sim Export</label>\n" +
    "	<!-- <label class=\"export-option\"><input type=\"radio\" ng-model=\"exportType\" value=\"fleetSheet\">Export JSON for Fleet Sheet</label> -->\n" +
    "	<textarea class=\"export-text\" ng-model=\"fleetText\"></textarea>\n" +
    "</div>\n"
  );


  $templateCache.put('fleet-list.html',
    "<div class=\"container-fluid\">\n" +
    "\n" +
    "	<div class=\"row\" >\n" +
    "		<div class=\"col-md-4\">\n" +
    "		</div>\n" +
    "	</div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('search-filter-group.html',
    "<div class=\"u-search-header\" ng-click=\"showContent = !showContent\"><div class=\"u-search-header-text\">{{title}}</div></div>\n" +
    "<div class=\"u-search-content\" ng-show=\"showContent\" ng-transclude></div>"
  );


  $templateCache.put('search.html',
    "<div class=\"u-search\">\n" +
    "\n" +
    "	<div class=\"search-query-container\">\n" +
    "		<input class=\"u-search-query\" ng-model=\"search.query\" placeholder=\"Search\" spellcheck=\"false\" autocorrect=\"off\">\n" +
    "		<button ng-click=\"resetSearch()\">Reset</button>\n" +
    "		<button ng-click=\"showAdvanced = !showAdvanced\">Advanced</button>\n" +
    "	</div>\n" +
    "\n" +
    "	<div ng-show=\"showAdvanced && (!dragStore.item || dragStore.source == 'search')\">\n" +
    "\n" +
    "		<div class=\"u-search-size\">\n" +
    "			<button class=\"u-search-smaller\" ng-click=\"modifySearchColumns(-1)\"><i class=\"fa fa-chevron-left\"></i></button>\n" +
    "			<div class=\"u-search-size-text\">Resize Search Results</div>\n" +
    "			<button class=\"u-search-bigger\" ng-click=\"modifySearchColumns(1)\"><i class=\"fa fa-chevron-right\"></i></button>\n" +
    "		</div>\n" +
    "\n" +
    "		<search-filter-group title=\"Faction\" open>\n" +
    "			<span ng-repeat=\"(faction,data) in search.factions\">\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"data.search\" > <div class=\"u-faction card-faction-{{faction}}\"></div> {{faction|removeDashes}}</label>\n" +
    "			</span>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "		<search-filter-group title=\"Type\" open>\n" +
    "			<span class=\"u-search-type\" ng-repeat=\"(type,data) in search.types\">\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"data.search\" > <i class=\"fs fs-{{type}}\"></i> {{type|removeDashes}}</label>\n" +
    "			</span>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "		<search-filter-group title=\"Uniqueness\" open>\n" +
    "			<span>\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"search.unique\"> <i class=\"fs fs-unique\"></i> Unique</label>\n" +
    "			</span>\n" +
    "			<span>\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"search.generic\"> <i class=\"fs\"></i> Generic</label>\n" +
    "			</span>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "		<search-filter-group title=\"Order By\" open>\n" +
    "			<div class=\"u-search-filter-comment\">\n" +
    "				Order results by <select ng-model=\"search.sortBy\" ng-options=\"sortable.value as sortable.name for sortable in sortables\"></select>\n" +
    "				<select ng-model=\"search.ascending\"><option value=\"true\">Ascending</option><option value=\"false\">Descending</option></select>\n" +
    "				<div class=\"u-order-default\" ng-show=\"search.sortBy != defaults.search.sortBy || search.ascending != defaults.search.ascending\">\n" +
    "					<button ng-click=\"defaults.search.sortBy = search.sortBy; defaults.search.ascending = search.ascending\">Set as Default</button>\n" +
    "					<div>Default order is saved in browser for future sessions.</div>\n" +
    "				</div>\n" +
    "			</div>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "		<search-filter-group title=\"Custom Filter\" open>\n" +
    "			<div class=\"u-search-filter-comment\" ng-init=\"search.filterOperator = '<'\">\n" +
    "				<select ng-model=\"search.filterField\"><option value=\"\">- No Filter -</option><option ng-repeat=\"sortable in sortables\" value=\"{{sortable.value}}\">{{sortable.name}}</option></select>\n" +
    "				<select ng-model=\"search.filterOperator\"><option value=\"<\">&lt;</option><option value=\"<=\">&lt;=</option><option value=\"=\">=</option><option value=\">=\">&gt;=</option><option value=\">\">&gt;</option></select>\n" +
    "				<input ng-model=\"search.filterValue\" placeholder=\"Value\"></input>\n" +
    "			</div>\n" +
    "			<div class=\"u-search-filter-comment\">\n" +
    "				Filter On Maneuver: <select ng-model=\"search.maneuverType\"><option value=\"\">Any</option><option ng-repeat=\"maneuver in maneuvers\" value=\"{{maneuver.value}}\">{{maneuver.name}}</option></select>\n" +
    "				<select ng-model=\"search.maneuverDifficulty\"><option value=\"\">Any</option><option ng-repeat=\"difficulty in difficulty_list\" value=\"{{difficulty.value}}\">{{difficulty.name}}</option></select>\n" +
    "			</div>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "		<search-filter-group title=\"Owned Expansions\">\n" +
    "			<div class=\"u-search-filter-comment\">\n" +
    "				Expansion filter settings are stored in your browser for future sessions. Uncheck the expansions you don't own. New expansions are automatically checked. These settings are not affected by the \"Reset\" button.\n" +
    "			</div>\n" +
    "			<div class=\"u-search-filter-comment\">\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"search.ignoreSetsFilter\"> Temporarily show all cards</label>\n" +
    "			</div>\n" +
    "			<button ng-click=\"uncheckAllSets()\">Uncheck all sets</button>\n" +
    "			<button ng-click=\"checkAllSets()\">Check all sets</button>\n" +
    "			<button ng-click=\"exportSets()\">Export Sets</button>\n" +
    "			<div class=\"u-search-filter-comment\">Import Sets...</div>\n" +
    "			<input type=\"file\" multiple onchange=\"angular.element(this).scope().importSets(this)\">\n" +
    "			<div ng-repeat=\"set in setList | orderBy:'-releaseDate'\" class=\"u-search-set\" ng-hide=\"search.ignoreSetsFilter\">\n" +
    "				<label class=\"u-label\"><input type=\"checkbox\" ng-model=\"search.sets[set.id].search\"> {{set.parentSet}}: {{set.name}}</label>\n" +
    "			</div>\n" +
    "		</search-filter-group>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div ng-init=\"resultLimit = 10>\n" +
    "\n" +
    "	<div class=\"u-loading\" ng-show=\"loading\">Loading cards...</div>\n" +
    "\n" +
    "	<div class=\"card-container\" ng-show=\"dragStore.item && dragStore.source != 'search'\" droppable can-drop=\"true\" drop=\"$emit('removeFromFleetDropped',$item)\" drag-store=\"dragStore\">\n" +
    "		<div class=\"card-outer card-drop-target font-staw\">\n" +
    "			<div class=\"card-drop-target-inner\">\n" +
    "				<div class=\"card-drop-target-type\">\n" +
    "					<i class=\"fs fs-captain\"></i><br/>Remove From Fleet\n" +
    "				</div>\n" +
    "			</div>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div ng-hide=\"dragStore.item && dragStore.source != 'search'\">\n" +
    "\n" +
    "		<div class=\"card-container\" ng-repeat=\"card in cards | cardFilter:search | sortBy:search.sortBy:search.ascending | limitTo:resultLimit*search.columns\">\n" +
    "			<card card=\"card\" drag-store=\"dragStore\" drag-source=\"search\"></card>\n" +
    "		</div>\n" +
    "\n" +
    "		<div>\n" +
    "			<button class=\"u-show-more\" ng-hide=\"loading\" ng-click=\"resultLimit = resultLimit + 10\">Show More</button>\n" +
    "		</div>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('card-faction.html',
    "<div class=\"card-outer card-faction font-staw\" ng-class=\"{ 'dragging': faction == dragStore.item }\" draggable drag-item=\"faction\" drag-store=\"dragStore\" drag-source=\"dragSource\">\n" +
    "\n" +
    "	<div class=\"card-faction-image card-faction-{{faction.factions[0]}}\"></div>\n" +
    "\n" +
    "	<div class=\"card-faction-name\">{{faction.name | uppercase}}</div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('card-resource.html',
    "<div class=\"card-outer card-resource font-staw\" ng-class=\"{ 'dragging': resource == dragStore.item }\" draggable drag-item=\"resource\" drag-store=\"dragStore\" drag-source=\"dragSource\">\n" +
    "\n" +
    "	<div class=\"card-resource-header\">\n" +
    "		<span class=\"card-title\" ng-class=\"{'card-title-long': resource.name.length > 20}\">{{resource.name | uppercase}}<span ng-hide=\"resource.hideCost\"> ({{resource|valueOf:'cost':ship:fleet}} SP)</span></span>\n" +
    "		\n" +
    "	</div>\n" +
    "	\n" +
    "	<div class=\"card-resource-header pull-right\">\n" +
    "		<i ng-if=\"resource.opBanned\" class=\"card-OP-banned-icon fs fs-opBanned\"></i>\n" +
    "	</div>\n" +
    "	\n" +
    "	<div class=\"card-text\">\n" +
    "		<div class=\"card-text-inner font-staw-alt\" ng-bind-html=\"resource.text | icons\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('card-ship-class.html',
    "<div class=\"card-outer card-ship card-shipclass font-staw\">\n" +
    "\n" +
    "	<div class=\"card-shipclass-arcs arc-faction-{{ship.factions[0]}}\">\n" +
    "		<div class=\"arc arc-fill arc-fore-90\" ng-show=\"shipClass.frontArc == 90\"></div>\n" +
    "		<div class=\"arc arc-fill arc-fore-180\" ng-show=\"shipClass.frontArc == 180\"></div>\n" +
    "		<div class=\"arc arc-rear-90\" ng-show=\"shipClass.rearArc == 90\"></div>\n" +
    "		<div class=\"arc-hole\"></div>\n" +
    "		<div class=\"arc-name\">{{getBaseTileName(ship)}}</div>\n" +
    "		<div class=\"arc-stats\">\n" +
    "			<div class=\"arc-stat card-ship-stat-attack text-center\">{{ship|valueOf:'attack':ship:fleet}}</div>\n" +
    "			<div class=\"arc-stat card-ship-stat-agility text-center\">{{ship|valueOf:'agility':ship:fleet}}</div>\n" +
    "			<div class=\"arc-stat card-ship-stat-hull text-center\">{{ship|valueOf:'hull':ship:fleet}}</div>\n" +
    "			<div class=\"arc-stat card-ship-stat-shields text-center\">{{ship|valueOf:'shields':ship:fleet}}</div>\n" +
    "		</div>\n" +
    "		<div class=\"arc-actions\"><i ng-repeat=\"action in ship.actions\" class=\"fs fs-{{action}}\"></i></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<!-- <div class=\"card-image\" ng-class=\"{'card-image-large': Object.keys(shipClass.maneuvers).length > 9}\"></div> -->\n" +
    "	<div ng-class=\"(shipClass.id == 'borg_cube' || shipClass.id == 'kelvin_constitution_class') ? 'card-image-large' : 'card-image'\"></div>\n" +
    "\n" +
    "	<div class=\"card-corner-top-left pull-left\">\n" +
    "		<div class=\"card-corner-inner pull-right\"></div>\n" +
    "	</div>\n" +
    "	<div class=\"card-corner-top-right pull-right\">\n" +
    "		<div class=\"card-corner-inner card-corner-inner-faction\"></div>\n" +
    "	</div>\n" +
    "	<div class=\"card-title-container text-center\">\n" +
    "		<span class=\"card-shipclass-title\" ng-class=\"{'card-title-long': shipClass.name.length >= 20 }\">{{shipClass.name | uppercase}}</span>\n" +
    "	</div>\n" +
    "\n" +
    "	<div ng-class=\"(shipClass.id == 'borg_cube' || shipClass.id == 'kelvin_constitution_class') ? 'card-border-left-tall pull-left' : 'card-border-left pull-left'\"></div>\n" +
    "\n" +
    "	<div ng-class=\"(shipClass.id == 'borg_cube' || shipClass.id == 'kelvin_constitution_class') ? 'card-border-right-tall pull-right' : 'card-border-right pull-right'\"></div>\n" +
    "\n" +
    "	<div ng-class=\"(shipClass.id == 'borg_cube' || shipClass.id == 'kelvin_constitution_class') ? 'card-class-maneuvers-tall' : 'card-class-maneuvers'\">\n" +
    "		<div class=\"card-maneuver-row\" ng-repeat=\"speed in speeds track by $index\">\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'speed-reverse': speed < 0}\"><span ng-show=\"speed != 9\">{{abs(speed)}}</span></div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].turn || shipClass.maneuvers[speed]['90-degree-rotate']}\">\n" +
    "				<i class=\"fs fs-turn-left speed-{{shipClass.maneuvers[speed].turn}}\" ng-show=\"shipClass.maneuvers[speed].turn\"></i>\n" +
    "				<i class=\"fs fs-90-rotate-left speed-{{shipClass.maneuvers[speed]['90-degree-rotate']}}\" ng-show=\"shipClass.maneuvers[speed]['90-degree-rotate']\"></i>\n" +
    "			</div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].bank || shipClass.maneuvers[speed].spin || shipClass.maneuvers[speed].flank || shipClass.maneuvers[speed]['45-degree-rotate']}\">\n" +
    "				<i class=\"fs fs-bank-left speed-{{shipClass.maneuvers[speed].bank}}\" ng-show=\"shipClass.maneuvers[speed].bank\"></i>\n" +
    "				<i class=\"fs fs-spin-left speed-{{shipClass.maneuvers[speed].spin}}\" ng-show=\"shipClass.maneuvers[speed].spin\"></i>\n" +
    "				<i class=\"fs fs-left-flank speed-{{shipClass.maneuvers[speed].flank}}\" ng-show=\"shipClass.maneuvers[speed].flank\"></i>\n" +
    "				<i class=\"fs fs-45-rotate-left speed-{{shipClass.maneuvers[speed]['45-degree-rotate']}}\" ng-show=\"shipClass.maneuvers[speed]['45-degree-rotate']\"></i>\n" +
    "			</div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].straight || shipClass.maneuvers[speed].stop}\">\n" +
    "				<i class=\"fs speed-{{shipClass.maneuvers[speed].straight}}\" ng-class=\"{'fs-forward': speed > 0, 'fs-reverse': speed < 0}\" ng-show=\"shipClass.maneuvers[speed].straight\"></i>\n" +
    "				<i class=\"fs fs-stop speed-{{shipClass.maneuvers[speed].stop}}\" ng-show=\"shipClass.maneuvers[speed].stop\"></i>\n" +
    "			</div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].bank || shipClass.maneuvers[speed].spin || shipClass.maneuvers[speed].flank || shipClass.maneuvers[speed]['45-degree-rotate']}\">\n" +
    "				<i class=\"fs fs-bank-right speed-{{shipClass.maneuvers[speed].bank}}\" ng-show=\"shipClass.maneuvers[speed].bank\"></i>\n" +
    "				<i class=\"fs fs-spin-right speed-{{shipClass.maneuvers[speed].spin}}\" ng-show=\"shipClass.maneuvers[speed].spin\"></i>\n" +
    "				<i class=\"fs fs-right-flank speed-{{shipClass.maneuvers[speed].flank}}\" ng-show=\"shipClass.maneuvers[speed].flank\"></i>\n" +
    "				<i class=\"fs fs-45-rotate-right speed-{{shipClass.maneuvers[speed]['45-degree-rotate']}}\" ng-show=\"shipClass.maneuvers[speed]['45-degree-rotate']\"></i>\n" +
    "			</div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].turn || shipClass.maneuvers[speed]['90-degree-rotate']}\">\n" +
    "				<i class=\"fs fs-turn-right speed-{{shipClass.maneuvers[speed].turn}}\" ng-show=\"shipClass.maneuvers[speed].turn\"></i>\n" +
    "				<i class=\"fs fs-90-rotate-right speed-{{shipClass.maneuvers[speed]['90-degree-rotate']}}\" ng-show=\"shipClass.maneuvers[speed]['90-degree-rotate']\"></i>\n" +
    "			</div>\n" +
    "			<div class=\"card-maneuver-box\" ng-class=\"{'card-maneuver-box-highlight': shipClass.maneuvers[speed].about}\">\n" +
    "				<i class=\"fs fs-come-about speed-{{shipClass.maneuvers[speed].about}}\" ng-show=\"shipClass.maneuvers[speed].about\"></i>\n" +
    "			</div>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-corner-bottom-left pull-left\">\n" +
    "		<div class=\"card-corner-inner\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-corner-bottom-right pull-right\">\n" +
    "		<div class=\"card-corner-inner\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-border-bottom\"></div>\n" +
    "\n" +
    "	<div style=\"clear: both\"></div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('card-ship.html',
    "<div class=\"card-outer card-ship font-staw\" ng-class=\"{ 'card-unique': ship.unique, 'card-mirror': ship.mirror, 'dragging': ship == dragStore.item }\" draggable drag-item=\"ship\" drag-store=\"dragStore\" drag-source=\"dragSource\">\n" +
    "\n" +
    "	<div class=\"card-image\"></div>\n" +
    "\n" +
    "	<div class=\"card-corner-top-left pull-left\"><i ng-if=\"ship.unique\" class=\"card-unique-icon fs fs-unique pull-left\"></i>\n" +
    "		<div class=\"card-corner-inner pull-right\"></div>\n" +
    "	</div>\n" +
    "	<div class=\"card-corner-top-right pull-right\"><i ng-repeat=\"faction in ship|valueOf:'factions':ship:fleet\" class=\"card-ship-faction card-faction-{{faction}} card-faction-{{$index}} fs fs-empty\" ng-class=\"{'card-factions-multiple': (ship|valueOf:'factions':ship:fleet).length > 1}\"></i>\n" +
    "		<div class=\"card-corner-inner card-corner-inner-faction\"></div>\n" +
    "	</div>\n" +
    "	<div class=\"card-title-container text-center\">\n" +
    "		<span class=\"card-title\" ng-class=\"{'card-title-long': ship.name.length >= 20 }\">{{ship.name | uppercase}}</span>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-ship-stats pull-left\">\n" +
    "		<div class=\"card-ship-stat card-ship-stat-attack text-right\" tooltip-show=\"fleet\" tooltip=\"ship|valueOf:'attack':ship:fleet:false:{modifiers:true}\" tooltip-position=\"e\"><span class=\"card-skill-plus\" ng-show=\"ship.isShipModifier\">+</span>{{ship|valueOf:'attack':ship:fleet}}</div>\n" +
    "		<div class=\"card-ship-stat card-ship-stat-agility text-right\" tooltip-show=\"fleet\" tooltip=\"ship|valueOf:'agility':ship:fleet:false:{modifiers:true}\" tooltip-position=\"e\"><span class=\"card-skill-plus\" ng-show=\"ship.isShipModifier\">+</span>{{ship|valueOf:'agility':ship:fleet}}</div>\n" +
    "		<div class=\"card-ship-stat card-ship-stat-hull text-right\" tooltip-show=\"fleet\" tooltip=\"ship|valueOf:'hull':ship:fleet:false:{modifiers:true}\" tooltip-position=\"e\"><span class=\"card-skill-plus\" ng-show=\"ship.isShipModifier\">+</span>{{ship|valueOf:'hull':ship:fleet}}</div>\n" +
    "		<div class=\"card-ship-stat card-ship-stat-shields text-right\" tooltip-show=\"fleet\" tooltip=\"ship|valueOf:'shields':ship:fleet:false:{modifiers:true}\" tooltip-position=\"e\"><span class=\"card-skill-plus\" ng-show=\"ship.isShipModifier\">+</span>{{ship|valueOf:'shields':ship:fleet}}</div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-border-right pull-right\"></div>\n" +
    "\n" +
    "	<div class=\"card-ship-silhouette pull-left\"><i ng-if=\"ship.faq\" class=\"card-faq-icon fs fs-faq pull-left\"></i></div>\n" +
    "\n" +
    "	<div class=\"card-ship-class-container text-center\">\n" +
    "		<span class=\"card-ship-class\" ng-class=\"{'card-ship-class-long': ship.class.length >= 25 }\">{{ship.class | uppercase}}</span>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-text font-staw-alt\"><div class=\"card-text-inner\" ng-bind-html=\"ship.text | icons\" ng-class=\"{'card-text-inner-long': ship.text.length > 230 }\"></div></div>\n" +
    "\n" +
    "	<div class=\"card-ship-action-bar text-center\">\n" +
    "		<i ng-repeat=\"action in ship.actions\" class=\"fs fs-{{action}}\"></i>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-corner-bottom-right pull-right\">\n" +
    "		<div class=\"card-corner-inner\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-ship-cost pull-right\">{{ship|valueOf:'cost':ship:fleet}}</div>\n" +
    "\n" +
    "	<div class=\"card-ship-upgrade-bar\">\n" +
    "		<i ng-repeat=\"upgrade in ship.upgrades track by $index\" class=\"fs fs-{{upgrade.type[0]}}\" ng-class=\"{'card-ship-upgrade-occupied': upgrade.occupant}\"></i>\n" +
    "	</div>\n" +
    "	<div style=\"clear: both\"></div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('card-token.html',
    "<div class=\"card-outer card-token font-staw\">\n" +
    "\n" +
    "	<div class=\"card-token-header\">\n" +
    "		<span class=\"card-title\" ng-class=\"{'card-title-long': token.name.length > 20}\">{{token.name | uppercase}}</span>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-text\">\n" +
    "		<div class=\"card-text-inner font-staw-alt\" ng-bind-html=\"token.text | icons\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('card-upgrade.html',
    "<div class=\"card-outer card-upgrade font-staw\" ng-class=\"{ 'card-unique': upgrade.unique, 'card-OnePerShip': upgrade.OnePerShip, 'card-factionFederation': upgrade.factionFederation, 'card-FrontArc': upgrade.FrontArc, 'card-RearArc': upgrade.RearArc, 'card-Hull': upgrade.Hull, 'card-mirror': upgrade.mirror, 'dragging': upgrade == dragStore.item }\" draggable drag-item=\"upgrade\" drag-store=\"dragStore\" drag-source=\"dragSource\">\n" +
    "\n" +
    "	<div class=\"card-image\"></div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "	<div class=\"card-corner-top-left pull-left\">\n" +
    "		<i ng-if=\"upgrade.unique\" class=\"card-unique-icon fs fs-unique pull-left\"></i>\n" +
    "		<i ng-if=\"upgrade.OnePerShip\" class=\"card-OnePerShip-icon fs fs-OnePerShip pull-left\"></i>\n" +
    "		<i ng-if=\"upgrade.specialization\" class=\"card-specialization-icon fs fs-specialization pull-left\"></i>\n" +
    "		<div class=\"card-corner-inner pull-right\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-title-container text-left\">\n" +
    "		<span ng-if=\"upgrade.showType\" class=\"card-captain pull-right\">{{upgrade.type|uppercase|removeDashes}}</span>\n" +
    "		<span ng-if=\"upgrade|valueOf:'attack':ship:fleet\" class=\"card-weapon-attack pull-right\" tooltip-show=\"ship\" tooltip=\"upgrade|valueOf:'attack':ship:fleet:false:{modifiers:true}\">{{upgrade|valueOf:'attack':ship:fleet}}</span>\n" +
    "		<span class=\"card-title\"\n" +
    "			ng-class=\"{ 'card-title-long': upgrade.name.length >= 24 || (upgrade.showType && upgrade.name.length + upgrade.type.length >= 24) || (upgrade.attack && upgrade.name.length >= 20),\n" +
    "						'card-title-super-long': upgrade.name.length >= 31 || upgrade.showType && upgrade.name.length + upgrade.type.length >= 31,\n" +
    "			}\">{{upgrade.name | uppercase}}</span>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-border-left pull-left\">\n" +
    "		<i ng-if=\"upgrade.captainFederation\" class=\"card-captainFederation-icon fs fs-captainFederation\"></i>\n" +
    "		<i ng-if=\"upgrade.captainBajoren\" class=\"card-captainBajoren-icon fs fs-captainBajoren\"></i>\n" +
    "		<i ng-if=\"upgrade.captainVulcan\" class=\"card-captainVulcan-icon fs fs-captainVulcan\"></i>\n" +
    "		<i ng-if=\"upgrade.captainKlingon\"  class=\"card-captainKlingon-icon fs fs-captainKlingon\"></i>\n" +
    "		<i ng-if=\"upgrade.captainRomulan\" class=\"card-captainRomulan-icon fs fs-captainRomulan\"></i>\n" +
    "		<i ng-if=\"upgrade.captainDominion\" class=\"card-captainDominion-icon fs fs-captainDominion\"></i>\n" +
    "		<i ng-if=\"upgrade.captainIndependent\" class=\"card-captainIndependent-icon fs fs-captainIndependent\"></i>\n" +
    "		<i ng-if=\"upgrade.captainFerengi\" class=\"card-captainFerengi-icon fs fs-captainFerengi\"></i>\n" +
    "		<i ng-if=\"upgrade.captainKazon\" class=\"card-captainKazon-icon fs fs-captainKazon\"></i>\n" +
    "		<i ng-if=\"upgrade.captainXindi\" class=\"card-captainFerengi-icon fs fs-captainFerengi\"></i>\n" +
    "		<i ng-if=\"upgrade.captainBorg\" class=\"card-captainBorg-icon fs fs-captainBorg\"></i>\n" +
    "		<i ng-if=\"upgrade.captain8472\" class=\"card-captain8472-icon fs fs-captain8472\"></i>\n" +
    "		<i ng-if=\"upgrade.captainMU\" class=\"card-captainMU-icon fs fs-captainMU\"></i>\n" +
    "\n" +
    "		<i ng-if=\"upgrade.shipFederation\" class=\"card-shipFederation-icon fs fs-card-shipFederation\"></i>\n" +
    "		<i ng-if=\"upgrade.shipBajoren\" class=\"card-shipBajoren-icon fs fs-card-shipBajoren\"></i>\n" +
    "		<i ng-if=\"upgrade.shipVulcan\" class=\"card-shipVulcan-icon fs fs-card-shipVulcan\"></i>\n" +
    "		<i ng-if=\"upgrade.shipKlingon\" class=\"card-shipKlingon-icon fs fs-shipKlingon\"></i>\n" +
    "		<i ng-if=\"upgrade.shipRomulan\" class=\"card-shipRomulan-icon fs fs-shipRomulan\"></i>\n" +
    "		<i ng-if=\"upgrade.shipDominion\" class=\"card-shipDominion-icon fs fs-shipDominion\"></i>\n" +
    "		<i ng-if=\"upgrade.shipIndependent\" class=\"card-shipIndependent-icon fs fs-shipIndependent\"></i>\n" +
    "		<i ng-if=\"upgrade.shipFerengi\" class=\"card-shipFerengi-icon fs fs-shipFerengi\"></i>\n" +
    "		<i ng-if=\"upgrade.shipKazon\" class=\"card-shipKazon-icon fs fs-shipKazon\"></i>\n" +
    "		<i ng-if=\"upgrade.shipXindi\" class=\"card-shipXindi-icon fs fs-shipXindi\"></i>\n" +
    "		<i ng-if=\"upgrade.shipBorg\" class=\"card-shipBorg-icon fs fs-shipBorg\"></i>\n" +
    "		<i ng-if=\"upgrade.ship8472\" class=\"card-ship8472-icon fs fs-ship8472\"></i>\n" +
    "		<i ng-if=\"upgrade.shipMU\" class=\"card-shipMU-icon fs fs-shipMU\"></i>\n" +
    "\n" +
    "		<i ng-if=\"upgrade.costFederation\" class=\"card-costFederation-icon\">{{upgrade|valueOf:'costFederation':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costBajoren\" class=\"card-costBajoren-icon\">{{upgrade|valueOf:'costFederation':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costVulcan\" class=\"card-costVulcan-icon\">{{upgrade|valueOf:'costVulcan':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costKlingon\" class=\"card-costKlingon-icon\">{{upgrade|valueOf:'costKlingon':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costRomulan\" class=\"card-costRomulan-icon\">{{upgrade|valueOf:'costRomulan':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costDominion\" class=\"card-costDominion-icon\">{{upgrade|valueOf:'costDominion':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costIndependent\" class=\"card-costIndependent-icon\">{{upgrade|valueOf:'costIndependent':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costFerengi\" class=\"card-costFerengi-icon\">{{upgrade|valueOf:'costFerengi':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costKazon\" class=\"card-costKazon-icon\">{{upgrade|valueOf:'costKazon':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costXindi\" class=\"card-costXindi-icon\">{{upgrade|valueOf:'costXindi':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costBorg\" class=\"card-costBorg-icon\">{{upgrade|valueOf:'costBorg':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.cost8472\" class=\"card-cost8472-icon\">{{upgrade|valueOf:'cost8472':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.costMU\" class=\"card-costMU-icon\">{{upgrade|valueOf:'costMU':ship:fleet}}</i>\n" +
    "\n" +
    "		<i ng-if=\"upgrade.attackConstraint\" class=\"card-attackConstraint-icon\">{{upgrade|valueOf:'attackConstraint':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.hullConstraint\" class=\"card-hullConstraint-icon\">{{upgrade|valueOf:'hullConstraint':ship:fleet}}</i>\n" +
    "		<i ng-if=\"upgrade.FrontArc\" class=\"card-FrontArc-icon fs fs-FrontArc\"></i>\n" +
    "		<i ng-if=\"upgrade.RearArc\" class=\"card-RearArc-icon fs fs-RearArc\"></i>\n" +
    "		<i ng-if=\"upgrade.arc360\" class=\"card-360Arc-icon fs fs-360Arc\"></i>\n" +
    "		<i ng-if=\"upgrade.shipLimit\" class=\"card-shipLimit-icon fs fs-shipLimit\"></i>\n" +
    "		<i ng-if=\"upgrade.faq\" class=\"card-faq-icon fs fs-faq\"></i>\n" +
    "		<i ng-if=\"upgrade.opBanned\" class=\"card-OP-banned-icon fs fs-opBanned\"></i>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-text\">\n" +
    "		<div ng-if=\"upgrade.range\" class=\"card-weapon-range pull-right\">{{upgrade|valueOf:'range':ship:fleet}}</div>\n" +
    "		<div class=\"card-text-inner font-staw-alt\" ng-bind-html=\"upgrade.text | icons\" ng-class=\"{'card-text-inner-long': upgrade.text.length > 300, 'card-text-inner-super-long': upgrade.text.length > 530, 'text-left': upgrade.range }\"></div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div class=\"card-upgrade-cost pull-right\"><div ng-repeat=\"faction in upgrade|valueOf:'factions':ship:fleet\" class=\"card-upgrade-faction card-faction-{{ (upgrade|valueOf:'factions':ship:fleet).length - $index}}\"><div class=\"card-upgrade-faction-black\"></div><div class=\"card-upgrade-faction-icon card-faction-{{faction}}\"></div></div><div class=\"card-upgrade-cost-value\" ng-class=\"{'card-upgrade-cost-free': '{{upgrade|valueOf:'free':ship:fleet}}' }\" tooltip-show=\"ship\" tooltip=\"upgrade|valueOf:'cost':ship:fleet:false:{modifiers:true}\">{{upgrade|valueOf:'cost':ship:fleet}}</div></div>\n" +
    "\n" +
    "	<div ng-if=\"upgrade.type == 'captain' || upgrade.type == 'admiral' || (upgrade|valueOf:'skill':ship:fleet)\" class=\"card-skill-container pull-left\">\n" +
    "		<div class=\"card-skill\" tooltip-show=\"ship\" tooltip=\"upgrade|valueOf:'skill':ship:fleet:false:{modifiers:true}\" tooltip-position=\"nw-alt\"><span class=\"card-skill-plus\" ng-show=\"upgrade.isSkillModifier && upgrade.skill >= 0\">+</span>{{upgrade|valueOf:'skill':ship:fleet}}</div>\n" +
    "	</div>\n" +
    "\n" +
    "	<div ng-if=\"!(upgrade|valueOf:'skill':ship:fleet) && upgrade.type != 'captain' && upgrade.type != 'admiral' \" class=\"card-upgrade-type pull-left fs fs-{{upgrade.type}}\"></div>\n" +
    "\n" +
    "	<div class=\"card-border-bottom\">\n" +
    "		<i ng-if=\"upgrade.talents\" ng-repeat=\"talent in range(upgrade.talents) track by $index\" class=\"fs fs-talent\"></i>\n" +
    "		<i ng-repeat=\"slot in upgrade.upgradeSlots track by $index\" ng-if=\"slot.showOnCard\" class=\"fs fs-{{slot.type[0]}}\" ng-class=\"{'card-upgrades-long': upgrade.upgradeSlots.length > 2}\"></i>\n" +
    "	</div>\n" +
    "\n" +
    "<i ng-if=\"upgrade.alliance\" class=\"card-alliance-icon fs fs-alliance\">\n" +
    "\n" +
    "	<div style=\"clear: both\"></div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('card.html',
    "<div ng-if=\"card\" ng-switch on=\"card.type\">\n" +
    "	<card-ship 			ng-switch-when=\"ship\" ship=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" fleet=\"fleet\"></card-ship>\n" +
    "	<card-ship 			ng-switch-when=\"flagship\" ship=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" fleet=\"fleet\"></card-ship>\n" +
    "	<card-ship-class	ng-switch-when=\"ship-class\" ship-class=\"card\" ship=\"ship\" fleet=\"fleet\"></card-ship-class>\n" +
    "	<card-resource 		ng-switch-when=\"resource\" resource=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" ship=\"ship\" fleet=\"fleet\"></card-resource>\n" +
    "	<card-token 		ng-switch-when=\"token\" token=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" ship=\"ship\" fleet=\"fleet\"></card-token>\n" +
    "	<card-faction 		ng-switch-when=\"faction\" faction=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" ship=\"ship\" fleet=\"fleet\"></card-faction>\n" +
    "	<card-upgrade 		ng-switch-default upgrade=\"card\" drag-store=\"dragStore\" drag-source=\"dragSource\" ship=\"ship\" fleet=\"fleet\"></card-upgrade>\n" +
    "</div>"
  );

}]);
