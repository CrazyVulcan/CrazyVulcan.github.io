<div class="card-outer card-resource font-staw" ng-class="{ 'dragging': resource == dragStore.item }" draggable drag-item="upgrade" drag-store="dragStore" drag-source="dragSource">

	<div class="card-resource-header">
		<span class="card-title" ng-class="{'card-title-long': resource.name.length > 20}">{{resource.name | uppercase}} ({{resource.cost}} SP)</span>
	</div>

	<div class="card-text">
		<div class="card-text-inner font-staw-alt" ng-bind-html="resource.text | icons"></div>
	</div>

</div>
