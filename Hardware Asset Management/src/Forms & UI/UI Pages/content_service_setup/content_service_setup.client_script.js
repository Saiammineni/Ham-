angular.module('hamp_opt', []).controller('HwOptInCtrl', ['$scope', '$window', '$http', function ($scope, $window, $http) {
	$scope.init = function (status) {
		$scope.persistedStatus = JSON.parse(status);
		$scope.currentStatus = JSON.parse(status);
		$scope.statusChanged = false;
	};

	$scope.CONFIGURATIONS = [
		{
			heading: getMessage('Hardware Models'),
			definition: getMessage('HAM: Content Service: Definition: Hardware Models'),
			details: getMessage('Details transferred: Name, Manufacturer, Model number, Short description, Model category, Status, Normalized name, Normalized manufacturer, Normalized model number, Device type, Normalized status, Normalization rule.'),
			id: 'hwModel',
			property: 'hardware_model_allow_share'
		},
		{
			heading: getMessage('Consumable Models'),
			definition: getMessage('HAM: Content Service: Definition: Consumable Models'),
			details: getMessage('Details transferred: Name, Manufacturer, Model number, Short description, Model category, Status, Normalized name, Normalized manufacturer, Normalized model number, Device type, Normalized status, Normalization rule.'),
			id: 'consumableModel',
			property: 'consumable_model_allow_share'
		},
		{
			heading: getMessage('Hardware Lifecycles'),
			definition: getMessage('Definition: Hardware Model Lifecycle records representing the external or manufacturer defined lifecycle of the hardware product. Only Hardware Model Lifecycles not created by ServiceNow with a lifecycle type other than internal will be transferred.'),
			details: getMessage('Details transferred: Lifecycle type, Lifecycle phase, Source, Phase start date, Phase end date, Risk, Normalized name, Normalized manufacturer, Normalized model number, Device type.'),
			id: 'hwLifecycle',
			property: 'hardware_lifecycle_allow_share'
		},
		{
			heading: getMessage('Consumable Lifecycles'),
			definition: getMessage('Definition: Consumable Model Lifecycle records representing the external or manufacturer defined lifecycle of the consumable product. Only Consumable Model Lifecycles not created by ServiceNow with a lifecycle type other than internal will be transferred.'),
			details: getMessage('Details transferred: Lifecycle type, Lifecycle phase, Source, Phase start date, Phase end date, Risk, Normalized name, Normalized manufacturer, Normalized model number, Device type.'),
			id: 'consumableLifecycle',
			property: 'consumable_lifecycle_allow_share'
		},
		{
			heading: getMessage('Custom Product Models'),
			definition: getMessage('Definition: A model created to classify new models not provided by content service.'),
			details: getMessage('Details transferred: Name, Manufacturer, Model number, Device type, Product.'),
			id: 'customProductModel',
			property: 'custom_product_model_allow_share'
		},
	];

	$scope.saveClicked = false;
	$scope.saveSuccessful = false;

	$scope.processorUrl = '/sn_hamp_hampHwContentServiceProcessor.do';

	$scope.optIn = function () {
		$http({
			method: 'POST',
			url: $scope.processorUrl,
			data: { sysparm_name: 'optIn' },
			headers: { 'X-UserToken': window.g_ck }
		}).then(function success(response) {
			$scope.handleResponse('optIn', response, true /* saveClicked */);
		});
	};

	$scope.saveSelection = function () {
		// Checking if all toggles are off
		var allToggledOff = false;
		angular.forEach($scope.CONFIGURATIONS, function(config, key) {
			allToggledOff = $scope.currentStatus[config.property] || allToggledOff;
		});
		// If all toggles are off, show opt-out alert modal
		if (!allToggledOff) {
			$j('#opt_out_alert').modal('show');
		} else {
			$scope.saveClicked = false;

			var data = {};
			data.sysparm_name = 'saveSelection';
			angular.forEach($scope.CONFIGURATIONS, function(config, key) {
				data['sysparm_' + config.property] = $scope.currentStatus[config.property];
			});

			$http({
				method: 'POST',
				url: $scope.processorUrl,
				data: data,
				headers: { 'X-UserToken': window.g_ck }
			}).then(function success(response) {
				$scope.handleResponse('saveSelection', response, true /* saveClicked */);
			});
		}
	};

	$scope.optOut = function () {
		$scope.saveClicked = false;
		$http({
			method: 'POST',
			url: $scope.processorUrl,
			data: { sysparm_name: 'optOut' },
			headers: { 'X-UserToken': window.g_ck }
		}).then(function success(response) {
			$scope.handleResponse('optOut', response, false /* saveClicked */);
			$scope.showMessage('infoMessage');
		});
	};

	$scope.handleResponse = function (from, response, saveClicked) {
		var type;
		if (from === 'optIn') {
			for (type in $scope.persistedStatus)
				$scope.persistedStatus[type] = true;
		} else if (from === 'optOut') {
			for (type in $scope.persistedStatus)
				$scope.persistedStatus[type] = false;
		} else if (from === 'saveSelection') {
			for(type in $scope.persistedStatus)
				$scope.persistedStatus[type] = $scope.currentStatus[type];
			$scope.persistedStatus.optInStatus = true;
		}

		$scope.saveClicked = saveClicked;
		$scope.saveSuccessful = response;
		$scope.agree_checkbox = false;

		$scope.init(JSON.stringify($scope.persistedStatus));
	};

	$scope.toggleStatusChange = function () {
		$scope.statusChanged = !angular.equals($scope.persistedStatus, $scope.currentStatus);
	};

	$scope.hideMessage = function (id) {
		gel(id).style.display = 'none';
	};

	$scope.showMessage = function (id) {
		gel(id).style.display = 'block';
	};
}]);