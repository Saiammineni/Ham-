var HAMZeroTouchRequestUtils = Class.create();
HAMZeroTouchRequestUtils.prototype = {
    initialize: function() {
    },
	catalogItemRefQual: function() {
		return 'modelISNOTEMPTY';
	},
	remoteRecordProducerRefQual: function() {
		return 'active=true';
	},
	variableQuantityRefQual: function(catItem) {
		if (gs.nil(catItem)) {
			return 'sys_id=NULL';
		}
		// Fetch active variables over catalog item
		var gr = new GlideRecord('item_option_new');
		gr.addActiveQuery();
		var query = gr.addQuery('cat_item', catItem);
		// Fetch variables from variable sets defined over catalog item
		var variableSetGR = new GlideRecord('io_set_item');
		variableSetGR.addQuery('sc_cat_item', catItem);
		variableSetGR.query();
		var variableSetIDs = [];
		while (variableSetGR.next()) {
			variableSetIDs.push(variableSetGR.variable_set);
		}
		if (variableSetIDs.length > 0) {
			query.addOrCondition('variable_set', 'IN', variableSetIDs);
		}
		return gr.getEncodedQuery();
	},
	checkIfCatalogItemDefinedOverZTRFlow: function(currentFlow, previousFlow) {
		return (!gs.nil(currentFlow) && (currentFlow == sn_hamp.HAMZeroTouchRequestUtils.ZERO_TOUCH_REQUEST_FLOW_SYS_ID)) || (!gs.nil(previousFlow) && (previousFlow == sn_hamp.HAMZeroTouchRequestUtils.ZERO_TOUCH_REQUEST_FLOW_SYS_ID));
	},
	checkIfCatalogItemMappingExists: function(mapping) {
		var mappingExists = new global.GlideQuery(HAMConstants.CATALOG_ITEM_RRP_MAPPING)
		.where('catalog_item', mapping.catalog_item)
		.where('sys_id', '!=', mapping.getUniqueValue())
		.where('active', true)
		.selectOne('sys_id')
		.isPresent();
		return mappingExists;
	},
	// Validates the catalog item RRP mapping and submits the equivalent RRP for a requested item
	validateAndSubmitRRP: function(reqItem) {
		// Fetch the active catalog item RRP mapping
		var catalogItemMappingGR = new GlideRecord(HAMConstants.CATALOG_ITEM_RRP_MAPPING);
		catalogItemMappingGR.addQuery('catalog_item', reqItem.getValue('cat_item'));
		catalogItemMappingGR.addQuery('active', true);
		catalogItemMappingGR.setLimit(1);
		catalogItemMappingGR.query();
		if (catalogItemMappingGR.next()) {
			var remoteRecordProducer = catalogItemMappingGR.getValue('remote_record_producer');
			// Check if multiple quantity is supported for the RRP and fecth the quantity variable 
			var isMultiQuantitySupported = catalogItemMappingGR.multiple_quantity_supported;
			if (isMultiQuantitySupported) {
				var quantityVariableName = catalogItemMappingGR.quantity_variable.name;
			}
			var catalogItem = new sn_sc.CatItem(remoteRecordProducer);
			var variableElements = reqItem.variables.getElements();
			var variables = {};
			for (var i=0; i<variableElements.length; i++) { 
				var question = variableElements[i].getQuestion();
				// Copy the variable information over RITM to RRP. Override the quantity variable with the actual requested quantity
				if (isMultiQuantitySupported && !gs.nil(quantityVariableName) && question.getName() == quantityVariableName) {
					variables[question.getName()] = reqItem.getValue('quantity');
					// Override quantity variable of RITM with requested quantity
					reqItem.variables[quantityVariableName] = reqItem.getValue('quantity');
				} else {
					variables[question.getName()] = question.getValue();
				}
			}
			var recordProducer2VariableData = { 
				"variables":  variables,
				"sysparm_id": remoteRecordProducer
			};

			var quantity = isMultiQuantitySupported ? 1 : reqItem.getValue('quantity');
			// Based on support for multiple quantity submit the RRP. If multi quantity is supported then RRP is submitted only once.
			var providerTaskIds = [];
			for (var j=0; j<quantity; j++ ) {
				var providerTask = catalogItem.submitProducer(recordProducer2VariableData);
				if (!gs.nil(providerTask.sys_id)) {
					// Inserting provider task mapping
					new global.GlideQuery(HAMConstants.PROVIDER_TASK_MAPPING)
						.insert({source_table: HAMConstants.SOURCE_REQUEST_ITEM_TABLE, source_request: reqItem.sys_id, provider_task: providerTask.sys_id});
					providerTaskIds.push(providerTask.number);
				}
			}
			// Adding a comment over RITM
			if (providerTaskIds.length == quantity) {
				if (providerTaskIds.length > 1) {
					reqItem.comments = gs.getEscapedMessage('Request is submitted to provider using provider tasks: {0}', providerTaskIds.join(', '));
				} else { // Quantity is 1
					reqItem.comments = gs.getEscapedMessage('Request is submitted to provider using provider task: {0}', providerTaskIds[0]);
				}
			} else {
				if (providerTaskIds.length == 0) {
					reqItem.comments = gs.getEscapedMessage("Request is not submitted to provider. For more details, contact system administrator.");
					reqItem.update();
					return false;
				} else { // Request is partially submitted to provider
					if (providerTaskIds.length > 1) {
						reqItem.comments = gs.getEscapedMessage("Request for only quantity {0} is submitted to provider using provider tasks: {1}. For more details, contact system administrator.", providerTaskIds.length, providerTaskIds.join(', '));
					} else { // Quantity is 1
						reqItem.comments = gs.getEscapedMessage('Request for only quantity 1 is submitted to provider using provider task: {0}. For more details, contact system administrator.', providerTaskIds[0]);
					}
				}
			}
			reqItem.update();
		} else {
			reqItem.comments = gs.getEscapedMessage("Request is not submitted to provider. For more details, contact system administrator.");
			reqItem.update();
			return false;
		}
		return true;
	},
	// Checks if RITM be progressed based on provider task mapping stage
	canRITMBeProgressed: function(reqItemSysID, stage) {
		var taskMappingGR = new GlideRecord(HAMConstants.PROVIDER_TASK_MAPPING);
		taskMappingGR.addQuery('source_table', HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
		taskMappingGR.addQuery('source_request', reqItemSysID);
		var qr = taskMappingGR.addNullQuery('status');
		if (stage == 'fully_shipped') {
			qr.addOrCondition('status', 'confirmed');
		} else if (stage == 'received') {
			qr.addOrCondition('status', 'confirmed');
			qr.addOrCondition('status', 'partially_shipped');
		}
		taskMappingGR.query();
		return !taskMappingGR.hasNext();
	},
	closeTask: function(reqItem, taskName) {
		new global.GlideQuery(HAMConstants.ZERO_TOUCH_REQUEST_TASK)
			.where('zero_touch_request', reqItem.getUniqueValue())
			.where('task_name', taskName)
			.updateMultiple({ state: 3});
	},
	updateProviderTaskMappings: function(reqItemID, taskName) {
		var taskMappingGR = new GlideRecord(HAMConstants.PROVIDER_TASK_MAPPING);
		taskMappingGR.addQuery('source_table', HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
		taskMappingGR.addQuery('source_request', reqItemID);
		var qr = taskMappingGR.addNullQuery('status');
		if (taskName == 'request_shipment') {
			qr.addOrCondition('status', 'confirmed');
		} else if (taskName == 'receive_asset') {
			qr.addOrCondition('status', 'confirmed');
			qr.addOrCondition('status', 'partially_shipped');
			qr.addOrCondition('status', 'fully_shipped');
		}
		taskMappingGR.query();
		// Status based on task name
		if (taskName == 'request_confirmation') {
			taskMappingGR.status = 'confirmed';
		} else if (taskName == 'request_shipment') {
			taskMappingGR.status = 'fully_shipped';
		} else {
			taskMappingGR.status = 'received';
		}
		taskMappingGR.updateMultiple();
	},
	/* Method to create task. */	
	createTask: function(reqItem, providerTaskMappingGR, taskName, shortDescription) {
		var task = new global.GlideQuery(HAMConstants.ZERO_TOUCH_REQUEST_TASK)
			.insert({assigned_to: reqItem.requested_for, zero_touch_request: reqItem.getUniqueValue(), task_name: taskName, sys_domain: reqItem.sys_domain, short_description: shortDescription})
			.get();
		return task.sys_id;
	},
	updateTaskWorkNotes: function(reqItemID, taskName, msg) {
		var taskGR = new GlideRecord(HAMConstants.ZERO_TOUCH_REQUEST_TASK);
		taskGR.addQuery('zero_touch_request', reqItemID);
		taskGR.addQuery('task_name', taskName);
		taskGR.setLimit(1);
		taskGR.query();
		if (taskGR.next()) {
			taskGR.work_notes = msg;
			taskGR.update();
		}
	},
	/* Method to create or get shipment */	
	getOrCreateShipment: function(reqItemID, trackingNumber, carrier, shipDate, shippedBy, shippedTo, shippedFrom) {
		var additionalDetails = {carrier: null};
		var shippingCarrier = null;
		if (!gs.nil(carrier)) {
			var carrierGr = new GlideRecord('sn_itam_common_shipping_carrier');
			carrierGr.addQuery('name', carrier);
			carrierGr.query();
			if (carrierGr.next()) {
				additionalDetails = {carrier: carrierGr.getUniqueValue()};
				shippingCarrier = carrierGr.getUniqueValue();
			}
		}
		var shipmentId = sn_itam_common.ShipmentUtils.getOrCreateShipment(trackingNumber, HAMConstants.SOURCE_REQUEST_ITEM_TABLE,  String(reqItemID), shippingCarrier, shippedFrom, shippedTo, shipDate, shippedBy, additionalDetails);
		return shipmentId;
	},
	/* Method to add asset to the shipment. */	
	addAssetToShipment: function(shipmentId, reqItemID, assetGr, domainID) {
		sn_itam_common.ShipmentUtils.addAssetToShipment(shipmentId, assetGr.getUniqueValue(),
			String(assetGr.model.sys_id), assetGr.quantity, String(reqItemID), HAMConstants.SOURCE_REQUEST_ITEM_TABLE, null, domainID);
	},
	getModel: function(modelNumber) {
        var modelGr = new GlideRecord(global.AssetManagementConstants.MODEL_CLASSES.PRODUCT_MODEL);
        modelGr.addQuery('model_number', modelNumber);
        modelGr.query();
        if (modelGr.next()) {
            return modelGr;
        }
        return '';
    },
	getModelCategory: function(modelGr) {
        var modelCategories = modelGr.cmdb_model_category;
		if (gs.nil(modelCategories)) {
			return;
		}
        var modelCategoriesArr = modelCategories.split(',');
        return modelCategoriesArr[0];
    },
	getAssetClass: function(modelCat) {
        var assetClass;
        var model_category_gr = new GlideRecord('cmdb_model_category');
        model_category_gr.get(modelCat);
        if (!gs.nil(model_category_gr.asset_class)) {
            assetClass = model_category_gr.asset_class;
        }
        return assetClass;

    },
	updateExistingAsset: function(assetGr, assetDetails, requestedFor, result) {
		assetGr.setValue('asset_tag', assetDetails["assetTag"]);
		assetGr.setValue('install_status', global.AssetManagementConstants.ASSET_STATUSES.IN_TRANSIT);
		assetGr.setValue('substatus', global.AssetManagementConstants.ASSET_SUB_STATUSES.RESERVED);
		assetGr.setValue('reserved_for', requestedFor);
		assetGr.update();
		result.assetID = assetGr.getUniqueValue();
		return result;
	},
	createAsset: function(assetDetails, requestedFor, result) {
		var modelCat;
		var assetClass;
		var modelId;
		var modelGr = this.getModel(assetDetails["modelNumber"]);
		if (gs.nil(modelGr)) {
			modelId = HAMConstants.UNKNOWN_MODEL_SYS_ID;
			modelCat = HAMConstants.UNKNOWN_MODEL_CATEGORY_SYS_ID;
			assetClass = global.AssetManagementConstants.ASSET_CLASSES.ASSET;
		} else {
			modelId = modelGr.getUniqueValue();
			var type = (new global.AssetUtils()).getAssetOrConsumable(modelGr);
			if (type == 'consumable') {
				modelCat = HAMConstants.CONSUMABLE_MODEL_CATEGORY_SYS_ID;
				assetClass = global.AssetManagementConstants.ASSET_CLASSES.CONSUMABLE;
				result.status = 'consumable_asset';
			} else {
				modelCat = this.getModelCategory(modelGr);
				if (gs.nil(modelCat)) {
					modelCat = HAMConstants.UNKNOWN_MODEL_CATEGORY_SYS_ID;
					assetClass = global.AssetManagementConstants.ASSET_CLASSES.ASSET;
				} else {
					assetClass = this.getAssetClass(modelCat);
				}
			}
		}
        var assetGr = new GlideRecord(assetClass);
        assetGr.initialize();
        assetGr.setValue('model', modelId);
        // Asset model category is the first model category of the model
        assetGr.model_category = modelCat;
		if (!gs.nil(assetDetails["assetTag"])) {
			assetGr.setValue('asset_tag', assetDetails["assetTag"]);
		}
		if (!gs.nil(assetDetails["serialNumber"])) {
			assetGr.setValue('serial_number', assetDetails["serialNumber"]);
		}
		if (gs.nil(assetDetails["assetTag"]) && gs.nil(assetDetails["serialNumber"])){
			result.modelName = modelGr.getValue('display_name');
			// For consumable status would be already set as consumable_asset
			if (gs.nil(result.status)) {
				result.status = 'blank_asset';
			}
		}
        assetGr.setValue('install_status', global.AssetManagementConstants.ASSET_STATUSES.IN_TRANSIT);
        assetGr.setValue('substatus', global.AssetManagementConstants.ASSET_SUB_STATUSES.RESERVED);
        assetGr.setValue('reserved_for', requestedFor);
        result.assetID = assetGr.insert();
		return result;
	},
	// Check if asset exists with given details and update else create the asset
	createOrUpdateAsset: function(assetDetails, requestedFor) {
		var result = {
			assetID : '',
			modelName: '',
			status : ''
		};
		var assetGr = new GlideRecord(global.AssetManagementConstants.ASSET_CLASSES.ASSET);
		if(!gs.nil(assetDetails["serialNumber"])) {
			// Checking if serial number is not empty. For Ex: consumables will not have serial number
			assetGr.addQuery('serial_number', assetDetails["serialNumber"]);
			assetGr.setLimit(1);
			assetGr.query();
			if (assetGr.next()) {
				// Check if existing asset is in state 'In Stock', substate 'Available' and of the required model
				if (assetGr.getValue('install_status') == global.AssetManagementConstants.ASSET_STATUSES.IN_STOCK &&
					assetGr.getValue('substatus') == global.AssetManagementConstants.ASSET_SUB_STATUSES.AVAILABLE) {
					// Updation of existing asset
					return this.updateExistingAsset(assetGr, assetDetails, requestedFor, result);
				} else {
					result.status = 'duplicate_asset';
					return result;
				}
			} else {
				// Creation of asset
				return this.createAsset(assetDetails, requestedFor, result);
            }
		} else {
			// Creation of asset
			return this.createAsset(assetDetails, requestedFor, result);
		}
	},
	processScratchPad: function(scratchPadGR) {
		// Check if scratch pad is for ZTR
		var updateJSON;
		try {
			updateJSON = JSON.parse(scratchPadGR.getValue('value'));
		} catch (error) {
			return;
		}
		if (gs.nil(updateJSON)) {
			return;
		}
		var providerTaskMappingGR = new GlideRecord(HAMConstants.PROVIDER_TASK_MAPPING);
		providerTaskMappingGR.addQuery('provider_task', scratchPadGR.getValue('task'));
		providerTaskMappingGR.setLimit(1);
		providerTaskMappingGR.query();
		if (!providerTaskMappingGR.next()) {
			return;
		} else {
			// Check for Integration profile and proceed accordingly
			var classObj;
			new global.GlideQuery(HAMConstants.PROVIDER_INTEGRATION_PROFILE)
				.where('provider', providerTaskMappingGR.provider_task.company)
				.where('active', true)
				.whereNotNull('api')
				.selectOne('api')
				.ifPresent(function (integrationProfile) {
					classObj = global.AssetUtils.getClassFromName(integrationProfile.api);
					updateJSON = new classObj()['transformScratchPadToHAMZTRFormat'](updateJSON);
				});
			var orderStatus = updateJSON['orderStatus'];
			if(gs.nil(orderStatus)) {
				return;
			}
			var reqItem = new GlideRecord(HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
			reqItem.get(providerTaskMappingGR.source_request);
			var reqItemID = reqItem.getUniqueValue();
			if (orderStatus == 'confirmed') {
				// Updating the status of provider task with order status
				providerTaskMappingGR.status = 'confirmed';
				providerTaskMappingGR.update();
				// Updating the work notes of confirmation task
				this.updateTaskWorkNotes(reqItemID, 'request_confirmation', gs.getEscapedMessage('Scratch pad from provider over {0} : {1}', [providerTaskMappingGR.getDisplayValue('provider_task'), scratchPadGR.getValue('value')]));
				if (this.canRITMBeProgressed(reqItemID, 'confirmed')) {
					this.closeTask(reqItem, 'request_confirmation');
				} else {
					this.createTask(reqItem, providerTaskMappingGR, 'request_shipment', 'Zero touch shipment by provider');
				}
			}
			else if (orderStatus == 'partially_shipped' || orderStatus == 'fully_shipped') {
				// Updating the status of provider task with order status
				providerTaskMappingGR.status = orderStatus;
				providerTaskMappingGR.update();
				// Updating the work notes of shipment task
				this.updateTaskWorkNotes(reqItemID, 'request_shipment', gs.getEscapedMessage('Scratch pad from provider over {0} : {1}', [providerTaskMappingGR.getDisplayValue('provider_task'), scratchPadGR.getValue('value')]));
				if (orderStatus == 'fully_shipped') {
					if (this.canRITMBeProgressed(reqItemID, 'fully_shipped')) {
						this.closeTask(reqItem, 'request_shipment');
					}
				}
				var orderLineItems = updateJSON['orderLineItems'];
				if (gs.nil(orderLineItems)) {
					return;
				}
				// Process line items with status as shipped to skip re-processing
				for (var i=0; i< orderLineItems.length; i++) {
					var orderLineItem = orderLineItems[i];
					// Skip processing the line item if status is not shipped or if tracking number or carrier is missing
					if (gs.nil(orderLineItem.status) || orderLineItem.status !== 'shipped' || gs.nil(orderLineItem.trackingNumber) || gs.nil(orderLineItem.carrier)) {
						continue;
					}
					var result = this.createOrUpdateAsset(orderLineItem, reqItem.requested_for);
					if (!gs.nil(result) && !gs.nil(result.status)) {
						var users = [];
						// List of users with asset role
						var userRole = new GlideRecord('sys_user_has_role');
						userRole.addQuery('role.name', 'asset');
						userRole.query();
						while(userRole.next()){
							users.push(userRole.getValue('user'));
						}
						var msg;
						if (result.status == 'duplicate_asset') {
							msg = "Asset with serial number: " + orderLineItem.serialNumber + " shipped by the external provider as part of the Zero touch request: " + reqItem.number + " already exists. Please check with the requester upon receipt of the asset and update the State, Substate and Assigned to fields of the asset. Also, take necessary action for the closure of the request.";
						} else if (result.status == 'blank_asset' && !gs.nil(result.modelName)) {
							msg = "Asset of model: " + result.modelName + " without an asset tag and serial number is shipped by the external provider as part of the Zero touch request: " + reqItem.number + ". Please check with the requester upon receipt of the asset and update the Asset tag, Serial number, State, Substate and Assigned to fields of the asset. Also, take necessary action for the closure of the request.";
						} else if (result.status == 'consumable_asset' && !gs.nil(result.modelName)) {
							msg = "Consumable asset of model: "+ result.modelName + " is shipped by the external provider as part of the Zero touch request: " + reqItem.number + ". Please check with the requester upon receipt of the asset and update the State, Substate and Assigned to fields of the consumable asset accordingly. Also take necessary action for the closure of the request.";
						}
						// Trigger the event which inturn creates email notification
						gs.eventQueue("sn_hamp.zero_touch_request.shipment", reqItem, users, msg);
					}
					// Create shipment record if asset creation is successful
					if (!gs.nil(result.assetID)) {
						var shipmentId = this.getOrCreateShipment(String(reqItemID), orderLineItem['trackingNumber'], orderLineItem['carrier'], new GlideDateTime());
						var assetGr = new GlideRecord(global.AssetManagementConstants.ASSET_CLASSES.ASSET);
						assetGr.get(result.assetID);
						this.addAssetToShipment(shipmentId, reqItemID, assetGr, reqItem.sys_domain);
					}
				}
			}
		}
	},
	checkAndUpdateShipmentAsset: function(assetID) {
		var shipmentAssetGR = new GlideRecord('sn_itam_common_m2m_shipment_asset');
		shipmentAssetGR.addQuery('asset', assetID);
		shipmentAssetGR.addQuery('source_table', HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
		shipmentAssetGR.setLimit(1);
		shipmentAssetGR.query();
		if (shipmentAssetGR.next()) {
			var shipmentID = shipmentAssetGR.getValue('shipment');
			var reqItemID = shipmentAssetGR.getValue('source_id');
			// Check and proceed only if the requsted item is of zero touch request based on entry in provider task mapping
			var providerTaskMappingGR = new GlideRecord(HAMConstants.PROVIDER_TASK_MAPPING);
			providerTaskMappingGR.addQuery('source_table', HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
			providerTaskMappingGR.addQuery('source_request', reqItemID);
			providerTaskMappingGR.setLimit(1);
			providerTaskMappingGR.query();
			if (!providerTaskMappingGR.hasNext()) {
				return;
			}
			// Update the shipment asset
			sn_itam_common.ShipmentUtils.closeShipmentAsset(shipmentID, assetID);
			// Close the shipment
			sn_itam_common.ShipmentUtils.closeShipmentOrder(shipmentID, new GlideDateTime());
			// Check if there are other shipment assets in In-transit state against same RITM
			shipmentAssetGR.initialize();
			shipmentAssetGR.addQuery('source_table', HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
			shipmentAssetGR.addQuery('source_id', reqItemID);
			shipmentAssetGR.addQuery('asset_stage', '!=', sn_itam_common.ShipmentUtils.SHIPMENT_ASSET_STAGES.DELIVERED);
			shipmentAssetGR.query();
			if (!shipmentAssetGR.hasNext()) {
				// Check for other provider task mappings
				if (this.canRITMBeProgressed(reqItemID, 'received')) {
					// Mark provider task mapping as received
					this.updateProviderTaskMappings(reqItemID, 'receive_asset');
					// Mark RITM as received and closed complete
					var reqItem = new GlideRecord(HAMConstants.SOURCE_REQUEST_ITEM_TABLE);
					reqItem.get(reqItemID);
					reqItem.received = true;
					reqItem.state = 3;
					reqItem.update();
				}
			}
		}
	},
    type: 'HAMZeroTouchRequestUtils'
};
HAMZeroTouchRequestUtils.ZERO_TOUCH_REQUEST_FLOW_SYS_ID = '40822a2b77e00210c5cd99f69c5a997a';