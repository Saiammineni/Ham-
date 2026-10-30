var HAMZeroTouchAssetRefreshUtils = Class.create();
HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE = 'alm_hardware';
HAMZeroTouchAssetRefreshUtils.LOCATION_TABLE = 'cmn_location';
HAMZeroTouchAssetRefreshUtils.USER_TABLE = 'sys_user';
HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REQ_TABLE = 'sn_hamp_ztr_request';
HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_TASK_TABLE = 'sn_hamp_ztr_task';
HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_MODEL_TABLE = 'sn_hamp_ztr_refresh_model';
HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REPLACEMENT_MODEL_TABLE = 'sn_hamp_m2m_ztr_replacement_model';
HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT = 'e2aa2b3f3763100044e0bfc8bcbe5dde';
HAMZeroTouchAssetRefreshUtils.prototype = {
    initialize: function() {
    },
	markActiveTaskClosedIncomplete: function(request) {
		// Marking all the open tasks as closed incomplete
		var gr = new GlideRecordSecure(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_TASK_TABLE);
		gr.addQuery('zero_touch_req', request.sys_id);
		gr.addQuery('state', 1);
		gr.query();
		while (gr.next()) {
			gr.setValue('state', 4);
			gr.update();
		}
	},
	type: 'HAMZeroTouchAssetRefreshUtils'
};
HAMZeroTouchAssetRefreshUtils.getStockroom = function(country, state, city, street) {
	var stockroomGr = new GlideRecordSecure('alm_stockroom');
	stockroomGr.addQuery('type', '!=', HAMZeroTouchAssetRefreshUtils.STOCKROOM_TYPE_FIELD_AGENT).addOrCondition('type', '');
	if (country) {
		stockroomGr.addQuery('location.country', country);
	}
	if (state) {
		stockroomGr.addQuery('location.state', state);
	}
	if (city) {
		stockroomGr.addQuery('location.city', city);
	}
	if (street) {
		stockroomGr.addQuery('location.street', street);
	}
	stockroomGr.query();
	if (stockroomGr.next()){
		return stockroomGr.sys_id;
	}
	return;		
};
HAMZeroTouchAssetRefreshUtils.validateAccessToCloseTask = function(taskName, requestedFor) {
	var hasInventoryRole = gs.hasRole('inventory_user');
	var hasAssetRole = gs.hasRole('asset');
	if (taskName == 'ready_for_pickup' || taskName == 'receive_return_asset' || taskName == 'asset_evaluation') {
		return hasInventoryRole;
	} else if (taskName == 'receive_asset') {
		return hasAssetRole || requestedFor == gs.getUserID();
	} else {
		return false;
	}
};
HAMZeroTouchAssetRefreshUtils.validateAccessToUpdateTask = function(taskName, requestedFor) {
	var hasInventoryRole = gs.hasRole('inventory_user');
	var hasAssetRole = gs.hasRole('asset');
	switch (taskName) {
	case 'ready_for_pickup':
		return hasInventoryRole;
	case 'receive_asset':
		return hasAssetRole || requestedFor == gs.getUserID();
	case 'receive_return_asset':
		return hasInventoryRole;
	case 'asset_evaluation':
		return hasInventoryRole;
	default:
		return hasAssetRole;
	}	
};
/* Method to create shipment add shipment asset. */	
HAMZeroTouchAssetRefreshUtils.createShipmentForZTR = function(taskID, assetID, trackingNumber, carrier, shipDate, shippedBy, shippedTo, shippedFrom, domainId) {
	var additionalDetails, shippingCarrier;
	var carrierGr = new GlideRecord('sn_itam_common_shipping_carrier');
	carrierGr.addQuery('name', carrier);
	carrierGr.query();
	if (!carrierGr.next()) {
		additionalDetails = {carrier: null};
		shippingCarrier = null;
	} else {
		additionalDetails = {carrier: carrierGr.getUniqueValue()};
		shippingCarrier = carrierGr.getUniqueValue();
	}
	var assetGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
	assetGr.get(assetID);
	var shipmentId = sn_itam_common.ShipmentUtils.getOrCreateShipment(trackingNumber, HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_TASK_TABLE,  String(taskID), shippingCarrier, shippedFrom, shippedTo, shipDate, shippedBy, additionalDetails);
	sn_itam_common.ShipmentUtils.addAssetToShipment(shipmentId, assetGr.getUniqueValue(),
		String(assetGr.model.sys_id), assetGr.quantity, String(taskID), 
	HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_TASK_TABLE, null, null);
};

