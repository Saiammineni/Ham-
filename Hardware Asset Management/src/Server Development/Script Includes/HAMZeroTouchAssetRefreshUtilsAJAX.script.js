var HAMZeroTouchAssetRefreshUtilsAJAX = Class.create();
HAMZeroTouchAssetRefreshUtilsAJAX.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	getLocationAddressForPickup: function() {
		// getting the address fields from the location selected for pickup
		var locationId = this.getParameter('sysparm_locationId');
		var locationGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.LOCATION_TABLE);
		locationGr.get(locationId);
		var results = {
			"country": locationGr.getValue('country'),
			"state_loc": locationGr.getValue('state'),
			"city": locationGr.getValue('city'),
			"street": locationGr.getValue('street'),
			"zip": locationGr.getValue('zip'),
        };
		
		return JSON.stringify(results);
	},
	
	getUserAddressForShip: function() {
		// getting the address fields from the user's location for ship
		var userId = this.getParameter('sysparm_userId');
		var userGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.USER_TABLE);
		userGr.get(userId);
		var locationId = userGr.getValue('location');
		var locationGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.LOCATION_TABLE);
		locationGr.get(locationId);
		var results = {
			"country": locationGr.getValue('country'),
			"state_loc": locationGr.getValue('state'),
			"city": locationGr.getValue('city'),
			"street": locationGr.getValue('street'),
			"zip": locationGr.getValue('zip'),
			"email": userGr.getValue('email'),
			"mobile": userGr.getValue('mobile_phone'),
			"name": userGr.getValue('name')
        };
        return JSON.stringify(results);
	},


	getReplacementModelFilter: function(assetId) {
		// Reference qualifier for Replacement model in catalog request form
		if (assetId == '') {	// If asset field is empty, no replacement model is shown
			return 'sys_id=NULL';
		}
		var assetGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
		assetGr.get(assetId);
		var userId = gs.getUserID();
		var userGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.USER_TABLE);
		userGr.get(userId);
		var model = assetGr.model;
		var refreshModels =[];
		var replacementModels =[];
		var refreshModelGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_MODEL_TABLE);
		// Check based on asset location, if available
		if(assetGr.location && assetGr.location.full_name) {
			refreshModelGr.addQuery('active', true); 
			refreshModelGr.addQuery('model', model);
			refreshModelGr.query();
			var assetLocation = assetGr.location;
			while (refreshModelGr.next()) {
				var replacementLocation = refreshModelGr.location;
				if (replacementLocation && replacementLocation.full_name && assetLocation && assetLocation.full_name) {
					if (assetLocation.full_name.includes(replacementLocation.full_name) || (replacementLocation.name == assetLocation.country)) { // Check if the Replacement model location's full name is present in Asset location' full name
						refreshModels.push(refreshModelGr.getUniqueValue());
					}
				}
			}
		}
		// Check based on user's location, if asset's location is not available
		else if (userGr.location && userGr.location.full_name) {
			refreshModelGr.addQuery('active', true);
			refreshModelGr.addQuery('model', model);
			refreshModelGr.query();
			userLocation = userGr.location;
			while (refreshModelGr.next()) {
				replacementLocation = refreshModelGr.location;
				if (replacementLocation && replacementLocation.full_name && userLocation && userLocation.full_name) {
					if (userLocation.full_name.includes(replacementLocation.full_name) || (replacementLocation.name == userLocation.country)) { // Check if the Replacement model location's full name is present in User location' full name
						refreshModels.push(refreshModelGr.getUniqueValue());
					}
				}
			}
		}

		if (refreshModels.length > 0) {
			var replacementModelGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REPLACEMENT_MODEL_TABLE);
			replacementModelGr.addEncodedQuery('refresh_modelIN'+refreshModels.join(','));
			replacementModelGr.query();
			while (replacementModelGr.next()) {
				replacementModels.push(replacementModelGr.getValue('hardware_model'));
			}
			return 'sys_idIN'+replacementModels.join(',');
		}
		return 'sys_id=NULL';
	},

	getAssetFilter: function() {
		var gr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
		gr = sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(gr);
		gr.addQuery('assigned_to', gs.getUserID());
		if(sn_hamp.HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			gr.addQuery('model_category.resource_category.opt_in', true);
		}
		return gr.getEncodedQuery();
	},
	
	getPickupLocationFilter: function() {
		// Reference qualifier for Pickup location in catalog request form
		var pickupLocationFilter = 'sys_idIN';
		var userId = gs.getUserID();
		var userGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.USER_TABLE);
		userGr.get(userId);
		var stockroomGr = new GlideRecordSecure('alm_stockroom');
		stockroomGr.addQuery('type', '!=', HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT).addOrCondition('type', '');
		stockroomGr.addQuery('location.country', userGr.location.country);
		stockroomGr.query();
		var locationIds = [];
		// getting the list of stockroom locations in the user's country
		while(stockroomGr.next()) {
			locationIds.push(stockroomGr.getValue('location'));
		}
		return 'sys_idIN'+locationIds.join(',');
	},

	getReturnStockroom: function() {
		var street = this.getParameter('sysparm_street');
		var city = this.getParameter('sysparm_city');
		var state = this.getParameter('sysparm_state');
		var country = this.getParameter('sysparm_country');
		var pickupLocation = this.getParameter('pickup_location');
		var stockroomGr = new GlideRecordSecure('alm_stockroom');
		var result = {};
		// Fetch the stockroom based on pickup location
		if (!gs.nil(pickupLocation)) {
			stockroomGr.addQuery('type', '!=', HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT).addOrCondition('type', '');
			stockroomGr.addQuery('location', pickupLocation);
			stockroomGr.query();
			if (stockroomGr.next()) {
				result['stockroomId'] = stockroomGr.getValue('sys_id');
				return JSON.stringify(result);
			}
		}
		// Fetch the user record
		var userId = gs.getUserID();
		var userGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.USER_TABLE);
		userGr.get(userId);
		// Fetch stockroom record whose location's full name contains user location's full name
		if (userGr.location && userGr.location.full_name) {
			stockroomGr.initialize();
			stockroomGr.addQuery('type', '!=', HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT).addOrCondition('type', '');
			stockroomGr.addQuery('location.full_name', 'CONTAINS', userGr.location.full_name);
			stockroomGr.query();
			if (stockroomGr.next()) {
				result['stockroomId'] = stockroomGr.getValue('sys_id');
				return JSON.stringify(result);
			} else {
				// Fetch parent location
				var location = userGr.location.parent;
				while (!stockroomGr.next() && location && location.country) {
					stockroomGr.initialize();
					// Fetch stockroom record whose location's full name contains location's full name
					stockroomGr.addQuery('type', '!=', HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT).addOrCondition('type', '');
					stockroomGr.addQuery('location.full_name', 'CONTAINS', location.full_name);
					stockroomGr.query();
					if (stockroomGr.next()) {
						result['stockroomId'] = stockroomGr.getValue('sys_id');
						return JSON.stringify(result);
					}
					location = location.parent;
				}
			}
		}
		// Fetch stockroom record whose location's [country, state, city, street] or [country, state, city] or [country, state] or [country] matches with input details
		var stockroomId = HAMZeroTouchAssetRefreshUtils.getStockroom(country, state, city, street) || HAMZeroTouchAssetRefreshUtils.getStockroom(country, state, city) || HAMZeroTouchAssetRefreshUtils.getStockroom(country, state) || HAMZeroTouchAssetRefreshUtils.getStockroom(country);
		if (stockroomId) {
			result['stockroomId'] = stockroomId;
			return JSON.stringify(result);
		}
		return;
	},

	validateAssetSelected : function () {
		// checking whether the selected asset is a part of any other refresh order and getting the appropriate error message
		var assetId = this.getParameter('sysparm_assetId');
		var result;
		var ztrGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE);
		ztrGr.addQuery('asset', assetId);
		ztrGr.addQuery('state', 1); // Open requests
		ztrGr.query();
		if (ztrGr.next()) {
			result = {
				"message": gs.getEscapedMessage('The selected asset {0} is already part of the existing Zero touch refresh request {1}', [ztrGr.asset.getDisplayValue(), ztrGr.getDisplayValue()]) 
			};	
			return JSON.stringify(result);
		}

		var assetGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
		assetGr.get(assetId);

		if (assetGr.refresh_request_line && assetGr.refresh_request_line.stage.toString() !== 'Request Cancelled') {
			result = {
				"message": gs.getEscapedMessage('The selected asset {0} is already part of the existing Hardware asset refresh request {1}', [assetGr.getDisplayValue(), assetGr.refresh_request_line.request.getDisplayValue()])
			};	
			return JSON.stringify(result);
		}
		
		result = {
			"message": '' 
		};	
		return JSON.stringify(result);
		
	},

	validateRefreshedAsset : function () {
		var result;
		var requestId = this.getParameter('sysparm_requestId');
		var requestGr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE);
		requestGr.get(requestId);
		var assetGr = new GlideRecord("alm_hardware");
		assetGr.addQuery('serial_number', requestGr.fulfillment_request.serial_number);
		assetGr.query();
		if(assetGr.next()){
			if(assetGr.getValue('install_status') != 6) {
				result = {
					"message": gs.getEscapedMessage('The asset with given serial number {0} already exists. Make sure it is in state In Stock', [assetGr.getValue('serial_number')])
				};	
				return JSON.stringify(result);
			}
			else if(assetGr.getValue('substatus') != 'available') {
				result = {
					"message": gs.getEscapedMessage('The asset with given serial number {0} already exists. Make sure it is in substate Available', [assetGr.getValue('serial_number')])
				};	
				return JSON.stringify(result);
			}
			else if(assetGr.getValue('model') != requestGr.getValue('replacement_model')){
				result = {
					"message": gs.getEscapedMessage('The asset with given serial number {0} already exists. Make sure it is of the required model', [assetGr.getValue('serial_number')])
				};	
				return JSON.stringify(result);
			}
		}

		result = {
			"message": '' 
		};	
		return JSON.stringify(result);
	},

	type: 'HAMZeroTouchAssetRefreshUtilsAJAX'
});