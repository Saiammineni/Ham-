var HampLoanerUtils = Class.create();
HampLoanerUtils.prototype = {
	initialize: function () { },
	getModelsWithLoanerAssets: function (location) {
		var filter;
		var modelsarray = [];
		var assetsGa = new GlideAggregate('alm_asset');
		HampLoanerUtils.addLoanerBaseQuery(assetsGa, location);
		assetsGa.addQuery('install_status', 'NOT IN', HampLoanerUtils.ASSET_IN_USE_STATUSES);
		assetsGa = sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(assetsGa);
		assetsGa.setGroup(true);
		assetsGa.groupBy('model.sys_id');
		assetsGa.query();
		while (assetsGa.next()) {
			modelsarray.push(assetsGa.getValue('model.sys_id'));
		}
		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		HampLoanerUtils.addInUseFunctioningAssetsQuery(loanerOrdersGa, location, '');
		loanerOrdersGa.setGroup(true);
		loanerOrdersGa.groupBy('model.sys_id');
		loanerOrdersGa.query();
		while (loanerOrdersGa.next()) {
			modelsarray.push(loanerOrdersGa.getValue('model.sys_id'));
		}
		if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			var filteredModels = HAMUtils.filterOutNonTNIModels(modelsarray);
			filter = 'sys_idIN' + filteredModels;
		}
		else {
			filter = 'sys_idIN' + modelsarray;
		}
		return filter;
	},
	getAllLoanerAssetsOfStockroom: function (stockroomGr) {
		var assets = [];
		assets = assets.concat(this.getAllLoanerAssetsInStockroom(stockroomGr));
		assets = assets.concat(this.getAllInUseLoanerAssetsOfAStockroom(stockroomGr));
		return assets;
	},
	getAllLoanerAssetsInStockroom: function (stockroomGr) {
		var eamModelExt = HAMUtils.getEAMModelClasses();
		var eamAssetExt = HAMUtils.getEAMAssetClasses();
		var assetsGa = new GlideAggregate('alm_asset');
		assetsGa.addQuery('asset_function', 'loaner');
		assetsGa.addQuery('stockroom', stockroomGr.getUniqueValue());
		// Exclude EAM assets and EAM models
		assetsGa.addQuery('model.sys_class_name', 'NOT IN', eamModelExt);
		assetsGa.addQuery('sys_class_name', 'NOT IN', eamAssetExt);
		assetsGa.setGroup(true);
		assetsGa.groupBy('sys_id');
		assetsGa.query();

		var assetsarray = [];
		while (assetsGa.next()) {
			assetsarray.push(assetsGa.getValue('sys_id'));
		}
		return assetsarray;
	},
	getAllInUseLoanerAssetsOfAStockroom: function (stockroomGr) {
		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		loanerOrdersGa.addQuery('asset_stockroom', stockroomGr.getUniqueValue());
		loanerOrdersGa.addQuery('asset.install_status', HAMConstants.ASSET_STATUSES.IN_USE);
		loanerOrdersGa.addQuery('asset.asset_function', 'loaner');
		loanerOrdersGa.addQuery('stage', HampLoanerUtils.STAGE_DEPLOYED);
		loanerOrdersGa.setGroup(true);
		loanerOrdersGa.groupBy('asset.sys_id');
		loanerOrdersGa.query();

		var assetsarray = [];
		while (loanerOrdersGa.next()) {
			assetsarray.push(loanerOrdersGa.getValue('asset.sys_id'));
		}
		return assetsarray;
	},
	getFunctioningAssets: function (location, model) {
		var functioningAssets = [];
		functioningAssets = functioningAssets.concat(this.getInStockFunctioningAssets(location, model));
		functioningAssets = functioningAssets.concat(this.getInUseFunctioningAssets(location, model));
		return functioningAssets;
	},
	getInStockFunctioningAssets: function (location, model) {
		var assetsGa = new GlideAggregate('alm_asset');
		HampLoanerUtils.addLoanerBaseQuery(assetsGa, location, model);
		HampLoanerUtils.addInStockFunctioningAssetsQuery(assetsGa);
		assetsGa.setGroup(true);
		assetsGa.groupBy('sys_id');
		assetsGa.query();

		var assetsarray = [];
		while (assetsGa.next()) {
			assetsarray.push(assetsGa.getValue('sys_id'));
		}
		return assetsarray;
	},
	getInUseFunctioningAssets: function (location, model) {
		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		HampLoanerUtils.addInUseFunctioningAssetsQuery(loanerOrdersGa, location, model);
		loanerOrdersGa.setGroup(true);
		loanerOrdersGa.groupBy('asset.sys_id');
		loanerOrdersGa.query();

		var assetsarray = [];
		while (loanerOrdersGa.next()) {
			assetsarray.push(loanerOrdersGa.getValue('asset.sys_id'));
		}
		return assetsarray;
	},
	getActiveAssetAllocations: function (location, model, startDate, returnDate, leadTime, forLoanerOrder) {
		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		loanerOrdersGa.addQuery('location', location);
		loanerOrdersGa.addQuery('model', model);
		if (forLoanerOrder) {
			loanerOrdersGa.addQuery('sys_id', '!=', forLoanerOrder);
		}

		HampLoanerUtils.addLoanerOrdersOverlapQuery(loanerOrdersGa, startDate, returnDate, leadTime);
		HampLoanerUtils.addDomainFilterQuery(loanerOrdersGa);

		var activeStages = [HampLoanerUtils.STAGE_NEW, HampLoanerUtils.STAGE_PREPARE, HampLoanerUtils.STAGE_DEPLOYED];
		loanerOrdersGa.addQuery('stage', activeStages);

		loanerOrdersGa.setGroup(true);
		loanerOrdersGa.groupBy('asset.sys_id');
		loanerOrdersGa.query();

		var assetsarray = [];
		while (loanerOrdersGa.next()) {
			assetsarray.push(loanerOrdersGa.getValue('asset.sys_id'));
		}
		return assetsarray;
	},
	getAssetsAvailableToAllocate: function (location, model, startDate, returnDate, leadTime, forLoanerOrder) {
		var functioningAssets = this.getFunctioningAssets(location, model);
		// eslint-disable-next-line max-len
		var activeAllocations = this.getActiveAssetAllocations(location, model, startDate, returnDate, leadTime, forLoanerOrder);
		var availableAssets = [];
		for (var i = 0; i < functioningAssets.length; i++) {
			if (activeAllocations.indexOf(functioningAssets[i]) === -1) {
				availableAssets.push(functioningAssets[i]);
			}
		}
		return availableAssets;
	},
	getLoanerAssets: function (current) {
		var loanerOrderGr = null;
		if (current.getTableName() === HampLoanerUtils.LOANER_ORDER_TABLE) {
			loanerOrderGr = current;
		} else if (current.getTableName() === HampLoanerUtils.LOANER_TASK_TABLE) {
			loanerOrderGr = current.loaner_order;
		}
		if (gs.nil(loanerOrderGr)) {
			return '';
		}

		var location = loanerOrderGr.location;
		var model = loanerOrderGr.model;
		var startDate = loanerOrderGr.start_date;
		var returnDate = loanerOrderGr.return_date;
		var leadTime = loanerOrderGr.lead_time;

		var assetsarray = this.getAssetsAvailableToAllocate(location, model, startDate, returnDate, leadTime);
		var filter = 'sys_idIN' + assetsarray;
		return filter;
	},
	updateAssetPrepared: function (current) {
		new global.GlideQuery('sn_hamp_loaner_asset_order')
			.where('sys_id', current.loaner_order)
			.update({
				asset_prepared: true,
			});
	},
	updateAssetStockroomOnLoanerOrder: function (loanerTaskGr) {
		var assetStockroom = loanerTaskGr.loaner_order.asset.stockroom;
		if (!gs.nil(assetStockroom)) {
			new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
				.where('sys_id', loanerTaskGr.loaner_order)
				.update({
					asset_stockroom: assetStockroom,
				});
		}
	},
	updateReturnedOn: function (current) {
		var gDate = new GlideDateTime();
		new global.GlideQuery('sn_hamp_loaner_asset_order')
			.where('sys_id', current.loaner_order)
			.update({
				returned_on: gDate.getLocalDate(),
			});
	},
	updateAsset: function (assetId, assetData, isConsumable) {
		if (isConsumable) { delete assetData.work_notes; }

		new global.GlideQuery('alm_asset')
			.where('sys_id', assetId)
			.update(assetData);

		if (assetData.work_notes) {
			var assetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, assetId);
			assetGr.work_notes = assetData.work_notes;
			assetGr.update();
		}
	},
	cancelLoanerOrder: function (loanerOrderId) {
		var isAssetDeployed = new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
			.where('loaner_order', loanerOrderId)
			.where('task_name', 'deploy')
			.where('state', 3)
			.selectOne()
			.isPresent();
		if (isAssetDeployed) {
			gs.addErrorMessage(gs.getMessage('Loaner asset order cannot be cancelled once the asset is deployed'));
			return;
		}

		var loanerOrderGr = new global.GlideQuery('sn_hamp_loaner_asset_order')
			.where('sys_id', loanerOrderId)
			.toGlideRecord();
		loanerOrderGr.query();
		loanerOrderGr.next();
		loanerOrderGr.stage = 'cancelled';
		loanerOrderGr.work_notes = gs.getMessage('Loaner order is cancelled by {0}', gs.getUserDisplayName());
		loanerOrderGr.update();

		new global.GlideQuery('sn_hamp_loaner_asset_task')
			.where('loaner_order', loanerOrderId)
			.where('active', true)
			.updateMultiple({
				state: 4,
			});
	},
	triggerLoanerFlow: function (loanerOrder) {
		var defaultFlow = 'sn_hamp.loaner_asset_request_flow';
		var LOANER_DECISION_ID = 'f9a23e38739310107e88ef66fbf6a7db';
		var decisionInputs = {};
		decisionInputs.loaner_asset_order = loanerOrder.sys_id;
		var flow = HAMUtils.getFlowFromDecisionTable(LOANER_DECISION_ID, decisionInputs, defaultFlow);
		if (gs.nil(flow)) {
			gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
		} else {
			var inputs = {};
			inputs.current = loanerOrder;
			inputs.table_name = 'sn_hamp_loaner_asset_order';
			var flowContextID = sn_hamp.HAMUtils.triggerFlowAsyncronously(flow, inputs);
			if (!gs.nil(flowContextID)) {
				new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
					.where('sys_id', loanerOrder.sys_id)
					.update({
						flow_context: flowContextID,
					});
			}
		}
	},
	earlyReturnLoanerAsset: function (loanerOrder, loanerAsset, returnedOn, stockroom, isAssetFunctional) {
		var loanerGq = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
			.where('sys_id', loanerOrder);
		var loanerGr = loanerGq.toGlideRecord();
		loanerGr.query();
		loanerGr.next();
		var returnedOnInternalFormat = HAMUtils.getDateInInternalFormat(returnedOn);
		loanerGq.update({
			asset_returned: 'Y',
			returned_on: returnedOnInternalFormat,
			is_asset_functional: isAssetFunctional,
		});
		var reclaimTaskId;
		new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
			.where('loaner_order', loanerOrder)
			.where('task_name', 'reclaim')
			.selectOne('sys_id')
			.ifPresent(function (task) {
				reclaimTaskId = task.sys_id;
			});
		if (!gs.nil(reclaimTaskId)) {
			new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
				.where('sys_id', reclaimTaskId)
				.update({
					state: 3,
					assigned_to: gs.getUserID(),
					return_stockroom: stockroom,
				});
		} else {
			var loanerTaskGr = new GlideRecord('sn_hamp_loaner_asset_task');
			loanerTaskGr.initialize();
			loanerTaskGr.setValue('parent', loanerOrder);
			loanerTaskGr.setValue('loaner_order', loanerOrder);
			loanerTaskGr.setValue('task_name', 'reclaim');
			loanerTaskGr.setValue('state', 3);
			loanerTaskGr.setValue('assigned_to', gs.getUserID());
			loanerTaskGr.setValue('return_stockroom', stockroom);
			loanerTaskGr.setValue('short_description', gs.getMessage('Reclaim loaner asset from user'));
			// eslint-disable-next-line max-len
			loanerTaskGr.setValue('description', gs.getMessage('Reclaim loaner asset from user and return to loaner pool'));
			reclaimTaskId = loanerTaskGr.insert();
		}

		var reclaimLoanerTaskGr = HAMUtils.getAsGlideRecord(HampLoanerUtils.LOANER_TASK_TABLE, reclaimTaskId);
		this.updateAssetOnReturn(reclaimLoanerTaskGr);
	},
	updateAssetOnReturn: function (loanerTaskGr /* reclaim task */) {
		var returnStockroom = String(loanerTaskGr.return_stockroom);

		var loanerOrderGr = loanerTaskGr.loaner_order;
		var isAssetFunctional = String(loanerOrderGr.is_asset_functional);

		var loanerAssetGr = loanerOrderGr.asset;
		var loanerAssetID = loanerAssetGr.sys_id;

		var assetUpdateJSON = {};
		assetUpdateJSON = {
			install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
			substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
			stockroom: returnStockroom,
			reserved_for: null,
			assigned_to: null,
			assigned: null,
			install_date: null,
			managed_by: null,
		};

		var msgParams = [loanerAssetGr.getDisplayValue(), loanerTaskGr.getDisplayValue()];
		if (isAssetFunctional === 'N') {
			assetUpdateJSON.substatus = HAMConstants.ASSET_SUB_STATUSES.PENDING_REPAIR;
			// eslint-disable-next-line max-len
			assetUpdateJSON.work_notes = gs.getMessage('Asset {0} updated to state In stock and substate Pending repair as part of task {1}', msgParams);
		} else {
			// eslint-disable-next-line max-len
			assetUpdateJSON.work_notes = gs.getMessage('Asset {0} updated to state In stock and substate Available as part of task {1}', msgParams);
		}

		// Check if the asset is part of another loaner order
		var otherLoanerOrder = HampLoanerUtils.getAnotherLoanerOrderWithAsset(loanerAssetID, loanerOrderGr);

		// If asset is part of another loaner orders, then do not clear process fields
		// as it would result in consumable records getting merged.
		if (gs.nil(otherLoanerOrder)) {
			assetUpdateJSON.process_table = null;
			assetUpdateJSON.process_id = null;
		}

		this.updateAsset(loanerAssetID, assetUpdateJSON, HAMUtils.isConsumableClassAsset(loanerAssetGr));

		// If not part of another loaner order, return. Else stamp other loaner order details on asset
		if (gs.nil(otherLoanerOrder)) { return; }

		var otherLoanerOrderStage = String(otherLoanerOrder.stage);
		if (otherLoanerOrderStage === HampLoanerUtils.STAGE_NEW
			|| otherLoanerOrderStage === HampLoanerUtils.STAGE_PREPARE) {
			assetUpdateJSON = {
				install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
				substatus: HAMConstants.ASSET_SUB_STATUSES.RESERVED,
				stockroom: returnStockroom,
				reserved_for: String(otherLoanerOrder.requested_for),
				assigned_to: null,
				assigned: null,
				install_date: null,
				managed_by: null,
				process_table: otherLoanerOrder.getTableName(),
				process_id: otherLoanerOrder.getUniqueValue(),
			};

			if (isAssetFunctional === 'N') {
				assetUpdateJSON.substatus = HAMConstants.ASSET_SUB_STATUSES.PENDING_REPAIR;
			} else {
				assetUpdateJSON.work_notes = this.getAssetReservedWorkNote(loanerAssetGr, otherLoanerOrder);
			}

			this.updateAsset(loanerAssetID, assetUpdateJSON, HAMUtils.isConsumableClassAsset(loanerAssetGr));
		}
	},
	updateAssetOnPrepareCompletion: function (prepareTaskGr) {
		var loanerOrderGr = prepareTaskGr.loaner_order;
		var requestedFor = String(loanerOrderGr.requested_for);

		var loanerAssetGr = loanerOrderGr.asset;
		var loanerAssetID = String(loanerAssetGr.sys_id);

		var msgParams = [loanerAssetGr.getDisplayValue(), prepareTaskGr.getDisplayValue()];
		// eslint-disable-next-line max-len
		var preparedWorkNote = gs.getMessage('Asset {0} updated to state In stock and substate Pending install as part of task {1}', msgParams);

		var assetUpdateJSON = {
			install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
			substatus: HAMConstants.ASSET_SUB_STATUSES.PENDING_INSTALL,
			reserved_for: requestedFor,
			process_table: HampLoanerUtils.LOANER_ORDER_TABLE,
			process_id: String(loanerOrderGr.sys_id),
			work_notes: preparedWorkNote,
		};

		this.updateAsset(loanerAssetID, assetUpdateJSON, HAMUtils.isConsumableClassAsset(loanerAssetGr));
	},
	updateAssetOnDeployCompletion: function (deployTaskGr) {
		var loanerOrderGr = deployTaskGr.loaner_order;

		var loanerAssetGr = loanerOrderGr.asset;
		var loanerAssetID = String(loanerAssetGr.sys_id);

		var msgParams = [loanerAssetGr.getDisplayValue(), deployTaskGr.getDisplayValue()];
		var deployedWorkNote = gs.getMessage('Asset {0} updated to state In Use as part of task {1}', msgParams);

		var installStatus;
		if (HAMUtils.isConsumableClassAsset(loanerAssetGr)) {
			installStatus = parseInt(HAMConstants.ASSET_STATUSES.CONSUMED, 10);
		} else {
			installStatus = parseInt(HAMConstants.ASSET_STATUSES.IN_USE, 10);
		}

		var timeNow = new GlideDateTime().toString();
		var assetUpdateJSON = {
			install_status: installStatus,
			substatus: null,
			location: String(loanerOrderGr.location),
			work_notes: deployedWorkNote,
			assigned: timeNow,
			install_date: timeNow,
			process_table: HampLoanerUtils.LOANER_ORDER_TABLE,
			process_id: String(loanerOrderGr.sys_id),
		};

		if (String(loanerOrderGr.request_type) !== HampLoanerUtils.LOANER_ORDER_TYPE_THIRD_PARTY) {
			assetUpdateJSON.assigned_to = String(loanerOrderGr.requested_for);
		}

		if (String(loanerOrderGr.request_type) === HampLoanerUtils.LOANER_ORDER_TYPE_THIRD_PARTY) {
			// Explictily marking null to overcome glidequery issue.
			// current.reserved_for.nil() returns false even though reserved_for is null
			assetUpdateJSON.managed_by = String(loanerOrderGr.opened_by);
			assetUpdateJSON.assigned_to = null;
			assetUpdateJSON.reserved_for = null;
		}

		this.updateAsset(loanerAssetID, assetUpdateJSON, HAMUtils.isConsumableClassAsset(loanerAssetGr));
	},
	canOrderBeCancelled: function (loanerOrder) {
		if (gs.hasRole('inventory_user')) {
			return true;
		}
		var canCancel = false;
		new global.GlideQuery('sn_hamp_loaner_asset_order')
			.where('sys_id', loanerOrder)
			.selectOne('opened_by', 'requested_for')
			.ifPresent(function (rec) {
				if (rec.opened_by === gs.getUserID() || rec.requested_for === gs.getUserID()) {
					canCancel = true;
				}
			});
		return canCancel;
	},
	isAssetAvailable: function (current) {
		var loanerOrderGr;
		if (current.getTableName() === HampLoanerUtils.LOANER_ORDER_TABLE) {
			loanerOrderGr = current;
		} else if (current.getTableName() === HampLoanerUtils.LOANER_TASK_TABLE) {
			loanerOrderGr = current.loaner_order;
		}
		var selectedAsset = String(loanerOrderGr.asset);
		var availableAssets = this.getAssetsAvailableToAllocate(
			loanerOrderGr.location,
			loanerOrderGr.model,
			loanerOrderGr.start_date,
			loanerOrderGr.return_date,
			loanerOrderGr.lead_time,
			loanerOrderGr.sys_id
		);
		if (availableAssets.indexOf(selectedAsset) !== -1) {
			return true;
		}
		return false;
	},
	canAccess: function (loanerOrder) {
		var res = new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
			.where('loaner_order', loanerOrder.sys_id)
			.where('assigned_to', gs.getUserID())
			.selectOne()
			.isPresent();
		return res;
	},
	isLoanerAssetExist: function (location, model) {
		var assets = new GlideRecordSecure('alm_asset');
		HampLoanerUtils.addLoanerBaseQuery(assets, location, model);
		assets.addQuery('install_status', 'NOT IN', HampLoanerUtils.ASSET_IN_USE_STATUSES);
		assets = sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(assets);
		assets.setLimit(1);
		assets.query();
		if (assets.hasNext()) {
			return true;
		}

		var loanerOrdersGa = new GlideRecordSecure(HampLoanerUtils.LOANER_ORDER_TABLE);
		HampLoanerUtils.addInUseFunctioningAssetsQuery(loanerOrdersGa, location, '');
		loanerOrdersGa.setLimit(1);
		loanerOrdersGa.query();
		return loanerOrdersGa.hasNext();
	},
	getFunctioningLoanerAssetsCount: function (location, model) {
		var inStockFunctioningAssets = this.getInStockFunctioningLoanerAssetsCount(location, model);
		var inUseFunctioningAssets = this.getInUseFunctioningLoanerAssetsCount(location, model);
		return (inStockFunctioningAssets + inUseFunctioningAssets);
	},
	getInStockFunctioningLoanerAssetsCount: function (location, model) {
		var assetsGa = new GlideAggregate('alm_asset');
		HampLoanerUtils.addLoanerBaseQuery(assetsGa, location, model);
		HampLoanerUtils.addInStockFunctioningAssetsQuery(assetsGa);
		assetsGa = sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(assetsGa);
		assetsGa.addAggregate('SUM', 'quantity');
		assetsGa.groupBy('model');
		assetsGa.query();
		if (assetsGa.next()) {
			return (parseInt(assetsGa.getAggregate('SUM', 'quantity'), 10));
		}
		return 0;
	},
	getInUseFunctioningLoanerAssetsCount: function (location, model) {
		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		HampLoanerUtils.addInUseFunctioningAssetsQuery(loanerOrdersGa, location, model);
		loanerOrdersGa.addAggregate('COUNT');
		loanerOrdersGa.query();
		if (loanerOrdersGa.next()) {
			return (parseInt(loanerOrdersGa.getAggregate('COUNT'), 10));
		}
		return 0;
	},
	isWaitlistedEditable: function (loanerOrderGr) {
		var stage = loanerOrderGr.getValue('stage');
		if (stage === HampLoanerUtils.STAGE_NEW) {
			return true;
		}
		if (stage === HampLoanerUtils.STAGE_PREPARE) {
			var prepareTask = new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
				.where('loaner_order', loanerOrderGr.getUniqueValue())
				.where('task_name', HampLoanerUtils.TASK_PREPARE)
				.select('state')
				.toArray(1);
			if (prepareTask[0] && parseInt(prepareTask[0].state, 10) === HampLoanerUtils.TASK_CLOSED_COMPLETE) {
				return false;
			}
			return true;
		}
		return false;
	},
	isPrepareTaskClosedComplete: function (loanerOrderGr) {
		var stage = loanerOrderGr.getValue('stage');
		if (stage === HampLoanerUtils.STAGE_NEW) {
			return false;
		}
		var prepareTask = new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
			.where('loaner_order', loanerOrderGr.getUniqueValue())
			.where('task_name', HampLoanerUtils.TASK_PREPARE)
			.select('state')
			.toArray(1);
		if (prepareTask[0] && parseInt(prepareTask[0].state, 10) === HampLoanerUtils.TASK_CLOSED_COMPLETE) {
			return true;
		}
		return false;
	},
	isLoanerFieldEditable: function (loanerOrderGr, field) {
		switch (field) {
		case 'asset':
			return !this.isPrepareTaskClosedComplete(loanerOrderGr);
		case 'model':
			return !this.isPrepareTaskClosedComplete(loanerOrderGr);
		default:
			return true;
		}
	},
	getAssetReservedWorkNote: function (assetGr, loanerOrderGr) {
		var msgParams = [assetGr.getDisplayValue(), loanerOrderGr.getDisplayValue()];
		// eslint-disable-next-line max-len
		var workNote = gs.getMessage('Asset {0} updated to state In stock and substate Reserved due to selection on loaner asset order {1}', msgParams);
		return workNote;
	},
	compareOrdersStartDates: function (loanerOrder1, loanerOrder2) {
		return HAMUtils.compareDates(String(loanerOrder1.start_date), String(loanerOrder2.start_date));
	},
	setAssetStatusOnSelection: function (loanerOrderGr, selectedAssetGr) {
		var selectedAssetID = selectedAssetGr.sys_id.toString();
		var selectionWorkNote = this.getAssetReservedWorkNote(selectedAssetGr, loanerOrderGr);

		var otherLoanerOrder;
		var assetUpdateJSON = {};

		if (HAMUtils.isConsumableClassAsset(selectedAssetGr)) {
			var processedConsumableID = HampLoanerUtils.splitConsumableOnLoanerOrder(loanerOrderGr);
			if (selectedAssetID !== processedConsumableID) {
				// A new consumable with required attributes record is created in this case.
				loanerOrderGr.setValue('asset', processedConsumableID);
			}
		}
		var setAssetID = loanerOrderGr.getValue('asset');

		// Check if selected asset is already part of another loaner order.
		otherLoanerOrder = HampLoanerUtils.getAnotherLoanerOrderWithAsset(selectedAssetID, loanerOrderGr);

		// If it is part of another loaner order, but the other loaner order start date comes first, do nothing.
		// Else update the consumable with incoming loaner asset order details.
		if (!gs.nil(otherLoanerOrder) && this.compareOrdersStartDates(loanerOrderGr, otherLoanerOrder) !== '>') {
			return;
		}

		assetUpdateJSON = {
			install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
			substatus: HAMConstants.ASSET_SUB_STATUSES.RESERVED,
			reserved_for: String(loanerOrderGr.requested_for),
			process_table: HampLoanerUtils.LOANER_ORDER_TABLE,
			process_id: loanerOrderGr.getUniqueValue(),
			work_notes: selectionWorkNote,
		};
		this.updateAsset(setAssetID, assetUpdateJSON, HAMUtils.isConsumableClassAsset(selectedAssetGr));
	},
	setAssetStatusOnRemoval: function (loanerOrderGr, assetGr, isCancelledOrDeleted) {
		// If loaner asset orders not in New, Prepare are deleted, do nothing.
		if (isCancelledOrDeleted === HampLoanerUtils.LOANER_ORDER_ACTION_DELETED) {
			var loanerOrderStage = String(loanerOrderGr.stage);
			if (!((loanerOrderStage === HampLoanerUtils.STAGE_NEW)
				|| (loanerOrderStage === HampLoanerUtils.STAGE_PREPARE))) { return; }
		}

		var assetId = assetGr.sys_id.toString();
		var otherLoanerOrderStage;
		var dateComp;

		// If the asset is removed from the loaner asset order which is not the one with earliest start date
		// do nothing
		var otherLoanerOrder = HampLoanerUtils.getAnotherLoanerOrderWithAsset(assetId, loanerOrderGr);
		if (!gs.nil(otherLoanerOrder)) {
			otherLoanerOrderStage = String(otherLoanerOrder.stage);
			if (otherLoanerOrderStage === HampLoanerUtils.STAGE_DEPLOYED) { return; }

			dateComp = this.compareOrdersStartDates(loanerOrderGr, otherLoanerOrder);
			if (dateComp === '<' && (otherLoanerOrderStage === HampLoanerUtils.STAGE_NEW
				|| otherLoanerOrderStage === HampLoanerUtils.STAGE_PREPARE)) { return; }
		}

		// If the asset is removed from the loaner asset order with the earliest start date
		// move the asset to a state of available
		var msgParams = [assetGr.getDisplayValue(), loanerOrderGr.getDisplayValue()];
		var removalWorkNote;
		if (isCancelledOrDeleted === HampLoanerUtils.LOANER_ORDER_ACTION_CANCELLED) {
			// eslint-disable-next-line max-len
			removalWorkNote = gs.getMessage('Asset {0} updated to state In stock and substate Available due to cancellation of loaner asset order {1}', msgParams);
		} else if (isCancelledOrDeleted === HampLoanerUtils.LOANER_ORDER_ACTION_DELETED) {
			// eslint-disable-next-line max-len
			removalWorkNote = gs.getMessage('Asset {0} updated to state In stock and substate Available due to deletion of loaner asset order {1}', msgParams);
		} else {
			// eslint-disable-next-line max-len
			removalWorkNote = gs.getMessage('Asset {0} updated to state In stock and substate Available due to removal from loaner asset order {1}', msgParams);
		}

		var assetUpdateJSON = {};
		assetUpdateJSON = {
			install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
			substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
			reserved_for: null,
			process_table: null,
			process_id: null,
			work_notes: removalWorkNote,
		};

		this.updateAsset(assetId, assetUpdateJSON, HAMUtils.isConsumableClassAsset(assetGr));

		// If the asset is part of another active loaner order with a greater start date,
		// set the asset as reserved for that order.
		if (!gs.nil(otherLoanerOrder)) {
			otherLoanerOrderStage = String(otherLoanerOrder.stage);
			if (dateComp === '>' && (otherLoanerOrderStage === HampLoanerUtils.STAGE_NEW
				|| otherLoanerOrderStage === HampLoanerUtils.STAGE_PREPARE)) {
				var selectionWorkNote = this.getAssetReservedWorkNote(assetGr, otherLoanerOrder);
				assetUpdateJSON = {
					install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
					substatus: HAMConstants.ASSET_SUB_STATUSES.RESERVED,
					reserved_for: String(otherLoanerOrder.requested_for),
					work_notes: selectionWorkNote,
					process_table: otherLoanerOrder.getTableName(),
					process_id: otherLoanerOrder.getUniqueValue(),
				};
				this.updateAsset(assetId, assetUpdateJSON, HAMUtils.isConsumableClassAsset(assetGr));
			}
		}
	},
	showLoanerAssetOrdersListOnAsset: function (assetGr) {
		/** ***********************************************************************************
			* Hiding loaner order related list for consumables if they are not supported by process columns
			*********************************************************************************** */
		if (HAMUtils.isConsumableClassAsset(assetGr) && !HAMUtils.isConsumablesSupportedByProcess()) {
			return false;
		}
		if (assetGr.getValue('asset_function') === HAMConstants.ASSET_FUNCTION.LOANER) {
			return true;
		}

		var showLoanerAssetOrders = false;
		if (HAMUtils.isConsumableClassAsset(assetGr)) {
			/** ***********************************************************************************
			* Consumable history can only be got in conjunction with install status and stockroom.
			*********************************************************************************** */
			if (assetGr.getValue('install_status') === HAMConstants.ASSET_STATUSES.IN_STOCK) {
				showLoanerAssetOrders = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
					.whereNotNull('asset')
					.where('model', assetGr.getValue('model'))
					.where('asset_stockroom', assetGr.getValue('stockroom'))
					.selectOne()
					.isPresent();
			}
			return showLoanerAssetOrders;
		}

		/** ***********************************************************************************
		* In case of Asset, Hardware, Facility, Bundle class, check if record is in orders.
		*********************************************************************************** */
		showLoanerAssetOrders = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
			.where('asset', assetGr.getUniqueValue())
			.selectOne()
			.isPresent();
		return showLoanerAssetOrders;
	},
	type: 'HampLoanerUtils',
};
HampLoanerUtils.addDomainFilterQuery = function (records) {
	if (global.ModelUtils.isDomainSeparationEnabled()) {
		var domainID = new global.AssetManagementBaseJob().getCurrentDomainSysId();
		records.addQuery('sys_domain', domainID);
	}
};
HampLoanerUtils.getLoanerCommonBaseQuery = function (location, model) {
	var assets = new GlideAggregate('alm_asset');
	assets.addQuery('asset_function', 'loaner');
	if (!(HAMUtils.isConsumablesSupportedByProcess())) {
		var consumableExt = HAMUtils.getTableExtensions(HAMConstants.ALM_CONSUMABLE_TABLE);
		assets.addQuery('sys_class_name', 'NOT IN', consumableExt);
	}
	// Exclude EAM assets and EAM models
	var eamModelExt = HAMUtils.getEAMModelClasses();
	assets.addQuery('model.sys_class_name', 'NOT IN', eamModelExt);
	var eamAssetExt = HAMUtils.getEAMAssetClasses();
	assets.addQuery('sys_class_name', 'NOT IN', eamAssetExt);
	assets.addQuery('sys_class_name', '!=', 'alm_license');
	if (!gs.nil(model)) {
		assets.addQuery('model', model);
	}
	HampLoanerUtils.addDomainFilterQuery(assets);
	return assets.getEncodedQuery();
};
HampLoanerUtils.getLoanerBaseQueryWithLocation = function (location, commonBaseQuery) {
	location = GlideStringUtil.escapeQueryTermSeparator(location);
	var baseQueryWithLocation = commonBaseQuery;
	if (!gs.nil(location)) {
		baseQueryWithLocation += '^location=' + location;
		baseQueryWithLocation += '^NQ' + commonBaseQuery + '^locationISEMPTY^stockroom.location=' + location;
		var stockroomsServingLoc = new sn_itam_common.InventoryUtil()._getStockroomsServicingLocation(location);
		if(stockroomsServingLoc.length > 0) {
			baseQueryWithLocation += '^NQ' + commonBaseQuery + '^stockroomIN' + stockroomsServingLoc;
		}
	}
	return baseQueryWithLocation;
};
HampLoanerUtils.addLoanerBaseQuery = function (assets, location, model) {
	var commonBaseQuery = HampLoanerUtils.getLoanerCommonBaseQuery(location, model);
	var baseQueryWithLocation = HampLoanerUtils.getLoanerBaseQueryWithLocation(location, commonBaseQuery);
	assets.addEncodedQuery(baseQueryWithLocation,true);
};
HampLoanerUtils.addInStockFunctioningAssetsQuery = function (assets) {
	// Assets are considered functioning if the state and substatus are:
	// state: in_stock (6) | substatus: available, reserved, pending_install
	// OR state: in_use (1)
	var validInstallStatus = HAMConstants.ASSET_STATUSES.IN_STOCK;
	var validSubstatus = [
		HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
		HAMConstants.ASSET_SUB_STATUSES.RESERVED,
		HAMConstants.ASSET_SUB_STATUSES.PENDING_INSTALL,
	];
	assets.addQuery('install_status', validInstallStatus);
	assets.addQuery('substatus', validSubstatus)
		.addOrCondition('substatus', '');
	HampLoanerUtils.addDomainFilterQuery(assets);
};
HampLoanerUtils.addInUseFunctioningAssetsQuery = function (loanerOrders, location, model) {
	var validStatus = [HAMConstants.ASSET_STATUSES.IN_USE];
	if (HAMUtils.isConsumablesSupportedByProcess()) {
		validStatus.push(HAMConstants.ASSET_STATUSES.CONSUMED);
	}
	loanerOrders.addQuery('location', location);
	if (!gs.nil(model)) {
		loanerOrders.addQuery('model', model);
	}
	loanerOrders.addQuery('asset.install_status', validStatus);
	loanerOrders.addQuery('asset.asset_function', 'loaner');
	loanerOrders.addQuery('stage', HampLoanerUtils.STAGE_DEPLOYED);
	HampLoanerUtils.addDomainFilterQuery(loanerOrders);
};
HampLoanerUtils.convertDateStringToDateObj = function (dateString) {
	var gdt = new GlideDateTime(dateString);
	return gdt;
};
HampLoanerUtils.convertDateObjToDateString = function (date) {
	var yearStr = String(date.getFullYear());
	var monthStr = String(date.getMonth() + 1);
	if (monthStr.length === 1) { monthStr = '0' + monthStr; }
	var dateStr = String(date.getDate());
	if (dateStr.length === 1) { dateStr = '0' + dateStr; }
	return yearStr + '-' + monthStr + '-' + dateStr;
};
HampLoanerUtils.getPreparationStartDate = function (startDate, leadTime) {
	var leadTimeInDays = parseInt(leadTime, 10);
	var minusDays = 0 - leadTimeInDays;

	var preparationStartDateObj = HampLoanerUtils.convertDateStringToDateObj(String(startDate));
	if (leadTimeInDays > 0) {
		preparationStartDateObj.addDaysLocalTime(minusDays);
	}
	var preparationStartDateStr = preparationStartDateObj.getDate().getValue();

	var currentDateStr = new GlideDateTime().getLocalDate().toString();
	var currentDateObj = HampLoanerUtils.convertDateStringToDateObj(currentDateStr);

	if (preparationStartDateObj.getNumericValue() <= currentDateObj.getNumericValue()) {
		return currentDateStr;
	}
	return preparationStartDateStr;
};
HampLoanerUtils.addLoanerOrdersOverlapQuery = function (loanerOrders, startDate, returnDate, leadTime, isGlideQuery) {
	var preparationStartDate = HampLoanerUtils.getPreparationStartDate(startDate, leadTime);
	if (isGlideQuery) {
		var enhancedQuery = loanerOrders.where('preparation_start_date', '<=', returnDate);
		enhancedQuery = enhancedQuery.where('return_date', '>=', preparationStartDate);
		return enhancedQuery;
	}
	loanerOrders.addQuery('start_date', '<=', returnDate);
	loanerOrders.addQuery('return_date', '>=', preparationStartDate);
	return loanerOrders;
};

