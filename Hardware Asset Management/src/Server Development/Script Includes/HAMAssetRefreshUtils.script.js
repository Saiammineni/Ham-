var HAMAssetRefreshUtils = Class.create();
HAMAssetRefreshUtils.ASSET_TABLE = 'alm_asset';
HAMAssetRefreshUtils.HARDWARE_MODEL_TABLE = 'cmdb_hardware_product_model';
HAMAssetRefreshUtils.REFRESH_LINE_TABLE = 'sn_hamp_hw_refresh_line';
HAMAssetRefreshUtils.REFRESH_TASK_TABLE = 'sn_hamp_hw_refresh_line_task';
HAMAssetRefreshUtils.CLOSED_COMPLETE = 3;
HAMAssetRefreshUtils.CLOSED_INCOMPLETE = 4;
HAMAssetRefreshUtils.REQUEST_CANCELLED = 'Request Cancelled';
HAMAssetRefreshUtils.prototype = {
	COMPLETED_STATUS: 'completed',
	CANCELLED_STATUS: 'cancelled',
	REFRESH_LINE_TABLE: 'sn_hamp_hw_refresh_line',
	REQ_ITEM_TABLE: 'sc_req_item',
	IN_STOCK_STATUS: '6',
	RESERVED_SUBSTATUS: 'reserved',
	initialize: function() {},
	markActiveTaskClosedIncomplete: function(refreshLineSysid) {
		var gr = new GlideRecord(HAMAssetRefreshUtils.REFRESH_TASK_TABLE);
		gr.addQuery('refresh_line', refreshLineSysid);
		gr.addQuery('state', 'IN', [-5, 1, 2]);
		gr.state = HAMAssetRefreshUtils.CLOSED_INCOMPLETE;
		gr.updateMultiple();

		var pickTaskGr = new GlideRecord(sn_itam_common.CommonConstants.PICK_TASK);
		pickTaskGr.addQuery('asset_orderline', refreshLineSysid);
		pickTaskGr.addQuery('state', 'IN', [-5, 1, 2]);
		pickTaskGr.state = HAMAssetRefreshUtils.CLOSED_INCOMPLETE;
		pickTaskGr.updateMultiple();
	},

	cancelRefreshLineFlows: function(reqSysId) {
		var that = this;
		var refreshLineStages = ['plan', 'schedule', 'deploy', 'reclaim'];
		// remove refresh request line on assets selected for refresh
		new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_LINE_TABLE)
			.where('request_item.request', reqSysId)
			.where('stage', 'IN', refreshLineStages)
			.select('sys_id')
			.forEach(function (refreshLine) {
				that.markActiveTaskClosedIncomplete(refreshLine.sys_id);
			});
	},

	isOutOfSync: function(refreshLineRecord) {
		var refreshingAsset = gs.nil(refreshLineRecord.asset) ? 'NULL' : refreshLineRecord.asset;
		// eslint-disable-next-line max-len
		var replacementAsset = gs.nil(refreshLineRecord.replacement_asset) ? 'NULL' : refreshLineRecord.replacement_asset;
		return new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_TASK_TABLE)
			.where('refresh_line', refreshLineRecord.getUniqueValue())
			.where('active', true)
			.where('replacement_asset', replacementAsset)
			.where('refreshing_asset', refreshingAsset)
			.selectOne()
			.isEmpty();
	},
	updateAsset: function(assetSysId, updateJson) {
		new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE)
			.where('sys_id', assetSysId)
			.update(updateJson);
	},
	// Sync Replacement asset and Asset fields to active refresh line tasks
	syncFieldstoRefreshLineTask: function(refreshLineRecord) {
		var updateJson = {};
		if (refreshLineRecord.replacement_asset.changes()) {
			// eslint-disable-next-line max-len
			updateJson.replacement_asset = gs.nil(refreshLineRecord.replacement_asset) ? 'NULL' : refreshLineRecord.replacement_asset;
		}
		if (refreshLineRecord.asset.changes()) {
			updateJson.refreshing_asset = gs.nil(refreshLineRecord.asset) ? 'NULL' : refreshLineRecord.asset;
		}
		if (Object.keys(updateJson).length !== 0) {
			new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_TASK_TABLE)
				.where('refresh_line', refreshLineRecord.getUniqueValue())
				.where('active', true)
				.updateMultiple(updateJson);
			var assetUpdateJson = {};
			if (refreshLineRecord.getValue('stage') !== 'plan') {
				assetUpdateJson = { reserved_for: refreshLineRecord.asset.assigned_to };
				this.updateAsset(refreshLineRecord.replacement_asset.sys_id, assetUpdateJson);
			}
			// update the refresh request line on asset if empty
			if (!refreshLineRecord.asset.refresh_request_line) {
				assetUpdateJson = { refresh_request_line: refreshLineRecord.request_item };
				this.updateAsset(refreshLineRecord.asset.sys_id, assetUpdateJson);
			}
		}
	},
	// Sync Replacement asset and Asset fields to refresh line
	syncFieldstoRefreshLine: function(refreshTaskRecord) {
		var updateJson = {};
		if (refreshTaskRecord.replacement_asset.changes()) {
			// eslint-disable-next-line max-len
			updateJson.replacement_asset = gs.nil(refreshTaskRecord.replacement_asset) ? 'NULL' : refreshTaskRecord.replacement_asset;
		}
		if (refreshTaskRecord.refreshing_asset.changes()) {
			// eslint-disable-next-line max-len
			updateJson.asset = gs.nil(refreshTaskRecord.refreshing_asset) ? 'NULL' : refreshTaskRecord.refreshing_asset;
		}
		if (Object.keys(updateJson).length !== 0) {
			new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_LINE_TABLE)
				.where('sys_id', refreshTaskRecord.refresh_line)
				.updateMultiple(updateJson);
			var assetUpdateJson = {};
			if (refreshTaskRecord.getValue('task_name') !== 'prepare') {
				assetUpdateJson = { reserved_for: refreshTaskRecord.refreshing_asset.assigned_to };
				this.updateAsset(refreshTaskRecord.replacement_asset.sys_id, assetUpdateJson);
			}
			// update the refresh request line on refreshing asset if empty
			if (!refreshTaskRecord.refreshing_asset.refresh_request_line) {
				assetUpdateJson = { refresh_request_line: refreshTaskRecord.refresh_line.request_item };
				this.updateAsset(refreshTaskRecord.refreshing_asset.sys_id, assetUpdateJson);
			}
		}
	},

	removeRefreshRequestLine: function(assetSysId) {
		var assetUpdateJson = { refresh_request_line: 'NULL' };
		this.updateAsset(assetSysId, assetUpdateJson);
	},

	checkDuplicateRefresh: function(refreshTaskRecord) {
		var msgParams = [];
		var gq = new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_LINE_TABLE)
			.where('sys_id', '!=', refreshTaskRecord.refresh_line)
			.where('request_item', refreshTaskRecord.refresh_line.request_item)
			.where('stage', '!=', this.CANCELLED_STATUS);
		if (!gq.where('replacement_asset', refreshTaskRecord.replacement_asset).selectOne().isEmpty()) {
			msgParams.push(refreshTaskRecord.replacement_asset.getLabel());
		}
		if (!gq.where('asset', refreshTaskRecord.refreshing_asset).selectOne().isEmpty()) {
			msgParams.push(refreshTaskRecord.refreshing_asset.getLabel());
		}
		return msgParams;
	},

	checkTaskCompletion: function(refreshTaskRecord) {
		var taskName = refreshTaskRecord.getValue('task_name');
		var abort = false;
		var msgParams = [];
		var message;
		if (gs.nil(refreshTaskRecord.refreshing_asset)) {
			abort = true;
			msgParams.push(refreshTaskRecord.refreshing_asset.getLabel());
		}
		switch (taskName) {
		case 'prepare':
			if (msgParams.length !== 0) {
				message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
			}
			break;

		case 'schedule':
		case 'deploy':
			if (gs.nil(refreshTaskRecord.refresh_line.scheduled_date)) {
				abort = true;
				msgParams.push(refreshTaskRecord.refresh_line.scheduled_date.getLabel());
			}
			if (msgParams.length !== 0) {
				message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
			}
			break;

		case 'reclaim':
			if (refreshTaskRecord.refresh_line.is_reclaimed.toString() === 'N') {
				abort = true;
				msgParams.push(refreshTaskRecord.refresh_line.is_reclaimed.getLabel());
				message = gs.getMessage('To complete the task, update {0} value to Yes.', msgParams);
			}
			break;

		default:
		}
		if (!abort) {
			msgParams = this.checkDuplicateRefresh(refreshTaskRecord);
			if (msgParams.length !== 0) {
				abort = true;
				// eslint-disable-next-line max-len
				message = gs.getMessage('Invalid selection. {0} is already selected on another refresh line', msgParams.join(', '));
			} else {
				msgParams.push(refreshTaskRecord.task_name.getDisplayValue());
				message = gs.getMessage('{0} task completed successfully.', msgParams);
			}
		}
		var outputJson = {
			abort: abort,
			message: message,
		};
		return outputJson;
	},

	processRefreshRitm: function(requestItemRecord) {
		var abort = false;
		var message;
		var msgParams = [];
		var outputJson = {
			abort: abort,
		};
		var assets = [];
		var gq;
		var unitCost = 0;
		var totalCost = 0;
		if (requestItemRecord.variables.type_of_refresh.toString() === 'single_model') {
			assets = requestItemRecord.variables.assets.toString().split(',');
			// identify assets with refresh request line
			gq = new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE)
				.where('sys_id', 'IN', assets)
				.whereNotNull('refresh_request_line')
				.where('refresh_request_line.stage', '!=', HAMAssetRefreshUtils.REQUEST_CANCELLED);
			if (gq.count() > 0) {
				gq.select('display_name', 'refresh_request_line').forEach(function(asset) {
					if (asset.refresh_request_line !== requestItemRecord.getUniqueValue()) {
						msgParams.push(asset.display_name);
					}
				});
				if (msgParams.length > 0) { abort = true; }
			}

			// total price calculation
			unitCost = requestItemRecord.variables.replacement_model.cost;
			var qty = assets.length;
			totalCost = unitCost * qty;
		} else if (requestItemRecord.variables.type_of_refresh.toString() === 'multi_model') {
			var multiModelVar = JSON.parse(requestItemRecord.variables.multi_model_set);
			var asset;
			var modelSysId;
			gq = new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE);
			var gr = new GlideRecord(HAMAssetRefreshUtils.HARDWARE_MODEL_TABLE);
			for (var i = 0; i < multiModelVar.length; i++) {
				modelSysId = multiModelVar[i].multi_replacement_model;
				asset = multiModelVar[i].asset;
				assets.push(asset);

				// identify assets with refresh request line
				gq.where('sys_id', asset)
					.whereNotNull('refresh_request_line')
					.where('refresh_request_line.stage', '!=', HAMAssetRefreshUtils.REQUEST_CANCELLED)
					.selectOne('display_name', 'refresh_request_line')
					.ifPresent(function(asset1) {
						if (asset1.refresh_request_line !== requestItemRecord.getUniqueValue()) {
							msgParams.push(asset1.display_name);
						}
					});

				// total price calculation
				gr.get(modelSysId);
				unitCost = parseFloat(gr.cost.getSessionValue());
				totalCost += unitCost;
			}
			if (msgParams.length > 0) { abort = true; }
		}
		if (abort) {
			message = gs.getMessage('Assets already part of another refresh order: {0}', msgParams.join(', '));
			outputJson = {
				abort: abort,
				message: message,
			};
		}
		// Update Refresh request line on assets part of refresh request
		this.updateRefreshRequestLine(assets, requestItemRecord.sys_id);
		requestItemRecord.setValue('price', totalCost); // sets price to session currency
		return outputJson;
	},

	refreshAssetsfilter: function() {
		var exclQuery = sn_hamp.HAMLicensingUtility.getHAMFlowsInclusionEQ();
		var filter = exclQuery+'^refresh_request_lineISEMPTY^ORrefresh_request_line.stage=Request Cancelled^EQ';
		if (sn_hamp.HAMUtils.isEAMActive()) {
			// Assets part of OTAM refresh request should be filtered out
			filter += '^sn_itam_common_refresh_request_lineISEMPTY^ORsn_itam_common_refresh_request_line.stage=Request Cancelled^EQ';
		}
		if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			filter = 'model_categoryIN' + HAMUtils.getEntitledTNIModelCategories() + '^' + filter;
		}
		return filter;
	},

	updateRefreshRequestLine: function(assetsArray, refreshRequestLineSysID) {
		new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE)
			.where('sys_id', 'IN', assetsArray)
			.updateMultiple({
				refresh_request_line: refreshRequestLineSysID,
			});
		// remove the Refresh request line from assets removed from refresh request
		new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE)
			.where('refresh_request_line', refreshRequestLineSysID)
			.where('sys_id', 'NOT IN', assetsArray)
			.updateMultiple({
				refresh_request_line: 'NULL',
			});
	},

	updateRefreshSourcingSet: function(requestItemRecord) {
		var sourcingSet = [];
		var obj = {};
		if (requestItemRecord.variables.type_of_refresh.toString() === 'single_model') {
			var assetsArray = requestItemRecord.variables.assets.toString().split(',');
			obj.sn_hamp_quantity = assetsArray.length;
			obj.sn_hamp_model = requestItemRecord.variables.replacement_model;
			sourcingSet.push(obj);
		} else if (requestItemRecord.variables.type_of_refresh.toString() === 'multi_model') {
			var modelList = {};
			var model;
			var multiModelVar = JSON.parse(requestItemRecord.variables.multi_model_set);
			for (var i = 0; i < multiModelVar.length; i++) {
				model = multiModelVar[i].multi_replacement_model;
				if (model in modelList) {
					modelList[model] += 1;
				} else {
					modelList[model] = 1;
				}
			}
			for (var key in modelList) {
				obj = {};
				obj.sn_hamp_model = key;
				obj.sn_hamp_quantity = modelList[key];
				sourcingSet.push(obj);
			}
		}
		requestItemRecord.variables.sn_hamp_sourcing_set = sourcingSet;
		requestItemRecord.update();
	},
	processUnrefreshedAssets: function(reqItemSysId) {
		var refreshedAssets = [];
		// populate the refreshed assets
		new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_LINE_TABLE)
			.where('request_item', reqItemSysId)
			.where('stage', 'completed')
			.select('asset')
			.forEach(function (refreshLine) {
				refreshedAssets.push(refreshLine.asset);
			});
		// remove refresh request line from the assets which are not refreshed
		new global.GlideQuery(HAMAssetRefreshUtils.ASSET_TABLE)
			.where('refresh_request_line', reqItemSysId)
			.where('sys_id', 'NOT IN', refreshedAssets)
			.updateMultiple({
				refresh_request_line: 'NULL',
			});
	},
	/* Update Is RITM Refreshed variable only when count of completed/cancelled
	Refresh Lines is equal to total quantity of RITM */
	checkIfRITMRefreshed: function(refreshLine) {
		var completedCount = this._getCompletedRefreshLinesCount(refreshLine);
		var cancelledCount = this._getCancelledRefreshLinesCount(refreshLine);
		var count = completedCount + cancelledCount;
		var reqItemGr = new global.GlideQuery('sc_req_item')
			.where('sys_id', refreshLine.request_item)
			.toGlideRecord();
		reqItemGr.query();
		if (reqItemGr.next()) {
			var totalRITMQty = this._getTotalRITMQty(reqItemGr);
			// update the RITM closed incomplete if all refresh lines are cancelled
			// Flow designer waits for state of RITM to be closed complete/closed incomplete for Refresh stage
			if ((parseInt(totalRITMQty, 10) === parseInt(count, 10))
				&& (parseInt(completedCount, 10) !== 0)) {
				reqItemGr.state = HAMAssetRefreshUtils.CLOSED_COMPLETE;
				reqItemGr.update();
				if (cancelledCount > 0) {
					this.processUnrefreshedAssets(reqItemGr.sys_id);
				}
			} else if ((parseInt(totalRITMQty, 10) === parseInt(count, 10))
				&& (parseInt(completedCount, 10) === 0)) {
				reqItemGr.state = HAMAssetRefreshUtils.CLOSED_INCOMPLETE;
				reqItemGr.update();
				if (cancelledCount > 0) {
					this.processUnrefreshedAssets(reqItemGr.sys_id);
				}
			}
		}
	},
	// Traverse all the refresh lines to check if they are completed
	_getCompletedRefreshLinesCount: function(refreshLine) {
		var count = new global.GlideQuery('sn_hamp_hw_refresh_line')
			.where('request_item', refreshLine.request_item)
			.where('stage', this.COMPLETED_STATUS)
			.count();
		return count;
	},
	// Traverse all the refresh lines to check if they are cancelled
	_getCancelledRefreshLinesCount: function(refreshLine) {
		var count = new global.GlideQuery('sn_hamp_hw_refresh_line')
			.where('request_item', refreshLine.request_item)
			.where('stage', this.CANCELLED_STATUS)
			.count();
		return count;
	},
	// Method to calculate the total quantity by traversing through Sourcing set variable of RITM
	_getTotalRITMQty: function(reqItemGr) {
		// get Total quantity of RITM
		var totalRITMQty = 0;
		var sourcingSetVar = JSON.parse(reqItemGr.variables.sn_hamp_sourcing_set);
		for (var i = 0; i < sourcingSetVar.length; i++) {
			totalRITMQty += isNaN(sourcingSetVar[i].sn_hamp_quantity) ? 0 : parseInt(sourcingSetVar[i].sn_hamp_quantity, 10);
		}
		return totalRITMQty;
	},
	// Check if the Request Item is Refresh Request Item
	isRefreshReq: function(reqItemSysId) {
		var gr = new GlideRecord(this.REQ_ITEM_TABLE);
		gr.addQuery('sys_id', reqItemSysId);
		gr.addQuery('variables.dbccd3f2b7621010189e22b5de11a90e', 'sn_hamp_hw_refresh');
		gr.query();
		/* var isRefReq = new global.GlideQuery('sc_req_item')
		.where('sys_id', reqItemSysId)
		.where('variables.sn_hamp_process', 'sn_hamp_hw_refresh')
		.isEmpty();
		return !isRefReq; */
		return gr.hasNext();
	},
	// Create refresh line
	createRefreshLine: function(assetSysId, reqLine) {
		var assetGr = new GlideRecord(HAMAssetRefreshUtils.ASSET_TABLE);
		// Return if record for assetSysId is not found
		if (!assetGr.get(assetSysId)) {
			return;
		}
		var refreshLine = new global.GlideQuery(this.REFRESH_LINE_TABLE)
			.insert({ request_item: reqLine, replacement_model: assetGr.model, replacement_asset: assetSysId })
			.get();
		// Update asset to be reserved
		if (!gs.nil(refreshLine)) {
			// assetGr.install_status = this.IN_STOCK_STATUS;
			assetGr.substatus = this.RESERVED_SUBSTATUS;
			assetGr.update();
		}
	},
	assetRefQual: function(refreshGr) {
		// Show assets part of the refresh request item for the given model excluding
		// those for which new replacement assets have already been deployed

		var requestItemRecord;
		var currTable = refreshGr.getTableName();
		if (currTable === HAMAssetRefreshUtils.REFRESH_LINE_TABLE) {
			requestItemRecord = refreshGr.request_item;
		} else if (currTable === HAMAssetRefreshUtils.REFRESH_TASK_TABLE) {
			requestItemRecord = refreshGr.refresh_line.request_item;
		}
		var assets = [];
		// For single model read all the assets from RITM variable set
		if (requestItemRecord.variables.type_of_refresh.toString() === 'single_model') {
			assets = requestItemRecord.variables.assets.toString().split(',');
		} else if (requestItemRecord.variables.type_of_refresh.toString() === 'multi_model') {
			// For Multi model, show assets from RITM variable set for the given replacement model
			var multiModelVar = JSON.parse(requestItemRecord.variables.multi_model_set);
			var modelSysId = refreshGr.replacement_model.toString();
			for (var i = 0; i < multiModelVar.length; i++) {
				if (modelSysId === multiModelVar[i].multi_replacement_model) {
					assets.push(multiModelVar[i].asset);
				}
			}
		}
		// get the assets for which new replacement assets have been deployed
		var deployedAssets = [];
		var refreshLineStages = ['reclaim', 'completed'];
		new global.GlideQuery(HAMAssetRefreshUtils.REFRESH_LINE_TABLE)
			.where('request_item', requestItemRecord.sys_id)
			.where('stage', 'IN', refreshLineStages)
			.select('asset')
			.forEach(function (refreshLine) {
				deployedAssets.push(refreshLine.asset);
			});
		return 'sys_idIN' + assets + '^sys_idNOT IN' + deployedAssets;
	},

	replacementAssetRefQual: function (refreshGr) {
		var filter = 'sys_class_name=alm_hardware^model=' + refreshGr.replacement_model;
		return filter;
	},

	triggerRefreshLineFlow: function(refreshLineGr) {
		var defaultFlow = 'sn_hamp.hardware_asset_refresh_line_flow';
		var REFRESH_DECISION_ID = '980d43a273131010189e2f163cf6a780';
		var decisionInputs = {};
		decisionInputs.refresh_line = refreshLineGr.sys_id;
		var flow = HAMUtils.getFlowFromDecisionTable(REFRESH_DECISION_ID, decisionInputs, defaultFlow);
		if (gs.nil(flow)) {
			gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
		} else {
			var inputs = {};
			inputs.current = refreshLineGr;
			inputs.table_name = HAMAssetRefreshUtils.REFRESH_LINE_TABLE;
			var flowContextID = sn_hamp.HAMUtils.triggerFlowAsyncronously(flow, inputs);
			if (flowContextID) {
				refreshLineGr.setValue('flow_context', flowContextID);
				refreshLineGr.update();
			}
		}
	},
	type: 'HAMAssetRefreshUtils',
};