/* Method to close the shipment asset and shipment. */	
HAMZeroTouchAssetRefreshUtils.closeShipmentForZTR = function(taskID, assetID, receivedDate, receivedBy) {
	var m2mGr = new GlideRecord('sn_itam_common_m2m_shipment_asset');
	m2mGr.addQuery('source_table', HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_TASK_TABLE);
	m2mGr.addQuery('source_id', taskID);
	m2mGr.addQuery('asset', assetID);
	m2mGr.query();
	if (m2mGr.next()) {
		var shipmentID = m2mGr.getValue('shipment');
		sn_itam_common.ShipmentUtils.closeShipmentAsset(shipmentID, assetID);
		sn_itam_common.ShipmentUtils.closeShipmentOrder(shipmentID, receivedDate, receivedBy);
	}
};

/* Method to identify the provider from thr replacement model. Currently selects the first provider that services the replacement model in the location */
HAMZeroTouchAssetRefreshUtils.getProviderFromReplacementModel = function(assetId, userId, replacementModel) {
	var assetGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.HARDWARE_ASSET_TABLE);
	assetGr.get(assetId);
	var userGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.USER_TABLE);
	userGr.get(userId);

	if (assetGr.location && assetGr.location.full_name) {
		locationValue = assetGr.location;
	}
	else if (userGr.location && userGr.location.full_name) {
		locationValue = userGr.location;
	}
	else {
		return;
	}

	var replacementModelGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_REPLACEMENT_MODEL_TABLE);
	replacementModelGr.addQuery('hardware_model', replacementModel);
	replacementModelGr.addQuery('refresh_model.model', assetGr.model);
	replacementModelGr.addQuery('refresh_model.active', true);
	replacementModelGr.query();

	while(replacementModelGr.next()) {
		var refreshModelGr = new GlideRecord(HAMZeroTouchAssetRefreshUtils.ZERO_TOUCH_REFRESH_MODEL_TABLE);
		refreshModelGr.get(replacementModelGr.getValue('refresh_model'));
		replacementLocation = refreshModelGr.location;
		if (replacementLocation && replacementLocation.full_name && locationValue && locationValue.full_name) {
			if (locationValue.full_name.includes(replacementLocation.full_name) || (replacementLocation.name == locationValue.country)) { // Check if the Replacement model location's full name is present in location full name
				return refreshModelGr.getValue('provider');
			}
		}
	}
	return;
};

HAMZeroTouchAssetRefreshUtils.assetRefQual = function () {
		var filter = 'sys_class_name=alm_hardware';
		return filter;
};

HAMZeroTouchAssetRefreshUtils.refreshedAssetRefQual = function () {
		var filter = 'sys_class_name=alm_hardware';
		return filter;
};

HAMZeroTouchAssetRefreshUtils.replacementModelRefQual = function () {
		return HAMZeroTouchAssetRefreshUtils.hardwareModelWithTNIRefQual();
};

HAMZeroTouchAssetRefreshUtils.refreshModelRefQual = function () {
		return HAMZeroTouchAssetRefreshUtils.hardwareModelWithTNIRefQual();
};

HAMZeroTouchAssetRefreshUtils.hardwareModelWithTNIRefQual = function () {
		var tableName = 'cmdb_hardware_product_model';
		var gr = new GlideRecord(HAMConstants.MODEL_TABLE);
		if (!HAMUtils.HAS_TNI_ENTITLEMENT) {
			// Only HAM entitlement
			gr.addQuery('sys_class_name', tableName);
		} else {
			var hardwareModelTableExtensions = HAMUtils.getTableExtensions(tableName);
			var tniModelCatgegories = HAMTNIUtils.getTNIModelCategories(); 
			if (HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
				// Only TNI entitlement
				gr.addQuery('sys_class_name', 'IN', hardwareModelTableExtensions);
				gr.addQuery('cmdb_model_category', 'IN', tniModelCatgegories);
			} else {
				// HAM + TNI entitlement
				var query = new global.GlideQuery(HAMConstants.MODEL_TABLE)
						.where('sys_class_name', tableName)
						.orWhere(new global.GlideQuery()
							.where('sys_class_name', 'IN', hardwareModelTableExtensions)
							.where('cmdb_model_category', 'IN', tniModelCatgegories));
				gr = query.toGlideRecord();
			}		
		}
		return gr.getEncodedQuery();
};

HAMZeroTouchAssetRefreshUtils.hardwareModelRefQual = function () {
		return HAMZeroTouchAssetRefreshUtils.hardwareModelWithTNIRefQual();
};