HampLoanerUtils.convertUTCtoTimezone = function (utcTime, timeZone) {
	if (!gs.nil(timeZone)) {
		var gr = new GlideScheduleDateTime(utcTime);
		var currentTime = gr.convertTimeZone('UTC', timeZone);
		return new GlideDateTime(currentTime);
	}
	return utcTime;
};
/* utcTime is GlideDateTime object 
 Returns millisecond epoch in the required timezone.
 convertUTCtoTimezone does not handle date formats.
 convertUTCtoTimezoneMS handles date formats.*/
HampLoanerUtils.convertUTCtoTimezoneMS = function(utcTime, timeZone) {
	if (!gs.nil(timeZone)) {
		var gr = new GlideScheduleDateTime(utcTime);
		var currentTime = gr.convertTimeZone('UTC', timeZone);
		return new GlideScheduleDateTime(currentTime).getMS();
	}
	return utcTime.getNumericValue();
};
HampLoanerUtils.getTimezoneOfLocation = function (location) {
	var locObj = new global.GlideQuery('cmn_location')
		.get(location, ['time_zone']);
	if (!gs.nil(locObj) && !gs.nil(locObj._value) && !gs.nil(locObj._value.time_zone)) {
		return locObj._value.time_zone;
	}
	return '';
};
HampLoanerUtils.splitConsumableOnLoanerOrder = function (loanerOrderGr) {
	var quantity = 1; // Only consumables with quantity 1 can be requested as of now.

	var consumableID = loanerOrderGr.getValue('asset');
	var consumableGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, consumableID);
	var newConsumableID = consumableID;

	if (quantity < parseInt(consumableGr.getValue('quantity'), 10)) {
		newConsumableID = new global.Consumables().split(
			consumableID,
			quantity,
			consumableGr.getValue('install_status'),
			HAMConstants.ASSET_SUB_STATUSES.RESERVED,
			'',
			consumableGr.getValue('stockroom'),
			consumableGr.getValue('location'),
			'',
			'loaner', {
				process_table: loanerOrderGr.getTableName(),
				process_id: loanerOrderGr.getUniqueValue(),
				reserved_for: loanerOrderGr.getValue('requested_for'),
			}
		);
	}
	return newConsumableID;
};
HampLoanerUtils.consumableMergeConditionCheck = function (consumableGr) {
	var canMerge = true;
	if (consumableGr.getValue('process_table') === HampLoanerUtils.LOANER_ORDER_TABLE
		&& !gs.nil(consumableGr.getValue('process_id'))) {
		canMerge = false;
	}
	return canMerge;
};
HampLoanerUtils.getAnotherLoanerOrderWithAsset = function (assetId, excludeLoanerOrderGr) {
	var loanerOrder = '';
	var assetExists = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
		.where('asset', assetId)
		.where('sys_id', '!=', String(excludeLoanerOrderGr.sys_id))
		.where('stage', 'IN', [
			HampLoanerUtils.STAGE_NEW,
			HampLoanerUtils.STAGE_PREPARE,
			HampLoanerUtils.STAGE_DEPLOYED,
		])
		.where('is_waitlisted', false)
		.orderBy('start_date')
		.toGlideRecord();
	assetExists.setLimit(1);
	assetExists.query();
	if (assetExists.next()) {
		loanerOrder = assetExists;
	}
	return loanerOrder;
};
HampLoanerUtils.canCloseLoanerTask = function (loanerTaskGr) {
	var hasAccess = gs.getUser().hasRole('itil') || gs.hasRole('inventory_user')
	|| String(loanerTaskGr.assigned_to) === gs.getUserID();
	return (hasAccess && (loanerTaskGr.getValue('state') === '1' || loanerTaskGr.getValue('state') === '2'));
};
HampLoanerUtils.validateFieldsForLoaner = function (loanerTaskGr) {
	var message;
	var msgParams = [];
	if ((loanerTaskGr.getValue('task_name') === 'prepare') && loanerTaskGr.getValue('state') !== '4') {
		// check mandatory fields are filled on Prepare task
		if (!loanerTaskGr.loaner_order.asset) {
			msgParams.push(loanerTaskGr.loaner_order.asset.getLabel());
		}
		if (msgParams.length > 0) {
			message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
			gs.addErrorMessage(message);
		}
		if (loanerTaskGr.loaner_order.asset) {
			message = (new sn_hamp.HAMLicensingUtility()).getExcludedAssetErrorMessage(loanerTaskGr.loaner_order.asset);
			if(!gs.nil(message)) {
				msgParams.push(message);
				//Next 2 lines have been added as a workaround to avoid 2 error messages from appearing in Classic workspace, will be removed once platform fix is done.
				var inputURL = String(gs.action.getGlideURI());
				if (inputURL.indexOf('.do?') === -1) {
					gs.addErrorMessage(message);
				}
			}
		}
	} else if ((loanerTaskGr.getValue('task_name') === 'reclaim') && loanerTaskGr.getValue('state') !== '4') {
		// check mandatory fields are filled on Reclaim task
		if (!loanerTaskGr.getValue('return_stockroom')) {
			msgParams.push(loanerTaskGr.return_stockroom.getLabel());
		}
		if (msgParams.length > 0) {
			message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
			gs.addErrorMessage(message);
		}
		var msg;
		if (loanerTaskGr.loaner_order.asset_returned.toString() === 'N') {
			// eslint-disable-next-line max-len
			msg = gs.getMessage('To complete the task, update {0} value to Yes', loanerTaskGr.loaner_order.asset_returned.getLabel());
			msgParams.push(loanerTaskGr.loaner_order.asset_returned.getLabel());
			gs.addErrorMessage(msg);
		}
		if (loanerTaskGr.loaner_order.is_asset_functional.toString() === '') {
			// eslint-disable-next-line max-len
			msg = gs.getMessage('To complete the task, update {0} value to either Yes or No', loanerTaskGr.loaner_order.is_asset_functional.getLabel());
			msgParams.push(loanerTaskGr.loaner_order.is_asset_functional.getLabel());
			gs.addErrorMessage(msg);
		}
	}
	if (msgParams.length === 0) {
		if (loanerTaskGr.getValue('state') !== '4') {
			loanerTaskGr.state = 3;
		}
		loanerTaskGr.update();
	}
	if (loanerTaskGr.getValue('state') !== '3') { // redirect to task page only if its incomplete
		return loanerTaskGr;
	}
	return loanerTaskGr.loaner_order.getRefRecord();
};
HampLoanerUtils.LOANER_ORDER_TABLE = 'sn_hamp_loaner_asset_order';
HampLoanerUtils.LOANER_TASK_TABLE = 'sn_hamp_loaner_asset_task';
HampLoanerUtils.STAGE_NEW = 'new';
HampLoanerUtils.STAGE_PREPARE = 'prepare';
HampLoanerUtils.STAGE_DEPLOYED = 'deployed';
HampLoanerUtils.STAGE_COMPLETED = 'completed';
HampLoanerUtils.STAGE_CANCELLED = 'cancelled';
HampLoanerUtils.TASK_CLOSED_COMPLETE = 3;
HampLoanerUtils.TASK_PREPARE = 'prepare';
HampLoanerUtils.LOANER_ORDER_ACTION_CANCELLED = 'cancelled';
HampLoanerUtils.LOANER_ORDER_ACTION_DELETED = 'deleted';
HampLoanerUtils.LOANER_ORDER_TYPE_THIRD_PARTY = 'for_third_party_user';
HampLoanerUtils.ASSET_IN_USE_STATUSES = [HAMConstants.ASSET_STATUSES.IN_USE,
	HAMConstants.ASSET_STATUSES.CONSUMED];