HAMAssetRefreshUtils.singleReplacementModelRefQual = function() {
	var legacyFilter = 'status=In Production';
	var CSDMFilter = 'life_cycle_stage=Operational^life_cycle_stage_status=In Use';
	var filter = null;
	if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
		filter = CSDMFilter;
	} else {
		filter = legacyFilter;
	}
	if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
		filter = 'sys_idIN' + HAMUtils.getEntitledTNIModels() + '^' + filter;
	}
	return filter;
};
HAMAssetRefreshUtils.multiReplacementModelRefQual = function() {
	var legacyFilter = 'status=In Production';
	var CSDMFilter = 'life_cycle_stage=Operational^life_cycle_stage_status=In Use';
	var filter = null;
	if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
		filter = CSDMFilter;
	} else {
		filter = legacyFilter;
	}
	if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
		filter = 'sys_idIN' + HAMUtils.getEntitledTNIModels() + '^' + filter;
	}
	return filter;
};
HAMAssetRefreshUtils.canCloseRefreshTask = function(refreshTask) {
	var hasAccess = gs.getUser().hasRole('itil') || gs.getUser().hasRole('asset');
	return (hasAccess && (refreshTask.getValue('state') === '-5' || refreshTask.getValue('state') === '1'
	|| refreshTask.getValue('state') === '2'));
};
HAMAssetRefreshUtils.validateFieldsForRefresh = function(refreshTask) {
	var message;
	var msgParams = [];
	if ((refreshTask.getValue('task_name') === 'prepare')
		&& refreshTask.getValue('state') !== '4'
		&& (!refreshTask.getValue('refreshing_asset'))) {
		// check mandatory fields are filled on Prepare asset task
		msgParams.push(refreshTask.refreshing_asset.getLabel());
		message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
		gs.addErrorMessage(message);
	} else if ((refreshTask.getValue('task_name') === 'schedule')
		&& refreshTask.getValue('state') !== '4'
		&& refreshTask.getValue('state') !== '7'
		&& (!refreshTask.refresh_line.scheduled_date)) {
		// check mandatory fields are filled on Schedule refresh task
		msgParams.push(refreshTask.refresh_line.scheduled_date.getLabel());
		message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
		gs.addErrorMessage(message);
	} else if ((refreshTask.getValue('task_name') === 'reclaim')
		&& refreshTask.getValue('state') !== '4'
		&& refreshTask.getValue('state') !== '7'
		&& (refreshTask.refresh_line.is_reclaimed.toString() !== 'Y')) {
		// check mandatory fields are filled on Deploy new task
		msgParams.push(refreshTask.refresh_line.is_reclaimed.getLabel());
		message = gs.getMessage('To complete the task, update {0} value to Yes.', msgParams.join(', '));
		gs.addErrorMessage(message);
	} else {
		if (refreshTask.getValue('state') !== '4') {
			if ((refreshTask.getValue('state') === '1' || refreshTask.getValue('state') === '2')) {
				refreshTask.state = 3;
			}
		}
		refreshTask.update();
	}
	if (refreshTask.getValue('state') !== '3') { // redirect to task page only if its incomplete
		return refreshTask;
	}
	return refreshTask.refresh_line.getRefRecord();
};