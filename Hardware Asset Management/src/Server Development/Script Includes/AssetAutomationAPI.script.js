var AssetAutomationAPI = Class.create();
AssetAutomationAPI.HARDWARE_SUBSTATUS_INUSE = 'in_use';
AssetAutomationAPI.HARDWARE_STATUS_INUSE = 'installed';
AssetAutomationAPI.HARDWARE_STATUS_INSTOCK_PENDINGDISPOSAL = 'in_disposition';
AssetAutomationAPI.INUSE_STATUS = 1;
AssetAutomationAPI.CONSUMED_STATUS = 10;
AssetAutomationAPI.INSTOCK_STATUS = 6;
AssetAutomationAPI.RETIRED_STATUS = 7;
AssetAutomationAPI.INTRANSIT_STATUS = 9;
AssetAutomationAPI.DISPOSAL_SUBSTATUS = 'pending_disposal';
AssetAutomationAPI.DISPOSED_SUBSTATUS = 'disposed';
AssetAutomationAPI.PENDINGINSTALL_SUBSTATUS = 'pending_install';
AssetAutomationAPI.ASSET_TABLE = 'alm_asset';
AssetAutomationAPI.CONSUMABLE_TABLE = 'alm_consumable';
AssetAutomationAPI.USER_TABLE = 'sys_user';
AssetAutomationAPI.CI_TABLE = 'cmdb_ci';
AssetAutomationAPI.CI_COMPUTER_TABLE = 'cmdb_ci_computer';
AssetAutomationAPI.DEVICE_ALLOCATION_TABLE = 'alm_entitlement_asset';
AssetAutomationAPI.CONTRACT_ASSET_M2M_TABLE = 'clm_m2m_contract_asset';
AssetAutomationAPI.STOCKROOM_TABLE = 'alm_stockroom';
AssetAutomationAPI.TRANSFER_ORDER_LINE_TABLE = 'alm_transfer_order_line';
AssetAutomationAPI.MAINTENANCE_CONTRACT_MODEL = 'a581e836c3102000b959fd251eba8fba';
AssetAutomationAPI.MANDATORY_ERROR = 'mandatory_field_null';
AssetAutomationAPI.NOT_MATCH = 'asset_ci_not_match';
AssetAutomationAPI.CONSUME_ASSET_TASK_TABLE = 'consume_asset_task';
AssetAutomationAPI.STAGE_TASK_NAME = 'stage';
AssetAutomationAPI.INCIDENT = 'incident';
AssetAutomationAPI.isAssetActionMandatory = function(sourceTableName, recordDomain) {
	var propertyName = 'sn_hamp.enable_asset_action_validation_' + sourceTableName;
	var propertyValue = '';
	var result = true;
	propertyValue = GlideApplicationProperty.getValue(propertyName, recordDomain);
	if (!gs.nil(propertyValue) && propertyValue === 'false') {
		result = false;
	}
	return result;
};
AssetAutomationAPI.prototype = {
	initialize: function () {
		this.currentTime = new GlideDateTime();
	},
	// perform actions on planned assets and update asset fields based on the action
	completeAssetDisposalTask: function (current, action) {
		var inputParams = {};
		var assetId = current.hardware;
		var assetDisposalUtils = new AssetDisposalUtils();
		if (action === 'verify') {
			current.stage = 'verified';
			inputParams.install_status = AssetAutomationAPI.RETIRED_STATUS;
			inputParams.substatus = AssetAutomationAPI.DISPOSAL_SUBSTATUS;
			assetDisposalUtils.updateAssetCount(current, 'verified');
		} else if (action === 'depart') {
			if (!gs.nil(current.hardware.disposal_order_number)) {
				current.stage = 'already_disposed';
				current.update();
				return;
			}
			current.stage = 'in_transit';
			inputParams.install_status = AssetAutomationAPI.INTRANSIT_STATUS;
			inputParams.substatus = AssetAutomationAPI.DISPOSAL_SUBSTATUS;
			inputParams.disposal_order_number = current.hardware_disposal;
			assetDisposalUtils.updateAssetCount(current, 'departed');
		} else if (action === 'dispose') {
			current.stage = 'completed';
			inputParams.install_status = AssetAutomationAPI.RETIRED_STATUS;
			inputParams.substatus = AssetAutomationAPI.DISPOSED_SUBSTATUS;
			inputParams.disposal_date = this.currentTime.getDate();
		}
		var assetGr = this.getAssetRecord(assetId);
		this.updateAssetAttributes(assetGr, inputParams);
		current.update();
	},
	getUserRecord: function (userSysId) {
		var userGr = new global.GlideQuery(AssetAutomationAPI.USER_TABLE)
			.get(userSysId, ['location']);
		return userGr;
	},
	getCIRecord: function (ciSysId) {
		var ciGr = new global.GlideQuery(AssetAutomationAPI.CI_TABLE)
			.where('sys_id', ciSysId)
			.limit(1)
			.toGlideRecord();
		ciGr.query();
		ciGr.next();
		return ciGr;
	},
	updateAssetAttributes: function (assetGr, assetObj) {
		var assetfield;
		for (assetfield in assetObj) {
			// SetValue does not work for work_notes
			if (assetfield === 'work_notes') {
				assetGr.work_notes = assetObj.work_notes;
			} else {
				assetGr.setValue(assetfield, assetObj[assetfield]);
			}
		}
		assetGr.update();
	},
	getAssetRecord: function (assetId) {
		var assetGr = new global.GlideQuery(AssetAutomationAPI.ASSET_TABLE)
			.where('sys_id', assetId)
			.limit(1)
			.toGlideRecord();
		assetGr.query();
		assetGr.next();
		return assetGr;
	},

	/* Returns Stockroom that has this location
	or its ancestor in its Service Location related list */
	findStockroomInChannel: function (location) {
		var inventoryUtil = new sn_itam_common.InventoryUtil;
		var parentLocations = inventoryUtil._getAllParentLocations(location);

		var stockroomGr = new GlideRecord("sn_itam_common_m2m_stockroom_location");
		stockroomGr.addQuery('location', 'IN', parentLocations);
		stockroomGr.addQuery('active', true);
		//Prioritize exact location and then ancestors
		stockroomGr.orderByDesc('location.full_name');
		//If multiple stockrooms support the same location - use higher priority Stockroom
		stockroomGr.orderByDesc('stockroom.type.priority');
		stockroomGr.query();
		var stockroomsServingLoc = [];
		while(stockroomGr.next()) {
			var index = stockroomsServingLoc.indexOf(stockroomGr.getValue("stockroom"));
			if (index == -1) {
				stockroomsServingLoc.push(stockroomGr.getValue("stockroom"));
			}
		}
		//Remove all those stockrooms where any of the parent location is active false
		stockroomsServingLoc = inventoryUtil._removeInactiveLocationStockrooms(stockroomsServingLoc, parentLocations);
		return stockroomsServingLoc.length > 0 ? stockroomsServingLoc[0] : '';
	},

	findStockroom: function (location) {
		var stockroom = '';
		if (!gs.nil(location)) {
			// Get stockroom with highest priority with location same as user location
			var sr = new global.GlideQuery(AssetAutomationAPI.STOCKROOM_TABLE)
				.where('location', location)
				.orderByDesc('type.priority')
				.limit(1)
				.select('sys_id')
				.toArray(1);
			if (sr.length > 0) {
				stockroom = sr[0].sys_id;
			} else {
				stockroom = this.findStockroomInChannel(location);
			}
		}
		return stockroom;
	},
	// Remove device allocations
	removeDeviceAlloc: function (ciId) {
		new global.GlideQuery(AssetAutomationAPI.DEVICE_ALLOCATION_TABLE)
			.where('allocated_to', ciId)
			.del();
	},
	// Update contract information
	removeContractInfo: function (assetId) {
		new global.GlideQuery(AssetAutomationAPI.CONTRACT_ASSET_M2M_TABLE)
			.where('asset', assetId)
			.where('contract.contract_model', AssetAutomationAPI.MAINTENANCE_CONTRACT_MODEL)
			.whereNull('removed')
			.updateMultiple({
				removed: this.currentTime.getDate(),
			});
	},
	validateAssetCI: function (ciId, assetId, action, type) {
		var validationMessage = {};
		var assetRecord;
		var ciRecord;
		// Either CI or asset should be provided
		if (gs.nil(ciId) && gs.nil(assetId)) {
			throw new Error(action + ' aborted: Either ' + type + ' asset or CI should be provided');
		} else if (!gs.nil(ciId) && gs.nil(assetId)) {
			// If only CI provided
			ciRecord = this.getCIRecord(ciId);
			if (!gs.nil(ciRecord.getValue('asset'))) {
				assetRecord = this.getAssetRecord(ciRecord.getValue('asset'));
				validationMessage.assetRecord = assetRecord;
			}
			validationMessage.ciRecord = ciRecord;
		} else if (!gs.nil(assetId) && gs.nil(ciId)) {
			// If only asset provided
			assetRecord = this.getAssetRecord(assetId);
			if (!gs.nil(assetRecord.getValue('ci'))) {
				ciRecord = this.getCIRecord(assetRecord.getValue('ci'));
				validationMessage.ciRecord = ciRecord;
			}
			validationMessage.assetRecord = assetRecord;
		} else {
			// If both are provided, they should be correct pair
			ciRecord = this.getCIRecord(ciId);
			assetRecord = this.getAssetRecord(assetId);
			var isMatching = (ciRecord.getValue('asset') === assetId)
			&& (assetRecord.getValue('ci') === ciId);
			if (!isMatching) {
				throw new Error(action + ' aborted: ' + type + ' asset and CI should point to each other');
			} else {
				validationMessage.ciRecord = ciRecord;
				validationMessage.assetRecord = assetRecord;
			}
		}
		return validationMessage;
	},
	// We would process events only for hardware/base assets,
	// but not consumables, software, contracts, facilities
	shouldUpdateAsset: function (assetGr) {
		return (global.ModelUtils.isAncestor(assetGr, 'alm_hardware')
			|| assetGr.getValue('sys_class_name') === 'alm_asset');
	},
	deployAsset: function (payload) {
		// Get the passed in attribute values
		var ciId = payload.ciId;
		var userId = payload.userId;
		var location = payload.location;
		var assignedDateTime = payload.assignedTime;
		var installedDateTime = payload.installedTime;
		var assetSysId = payload.assetId;
		var sourceTable = payload.sourceTable;
		var sourceRecord = payload.sourceRecord;
		// Not-null check for mandatory attributes
		var checkOutput = this.validateAssetCI(ciId, assetSysId, 'Deploy', 'deployed');
		var ciGr = checkOutput.ciRecord;
		var assetGr = checkOutput.assetRecord;

		if (!this.shouldContinueWithAction(assetGr, payload, 'deploy')) {
			return;
		}

		if (!gs.nil(assetGr) && !gs.nil(assetGr.getUniqueValue()) && gs.nil(assetSysId)) {
			assetSysId = assetGr.getValue('sys_id');
		}
		if (!gs.nil(ciGr) && !gs.nil(ciGr.getUniqueValue()) && gs.nil(ciId)) {
			ciId = ciGr.getValue('sys_id');
		}
		if (!gs.nil(assetSysId) && this.shouldUpdateAsset(assetGr)) {
			// If assignment date is not passed, use current time
			if (gs.nil(assignedDateTime)) {
				assignedDateTime = this.currentTime;
			}
			// If install date is not passed, use current time
			if (gs.nil(installedDateTime)) {
				installedDateTime = this.currentTime;
			}
			// If location is not passed, try to derive it from user in case of computers
			if (gs.nil(location) && !gs.nil(userId)
				&& !gs.nil(ciGr)
				&& !gs.nil(ciGr.getUniqueValue())
				&& ciGr.getValue('sys_class_name') === AssetAutomationAPI.CI_COMPUTER_TABLE) {
				var userGr = this.getUserRecord(userId);
				if (!gs.nil(userGr._value)) {
					location = userGr._value.location;
				}
			}
			// Audit triggering event
			var event = gs.getMessage('Deploy');
			var msgParmValues = [];
			msgParmValues.push(event);
			msgParmValues.push(sourceTable);
			msgParmValues.push(sourceRecord);
			var message = gs.getMessage('{0} action triggered from {1} - {2}', msgParmValues);
			// Update asset
			var values = {
				install_status: AssetAutomationAPI.INUSE_STATUS,
				substatus: '',
				assigned_to: userId,
				location: location,
				assigned: assignedDateTime,
				install_date: installedDateTime,
				work_notes: message,
			};
			
			this.updateAssetAttributes(assetGr, values);
			
			var isParentPallet;
			if (GlidePluginManager.isActive('sn_itam_common') && sn_itam_common.ITAMCommonPalletsUtil){
				//whether new asset is part of a pallet
				if(!gs.nil(assetGr.parent)) {
					isParentPallet = global.AssetUtils.isParentPallet(assetGr.parent);
				}

				if(isParentPallet == true){
					//call script include to remove child parent relationship
					sn_itam_common.ITAMCommonPalletsUtil.removeAssetFromPallet(assetSysId);
				}
			}
		}
	},
	isAssetRetired: function (assetGr) {
		if (assetGr.getValue('install_status') === '7'
			|| (assetGr.getValue('install_status') === '6'
			&& (assetGr.getValue('substatus') === 'defective'
			|| assetGr.getValue('substatus') === 'pending_repair'
			|| assetGr.getValue('substatus') === 'pending_disposal'))) {
			return true;
		}
		return false;
	},
	retireAsset: function (payload) {
		// Get the passed in attribute values
		var ciId = payload.ciId;
		var location = payload.location;
		var assetSysId = payload.assetId;
		var sourceTable = payload.sourceTable;
		var sourceRecord = payload.sourceRecord;
		// Not null check for mandatory attribute
		var checkOutput = this.validateAssetCI(ciId, assetSysId, 'Retire', 'retired');
		var ciGr = checkOutput.ciRecord;
		var assetGr = checkOutput.assetRecord;

		if (!this.shouldContinueWithAction(assetGr, payload, 'retire')) {
			return;
		}

		if (!gs.nil(assetGr) && !gs.nil(assetGr.getUniqueValue()) && gs.nil(assetSysId)) {
			assetSysId = assetGr.getValue('sys_id');
		}
		if (!gs.nil(ciGr) && !gs.nil(ciGr.getUniqueValue()) && gs.nil(ciId)) {
			ciId = ciGr.getValue('sys_id');
		}
		// Remove device allocations
		if (!gs.nil(ciId)) {
			this.removeDeviceAlloc(ciId);
		}
		// Update asset and contract
		if (!gs.nil(assetSysId) && this.shouldUpdateAsset(assetGr)) {
			// If location is not passed, try to use existing location or derive it from assigned to user
			if (gs.nil(location)) {
				if (!gs.nil(assetGr.getValue('location'))) {
					location = assetGr.getValue('location');
				} else {
					var assignedToUser = assetGr.getValue('assigned_to');
					if (!gs.nil(assignedToUser)) {
						var userGr = this.getUserRecord(assignedToUser);
						if (!gs.nil(userGr._value)) {
							location = userGr._value.location;
						}
					}
				}
			}
			// Audit triggering event
			var event = gs.getMessage('Retire');
			var msgParmValues = [];
			msgParmValues.push(event);
			msgParmValues.push(sourceTable);
			msgParmValues.push(sourceRecord);
			var message = gs.getMessage('{0} action triggered from {1} - {2}', msgParmValues);
			// Update asset
			var values;
			var stockroom;
			if (this.isAssetRetired(assetGr)) {
				values = {
					work_notes: message,
				};
			} else {
				stockroom = this.findStockroom(location);
				values = {
					install_status: AssetAutomationAPI.INSTOCK_STATUS,
					substatus: AssetAutomationAPI.DISPOSAL_SUBSTATUS,
					assigned_to: '',
					location: location,
					assigned: '',
					install_date: '',
					stockroom: stockroom,
					work_notes: message,
				};
			}
			this.updateAssetAttributes(assetGr, values);
			if (gs.nil(stockroom)) {
				gs.info('Stockroom not set up with user location and previous stockroom value is empty');
			}
			// Stamp removed date on maintenance contracts
			this.removeContractInfo(assetSysId);
		}
	},
	swapAsset: function (payload) {
		// Get the passed in attribute values
		var oldCIId = payload.oldCIId;
		var newCIId = payload.newCIId;
		var userId = payload.userId;
		var location = payload.location;
		var assignedDateTime = payload.assignedTime;
		var installedDateTime = payload.installedTime;
		var oldAssetSysId = payload.oldAssetId;
		var newAssetSysId = payload.newAssetId;
		var sourceTable = payload.sourceTable;
		var sourceRecord = payload.sourceRecord;
		// Not null check for mandatory attributes - old CI/asset
		var checkOutput = this.validateAssetCI(oldCIId, oldAssetSysId, 'Swap', 'replaced');
		var oldCiGr = checkOutput.ciRecord;
		var oldAssetGr = checkOutput.assetRecord;

		if (!this.shouldContinueWithAction(oldAssetGr, payload, 'swap')) {
			return;
		}

		if (!gs.nil(oldAssetGr) && !gs.nil(oldAssetGr.getUniqueValue()) && gs.nil(oldAssetSysId)) {
			oldAssetSysId = oldAssetGr.getValue('sys_id');
		}
		if (!gs.nil(oldCiGr) && !gs.nil(oldCiGr.getUniqueValue()) && gs.nil(oldCIId)) {
			oldCIId = oldCiGr.getValue('sys_id');
		}
		// Not null check for mandatory attributes - new CI/asset
		checkOutput = this.validateAssetCI(newCIId, newAssetSysId, 'Swap', 'replacement');
		var newciGr = checkOutput.ciRecord;
		var newAssetGr = checkOutput.assetRecord;

		if (!this.shouldContinueWithAction(newAssetGr, payload, 'swap')) {
			return;
		}

		if (!gs.nil(newAssetGr) && !gs.nil(newAssetGr.getUniqueValue()) && gs.nil(newAssetSysId)) {
			newAssetSysId = newAssetGr.getValue('sys_id');
		}
		if (!gs.nil(newciGr) && !gs.nil(newciGr.getUniqueValue()) && gs.nil(newCIId)) {
			newCIId = newciGr.getValue('sys_id');
		}
		// Migrate device allocations
		if (!gs.nil(oldCIId) && !gs.nil(newCIId)) {
			new global.GlideQuery(AssetAutomationAPI.DEVICE_ALLOCATION_TABLE)
				.where('allocated_to', oldCIId)
				.updateMultiple({
					allocated_to: newCIId,
				});
		}
		// Update assets
		if (!gs.nil(oldAssetSysId) && !gs.nil(newAssetSysId)
			&& this.shouldUpdateAsset(oldAssetGr) && this.shouldUpdateAsset(newAssetGr)) {
			// If assignment date is not passed, use current time
			if (gs.nil(assignedDateTime)) {
				assignedDateTime = this.currentTime;
			}
			// If install date is not passed, use current time
			if (gs.nil(installedDateTime)) {
				installedDateTime = this.currentTime;
			}
			// If location is not passed, try to derive it from user in case of computers
			if (gs.nil(location)) {
				if (!gs.nil(userId)) {
					var userGr = this.getUserRecord(userId);
					if (!gs.nil(userGr._value)) {
						location = userGr._value.location;
					}
				} else if (!gs.nil(oldAssetGr.location)) {
					location = oldAssetGr.location; // location of old asset
				}
			}
			// If user is not passed, get it from replaced asset
			if (gs.nil(userId)) {
				userId = oldAssetGr.getValue('assigned_to');
			}
			// Audit triggering event
			var event = gs.getMessage('Swap');
			var msgParmValues = [];
			msgParmValues.push(event);
			msgParmValues.push(oldAssetGr.getDisplayValue());
			msgParmValues.push(newAssetGr.getDisplayValue());
			msgParmValues.push(sourceTable);
			msgParmValues.push(sourceRecord);
			var message = gs.getMessage(
				'{0} action triggered for asset {1} to asset {2} from {3} - {4}', msgParmValues
			);

			// undefined - if not part of bundle, false - if different model swap, true - if same model swap.
			var isSameModelSwap;

			// If old asset part of bundle?
			if (!sn_hamp.HAMUtils.isNotChildOfBundle(oldAssetGr)) {
				// Verify if model of old and new assets are same.
				isSameModelSwap = (oldAssetGr.getValue('model') === newAssetGr.getValue('model'));
			}

			var isChildOfBundle = isSameModelSwap !== undefined;

			// Deploy new asset
			var values = {
				install_status: AssetAutomationAPI.INUSE_STATUS,
				substatus: '',
				assigned_to: userId,
				location: location,
				assigned: assignedDateTime,
				install_date: installedDateTime,
				work_notes: message,
			};

			if (isChildOfBundle) {
				if (isSameModelSwap) {
					// Release the old asset first so that the new one can be added.
					sn_hamp.HAMUtils.releaseAssets(
						oldAssetGr.parent,
						[oldAssetGr.getUniqueValue()],

						{
							install_status: parseInt(oldAssetGr.getValue('install_status'), 10),
							substatus: oldAssetGr.getValue('substatus'),
						},

						true
					);

					values.parent = oldAssetGr.getValue('parent');
					values.asset_function = sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE;
				} else {
					var msgParams = [];
					msgParams.push(oldAssetGr.getDisplayValue());
					msgParams.push(newAssetGr.getDisplayValue());
					msgParams.push(event);
					// eslint-disable-next-line max-len
					var msg = gs.getMessage('Asset {0} has been swapped. Swapped asset {1} is a different model than the original {0}.', msgParams);
					// Update the bundle.
					var parentGr = new sn_hamp.HAMAssetBundleUtils().getBundleAssetGr(oldAssetGr.parent);
					this.updateAssetAttributes(
						parentGr,
						{ work_notes: msg }
					);
				}
			}

			this.updateAssetAttributes(newAssetGr, values);
			var stockroom;
			// Retire old asset
			if (this.isAssetRetired(oldAssetGr)) {
				values = {
					work_notes: message,
				};
			} else {
				stockroom = this.findStockroom(location);
				values = {
					install_status: AssetAutomationAPI.INSTOCK_STATUS,
					substatus: AssetAutomationAPI.DISPOSAL_SUBSTATUS,
					assigned_to: '',
					location: location,
					assigned: '',
					install_date: '',
					stockroom: stockroom,
					work_notes: message,
				};
			}

			if (isChildOfBundle && isSameModelSwap) {
				values.parent = null;
				values.asset_function = null;
			}
			
			this.updateAssetAttributes(oldAssetGr, values);

			var isParentPallet;
			if (GlidePluginManager.isActive('sn_itam_common') && sn_itam_common.ITAMCommonPalletsUtil) {
				//whether new asset is part of a pallet
				if(!gs.nil(newAssetGr.parent)) {
					isParentPallet = global.AssetUtils.isParentPallet(newAssetGr.parent);
				}

				if(isParentPallet == true){
					//call script include to remove child parent relationship
					sn_itam_common.ITAMCommonPalletsUtil.removeAssetFromPallet(newAssetSysId);
				}
			}

			if (gs.nil(stockroom)) {
				gs.info('Stockroom not set up with user location and previous stockroom value is empty');
			}
			// Update contract information
			var contract = new global.GlideQuery(AssetAutomationAPI.CONTRACT_ASSET_M2M_TABLE)
				.where('asset', oldAssetSysId)
				.where('contract.contract_model', AssetAutomationAPI.MAINTENANCE_CONTRACT_MODEL)
				.whereNull('removed')
				.toGlideRecord();
			contract.query();
			while (contract.next()) {
				contract.setValue('removed', this.currentTime.getDate());
				contract.update();
				// Create new contract relation record
				new global.GlideQuery(AssetAutomationAPI.CONTRACT_ASSET_M2M_TABLE)
					.insert({
						asset: newAssetSysId,
						contract: contract.getValue('contract'),
						added: this.currentTime.getDate(),
						sys_domain: contract.getValue('sys_domain'),
					});
			}
		}
	},
	getPickAssetsFromRITM: function(requestItemId) {
        var pickAssets = [];

        // Assets procured using PO have request line stamped on them
        var assetGrForPO = new GlideRecord(AssetAutomationAPI.ASSET_TABLE);
        assetGrForPO.addQuery('request_line', requestItemId);
        assetGrForPO.addNotNullQuery('stockroom');
        assetGrForPO.addQuery('stockroom.pick_task_required', true);
        assetGrForPO.query();
        while (assetGrForPO.next()) {
            pickAssets.push(assetGrForPO.getUniqueValue());
        }

        // Assets procured using TO does not have request line stamped on them
        var transferOrderLineGr = new GlideRecord(AssetAutomationAPI.TRANSFER_ORDER_LINE_TABLE);
        transferOrderLineGr.addQuery('request_line', requestItemId);
        transferOrderLineGr.addNotNullQuery('asset');
        transferOrderLineGr.addNotNullQuery('asset.stockroom');
        transferOrderLineGr.addQuery('asset.stockroom.pick_task_required', true);
        transferOrderLineGr.query();
        while (transferOrderLineGr.next()) {
            pickAssets.push(transferOrderLineGr.getValue('asset'));
        }

        // Local order does not update request line on asset
        var consumeTaskGr = new GlideRecord(AssetAutomationAPI.CONSUME_ASSET_TASK_TABLE);
        consumeTaskGr.addQuery('parent', requestItemId);
        consumeTaskGr.addQuery('active', false);
        consumeTaskGr.addQuery('task_name', AssetAutomationAPI.STAGE_TASK_NAME);
        consumeTaskGr.addNotNullQuery('asset');
        consumeTaskGr.addNotNullQuery('asset.stockroom');
        consumeTaskGr.addQuery('asset.stockroom.pick_task_required', true);
        consumeTaskGr.query();
        while (consumeTaskGr.next()) {
            pickAssets.push(consumeTaskGr.getValue('asset'));
        }
		return pickAssets;
    },
	moveAssetsToPendingInstall: function (reqItemId) {
		var status = '';
		var count = 0;
		var output = {};
		try {
			// Assets procured using PO have request line stamped on them
			var result = new global.GlideQuery(AssetAutomationAPI.ASSET_TABLE)
				.where('request_line', reqItemId)
				.updateMultiple({
					substatus: AssetAutomationAPI.PENDINGINSTALL_SUBSTATUS,
				});
			if (!gs.nil(result.rowCount)) {
				count += parseInt(result.rowCount, 10);
			}
			// Transfer order does not update request line on assets
			new global.GlideQuery(AssetAutomationAPI.TRANSFER_ORDER_LINE_TABLE)
				.where('request_line', reqItemId)
				.whereNotNull('asset')
				.select('asset')
				.forEach(function(out) {
					var res = new global.GlideQuery(AssetAutomationAPI.ASSET_TABLE)
						.where('sys_id', out.asset)
						.updateMultiple({
							substatus: AssetAutomationAPI.PENDINGINSTALL_SUBSTATUS,
						});
					if (!gs.nil(res.rowCount)) {
						count += parseInt(res.rowCount, 10);
					}
				});
			// Local order does not update request line on assets
			new global.GlideQuery(AssetAutomationAPI.CONSUME_ASSET_TASK_TABLE)
				.where('parent', reqItemId)
				.where('active', false)
				.where('task_name', AssetAutomationAPI.STAGE_TASK_NAME)
				.whereNotNull('asset')
				.select('asset')
				.forEach(function(out) {
					var res = new global.GlideQuery(AssetAutomationAPI.ASSET_TABLE)
						.where('sys_id', out.asset)
						.updateMultiple({
							substatus: AssetAutomationAPI.PENDINGINSTALL_SUBSTATUS,
						});
					if (!gs.nil(res.rowCount)) {
						count += parseInt(res.rowCount, 10);
					}
				});
			status = 'Success';
		} catch (e) {
			count = '0';
			status = 'Failed';
		}
		output.status = status;
		output.updateCount = count;
		return output;
	},
	moveAssetsToDeployedStatus: function (reqItemId, userId) {
		var status = '';
		var count = 0;
		var output = {};
		var location = '';
		try {
			if (!gs.nil(userId)) {
				var userGQ = this.getUserRecord(userId);
				if (!gs.nil(userGQ._value)) {
					location = userGQ._value.location;
				}
			}
			// Assets procured using PO have request line stamped on them
			new global.GlideQuery(AssetAutomationAPI.ASSET_TABLE)
				.where('request_line', reqItemId)
				.select('sys_id')
				.forEach(function(out) {
					this.updateAssetOnDeploy(out.sys_id, userId, location);
					count += 1;
				}.bind(this));
			// Transfer order does not update request line on assets
			new global.GlideQuery(AssetAutomationAPI.TRANSFER_ORDER_LINE_TABLE)
				.where('request_line', reqItemId)
				.select('asset.sys_id', 'asset.quantity', 'asset.sys_class_name', 'model', 'quantity_received', 'transfer_order.to_stockroom')
				.forEach(function(out) {
					var asset = !gs.nil(out.asset) ? out.asset.sys_id : '';
					var className = !gs.nil(out.asset) ? out.asset.sys_class_name : '';
					var consumableQuantity = !gs.nil(out.asset) ? out.asset.quantity : '';
					//Check for non-consumables, and for consumables not requiring split
					if(!gs.nil(asset) && (className !== 'alm_consumable') || !this.canSplitConsumable(reqItemId, consumableQuantity)) {
						this.updateAssetOnDeploy(asset, userId, location);
					} else {
						//Split consumable from merged one
						var assetId = this.splitConsumable(out, userId);
						this.updateAssetOnDeploy(assetId, userId, location);
					}
					count += 1;
				}.bind(this));
			// Local order does not update request line on assets
			new global.GlideQuery(AssetAutomationAPI.CONSUME_ASSET_TASK_TABLE)
				.where('parent', reqItemId)
				.where('active', false)
				.where('task_name', AssetAutomationAPI.STAGE_TASK_NAME)
				.whereNotNull('asset')
				.select('asset')
				.forEach(function(out) {
					this.updateAssetOnDeploy(out.asset, userId, location);
					count += 1;
				}.bind(this));
			status = 'Success';
		} catch (e) {
			status = 'Failed';
		}
		output.status = status;
		output.updateCount = count;
		return output;
	},
	//Split consumables in case they merged
	splitConsumable: function(tol, userId) {
		var assetId = '';
		new global.GlideQuery('alm_consumable')
			.where('model', tol.model)
			.where('stockroom', tol.transfer_order.to_stockroom)
			.where('install_status', 6)
			.where('substatus', 'pending_install')
			.selectOne(['sys_id', 'location', 'parent', 'asset_function'])
			.ifPresent(function (consumableRec) {
				assetId = new global.Consumables().split(
					consumableRec.sys_id,
					parseInt(tol.quantity_received, 10),
					AssetAutomationAPI.CONSUMED_STATUS,
					'',
					consumableRec.parent,
					'',
					consumableRec.location,
					userId,
					consumableRec.asset_function
				);
		});
		return assetId;
	},
	//Check if to split consumable 
	canSplitConsumable: function(reqItemId, consumableQuantity) {
		var ritmQantity = ''; 
		new global.GlideQuery('sc_req_item')
			.where('sys_id', reqItemId)
			.selectOne('quantity')
			.ifPresent(function (data) {
				ritmQantity = data.quantity;
			});
		if(!gs.nil(ritmQantity) && !gs.nil(consumableQuantity) && ritmQantity === consumableQuantity) {
			return false;
		}
		else {
			return true;
		}
	},
	// Wrapper function to determine values and invoke updateAssetProperties for Request flow
	updateAssetOnDeploy: function(assetId, userId, location) {
		var assetGr = this.getAssetRecord(assetId);
		// Use reserved for user if present
		var reservedFor = assetGr.getValue('reserved_for');
		var reservedLocation;
		if (!gs.nil(reservedFor)) {
			var userGr = this.getUserRecord(reservedFor);
			if (!gs.nil(userGr._value)) {
				reservedLocation = userGr._value.location;
			}
		}
		var assetStatus = (assetGr.getValue('sys_class_name') === AssetAutomationAPI.CONSUMABLE_TABLE) ?
		AssetAutomationAPI.CONSUMED_STATUS : AssetAutomationAPI.INUSE_STATUS;
		var values = {
			install_status: assetStatus,
			substatus: '',
			assigned_to: gs.nil(reservedFor) ? userId : reservedFor,
			location: gs.nil(reservedLocation) ? location : reservedLocation,
			assigned: this.currentTime,
			install_date: this.currentTime,
		};
		this.updateAssetAttributes(assetGr, values);
	},

	isProcessedByEAM: function(assetGr, payload) {
		if (payload.sourceTable !== AssetAutomationAPI.INCIDENT || !HAMUtils.isEAMActive()) {
			return false;
		}

		var incMeta = new global.GlideQuery(AssetAutomationAPI.INCIDENT)
			.get(payload.sourceRecord, ['asset.sys_class_name'])
			.orElse(null);

		var incidentAssetClass = incMeta.asset && incMeta.asset.sys_class_name;

		// If primary asset class is of EAM, we skip processing from HAM
		return incidentAssetClass && HAMUtils.checkIfEAMClass(incidentAssetClass, HAMConstants.EAM_ASSET_BASE_CLASS);
	},

	shouldContinueWithAction: function(assetGr, payload, actionName) {
		// If Asset is null, nothing should happen
		if (gs.nil(assetGr)) {
			return false;
		}

		if (this.isProcessedByEAM(assetGr, payload)) {
			return false;
		}

		// If Model category of asset belongs to Opted-out Resource Category, return
		if (sn_hamp.HAMUtils.getLicenseOptinStatus(assetGr.model_category) === 'N') {
			return false;
		}

		if ((sn_hamp.HAMUtils.getLicenseOptinStatus(assetGr.model_category) === 'Y' && sn_hamp.HAMLicensingUtility.isAssetExcludedFromHAMFlows(assetGr))
		|| (HAMUtils.HAS_ONLY_TNI_ENTITLEMENT && sn_hamp.HAMUtils.getLicenseOptinStatus(assetGr.model_category) === 'NA')) {
			var msgParams = [payload.sourceTable,payload.sourceRecord];
			var message  = gs.getEscapedMessage('This asset is excluded from using licensed HAM features. Manual update required on closure of {0} - {1}', msgParams);
			var assetObj = {
				'work_notes': message
			};
			this.updateAssetAttributes(assetGr, assetObj);
			if(actionName === 'swap') {
				var swappedAssetGr = null;
				if(!gs.nil(payload.newAssetId)){
					swappedAssetGr = this.getAssetRecord(payload.newAssetId);
				} else {
					var ciGr = this.getCIRecord(payload.newCIId);
					swappedAssetGr = this.getAssetRecord(ciGr.asset);
				}
				if(!gs.nil(swappedAssetGr) && sn_hamp.HAMLicensingUtility.isAssetExcludedFromHAMFlows(swappedAssetGr)) {
					this.updateAssetAttributes(swappedAssetGr, assetObj);
				}
			}
			return false;
		}

		return true;
	},
	type: 'AssetAutomationAPI',
};
