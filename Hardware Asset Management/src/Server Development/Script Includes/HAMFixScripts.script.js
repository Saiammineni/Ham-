var HAMFixScripts = Class.create();
HAMFixScripts.prototype = {
	initialize: function() {
	},
	runLoanerOrderPrepStartDateFixScript: function () {
		var loanerOrdersWithoutPrepStartDate = [];
		new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
			.whereNull('preparation_start_date')
			.where('stage', '!=', HampLoanerUtils.STAGE_COMPLETED)
			.where('stage', '!=', HampLoanerUtils.STAGE_CANCELLED)
			.select('sys_id', 'start_date', 'lead_time')
			.forEach(function (loanerOrder) {
				loanerOrdersWithoutPrepStartDate.push(loanerOrder);
			});

		var loanerOrder;
		var loanerTask;
		var preparationStartDate;
		for (var i = 0; i < loanerOrdersWithoutPrepStartDate.length; i++) {
			loanerOrder = loanerOrdersWithoutPrepStartDate[i];
			loanerTask = new global.GlideQuery(HampLoanerUtils.LOANER_TASK_TABLE)
				.where('loaner_order', loanerOrder.sys_id)
				.where('task_name', HampLoanerUtils.TASK_PREPARE)
				.selectOne('sys_created_on')
				.orElse(null);
			if (loanerTask) {
				preparationStartDate = new GlideDateTime(loanerTask.sys_created_on).getDate();
			} else {
				preparationStartDate = HampLoanerUtils.getPreparationStartDate(
					loanerOrder.start_date,
					loanerOrder.lead_time
				);
			}
			new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
				.where('sys_id', loanerOrder.sys_id)
				.update({ preparation_start_date: preparationStartDate });
		}
	},

	setLoanerOrderStatusValue: function (loanerOrderGr) {
		switch (loanerOrderGr.getValue('stage')) {
		case 'new':
			loanerOrderGr.setValue('loaner_order_status', 'New');
			break;
		case 'prepare':
			loanerOrderGr.setValue('loaner_order_status', 'Prepare');
			break;
		case 'deployed':
			if (loanerOrderGr.return_date >= new GlideDate()) {
				loanerOrderGr.setValue('loaner_order_status', 'Deployed');
			} else {
				loanerOrderGr.setValue('loaner_order_status', 'Return overdue');
			}
			break;
		case 'completed':
			loanerOrderGr.setValue('loaner_order_status', 'Completed');
			break;
		case 'cancelled':
			loanerOrderGr.setValue('loaner_order_status', 'Cancelled');
			break;
		default:
			loanerOrderGr.setValue('loaner_order_status', 'New');
		}
	},

	// Exclude assets based on Resource Category opt-in
	excludeAssets: function(resourceCategories) {
		if(!gs.nil(resourceCategories)) {
			resourceCategories = resourceCategories.split(',');
		}
		var jobLogUtil = new global.AssetJobLogUtil();
		jobLogUtil.startJobLog('Update exclude flag of hardware assets');
		var C_TIMEOUT = 900000;
		var stopWatch = HAMUtils.getStopWatch();
		var recordsProcessed = 0;
		var currentResouceCategory = '';
    while(resourceCategories.length > 0) {
      currentResouceCategory = resourceCategories.pop();
			if (!GlidePluginManager.isActive('sn_ni_core')
				&& currentResouceCategory === sn_hamp.HAMConstants.TNI_RESOURCE_CAT_SYSID) {
				continue;
			}
			var resCatGr = new GlideRecord(HAMConstants.RESOURCE_CATEGORY_TABLE);
			resCatGr.get(currentResouceCategory);
			var excludedFlag = resCatGr.getValue('opt_in') === '1' ? false : true;
			var step = 'Setting flag for ' + resCatGr.getDisplayValue('resource_category') + ', Opted-in : '
                + resCatGr.getDisplayValue('opt_in');
			jobLogUtil.startJobStep(step);
			var assetGr = new GlideRecord(HAMConstants.ALM_ASSET_TABLE);
			assetGr.addQuery('model_category.resource_category', resCatGr.getUniqueValue());
			assetGr.query();
			assetGr.setValue('excluded_from_ham', excludedFlag);
			assetGr.updateMultiple();
			recordsProcessed += 1;
			if (HAMUtils.getStopWatchTime(stopWatch) >= C_TIMEOUT) {
				if (!gs.nil(resourceCategories) && resourceCategories.length > 0) {
					var script = "new sn_hamp.HAMFixScripts().excludeAssets('" + resourceCategories + "');";
					var job = new global.AssetManagementBaseJob();
					job.runScriptByJob(script, new GlideDateTime(), 'HAM - Mark assets for exclusion for batch starting: ' + recordsProcessed);
					jobLogUtil.stopJobStep(step, 'Step completed');
					break;
				}
			}
			jobLogUtil.stopJobStep(step, 'Step completed');
		}
		jobLogUtil.stopJobLog(jobLogUtil.COMPLETED_STATUS, 'Excluded flag set for Resource category records - ' + recordsProcessed);
	},

	addResourceCategoryToTniModels: function() {
		var tniModelCategories = {
			TNI_LOGICAL_CONNECTION_CATEGORY: '06c86f30534a0110b54dddeeff7b1283',
			TNI_EQUIPMENT_HOLDER_CATEGORY: '5fc7a330534a0110b54dddeeff7b1265',
			TNI_INTERFACE_CARD_CATEGORY: '86782730534a0110b54dddeeff7b12ce',
			TNI_PHYSICAL_CONNECTION_CATEGORY: '8ff86f30534a0110b54dddeeff7b1257',
			TNI_INTERFACE_NETWORK_CATEGORY: 'b748e730534a0110b54dddeeff7b125b',
			TNI_TELCO_EQUIPMENT_CATEGORY: 'dc5767bc530a0110b54dddeeff7b12f1',
		};
		var TNI_RESOURCE_CATEGORY = '4425f69615591110fa9bdd247757e4f2';
		for (var modelCategory in tniModelCategories) {
			var modelCatGr = new GlideRecord(sn_hamp.HAMConstants.MODEL_CATEGORY_TABLE);
			if (modelCatGr.get('sys_id', tniModelCategories[modelCategory])) {
				modelCatGr.setValue('resource_category', TNI_RESOURCE_CATEGORY);
				global.ModelUtils.updateDisableBR(modelCatGr);
			}
		}
	},

	populateScannedforExisitingAuditRecords: function() {
		var auditGr = new GlideRecord('sn_hamp_asset_audit');
		auditGr.addQuery('status', 'IN', ['in_progress', 'complete']);
		auditGr.query();
		while (auditGr.next()) {
			var auditAssetGr = new GlideRecord('sn_hamp_m2m_audit_asset');
			auditAssetGr.addQuery('asset_audit', auditGr.getUniqueValue());
			auditAssetGr.addQuery('audit_status', 'IN', ['expected', 'new', 'not_expected']);
			auditAssetGr.setValue('scanned', true);
			auditAssetGr.updateMultiple();
		}
	},
	deprecateColumn: function(tableName, oldCol, oldColLabel, newCol) {
        var grTable = new global.GlideQuery(tableName)
            .whereNotNull(oldCol)
            .select(oldCol, newCol)
            .forEach(function(recInTable) {
                var jsonToUpdate = {};
                jsonToUpdate[newCol] = recInTable[oldCol];
                var grUpdateHardwareAsset = new global.GlideQuery(tableName)
                    .where('sys_id', recInTable.sys_id)
                    .update(jsonToUpdate);
            });
        global.AssetFixScriptUtil.renameFieldLabel(tableName, oldCol, oldColLabel+' (Deprecated)');
    },
	type: 'HAMFixScripts',
};