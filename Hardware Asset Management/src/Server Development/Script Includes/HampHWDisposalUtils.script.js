var HampHWDisposalUtils = Class.create();
HampHWDisposalUtils.ASSET_TABLE = 'alm_asset';
HampHWDisposalUtils.PLANNED_ASSET_TABLE = 'sn_hamp_m2m_hw_asset_disposal';
HampHWDisposalUtils.DISPOSAL_TASK_TABLE = 'sn_hamp_hw_asset_disposal_task';
HampHWDisposalUtils.CLOSED_INCOMPLETE = 4;
HampHWDisposalUtils.prototype = {
	initialize: function() {},

	cancelFromDisposal: function (consumableGr) {
		// Delete the planned asset entries
		new global.GlideQuery(HampHWDisposalUtils.PLANNED_ASSET_TABLE)
			.where('hardware', consumableGr.getUniqueValue())
			.del();
	},

	cancelPlannedAssets: function(disposalRecord) {
		new global.GlideQuery(HampHWDisposalUtils.PLANNED_ASSET_TABLE)
			.where('hardware_disposal', disposalRecord.sys_id)
			.updateMultiple({
				stage: 'cancelled',
			});
	},
	completeDepartureTask: function(taskRecord) {
		var assetAutomationAPI = new AssetAutomationAPI();
		var vendor = taskRecord.hardware_disposal.vendor;
		var vendorOrderID = taskRecord.hardware_disposal.vendor_order_id;
		var gq = new global.GlideQuery(HampHWDisposalUtils.ASSET_TABLE)
			.where('disposal_order_number', taskRecord.hardware_disposal);
		gq.updateMultiple({
			disposal_vendor: vendor,
			vendor_disposal_order_id: vendorOrderID,
		});
		gq.select('ci')
			.forEach(function(assetRecord) {
				if (!gs.nil(assetRecord.ci)) {
					assetAutomationAPI.removeDeviceAlloc(assetRecord.ci); // allocations are deleted
				}
				assetAutomationAPI.removeContractInfo(assetRecord.sys_id); // contracts are removed
			});
		this.updatePlannedAssets(taskRecord.hardware_disposal, 'draft', 'auto_cancelled');
		// If pallet is not departed, remove assets
		// If asset is not departed, remove from pallet
		if (global.AssetUtils.IS_ITAM_COMMON_ACTIVE && sn_itam_common.ITAMCommonPalletsUtil) {
			sn_itam_common.ITAMCommonPalletsUtil.handlePalletAssets(taskRecord.hardware_disposal);
		}
	},
	checkMandatoryFields: function(taskRecord) {
		var msgParams = [];
		if (!taskRecord.hardware_disposal.scheduled_date) {
			msgParams.push(taskRecord.hardware_disposal.scheduled_date.getLabel());
		}
		if (!taskRecord.hardware_disposal.vendor) {
			msgParams.push(taskRecord.hardware_disposal.vendor.getLabel());
		}
		if (taskRecord.getValue('task_name') === 'depart') {
			if (!taskRecord.hardware_disposal.vendor_order_id) {
				msgParams.push(taskRecord.hardware_disposal.vendor_order_id.getLabel());
			}
			if (!taskRecord.hardware_disposal.pickup_contact) {
				msgParams.push(taskRecord.hardware_disposal.pickup_contact.getLabel());
			}
		}
		return msgParams;
	},
	checkTaskCompletion: function(taskRecord) {
		var plannedAssetsCount; // total number of planned assets in the disposal order
		var message;
		var verifiedCount;
		var departedCount;
		var pendingCertCount;
		var disposedCount;
		var abort = false;
		var msgParams = [];
		var gq = new global.GlideQuery(HampHWDisposalUtils.PLANNED_ASSET_TABLE)
			.where('hardware_disposal', taskRecord.hardware_disposal)
			.where('stage', '!=', 'cancelled');
		plannedAssetsCount = gq.count();
		if (plannedAssetsCount === 0) { // Planned assets need to be added process disposal request
			message = gs.getMessage('Please add planned assets to be disposed.');
			abort = true;
		} else if (taskRecord.getValue('task_name') === 'verify') { // check Verify Assets task completion
			verifiedCount = gq.where('stage', 'verified').count();
			if (verifiedCount === 0) {
				message = gs.getMessage('No planned assets have been verified.');
				abort = true;
			} else {
				msgParams = [];
				msgParams.push(verifiedCount + '');
				msgParams.push(plannedAssetsCount + '');
				message = gs.getMessage('{0} of {1} assets have been successfully verified.', msgParams);
			}
		} else if (taskRecord.getValue('task_name') === 'schedule') {
			msgParams = this.checkMandatoryFields(taskRecord);
			if (msgParams.length !== 0) {
				message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
				abort = true;
			} else {
				message = gs.getMessage('Hardware disposal order is successfully scheduled.');
			}
		} else if (taskRecord.getValue('task_name') === 'depart') { // check Asset Departure task completion
			verifiedCount = gq.where('stage', 'verified').count();
			departedCount = gq.where('stage', 'in_transit').count();
			msgParams = this.checkMandatoryFields(taskRecord);
			if (msgParams.length !== 0) {
				message = gs.getMessage('The following mandatory fields are not filled in: {0}', msgParams.join(', '));
				abort = true;
			} else if (departedCount === 0) {
				message = gs.getMessage('No verified assets have been departed.');
				abort = true;
			} else if (verifiedCount !== 0) { // cannot close the task with undeparted veried assets
				msgParams = [];
				msgParams.push(departedCount + '');
				msgParams.push(plannedAssetsCount + '');
				msgParams.push(verifiedCount + '');
				// eslint-disable-next-line max-len
				message = gs.getMessage('{0} of {1} assets have been successfully departed. Depart or cancel the remaining {2} verified planned assets to close the task.', msgParams);
				abort = true;
			} else {
				this.completeDepartureTask(taskRecord);
				msgParams = [];
				msgParams.push(departedCount + '');
				msgParams.push(plannedAssetsCount + '');
				message = gs.getMessage('{0} of {1} assets have been successfully departed.', msgParams);
			}
		} else if (taskRecord.getValue('task_name') === 'confirm') {
			this.updatePlannedAssets(taskRecord.hardware_disposal, 'in_transit', 'pending_certificate');
			message = gs.getMessage('Vendor confirmation received for Hardware disposal order.');
		} else if (taskRecord.getValue('task_name') === 'documentation') { // check Disposal Documentation task
			pendingCertCount = gq.where('stage', 'pending_certificate').count();
			disposedCount = gq.where('stage', 'completed').count();
			var attachments = new GlideSysAttachment().getAttachments(taskRecord.getTableName(), taskRecord.sys_id);
			if (!attachments.next() || taskRecord.hardware_disposal.certificate_of_disposal.toString() === 'N') {
				// eslint-disable-next-line max-len
				message = gs.getMessage('To complete the task, please add disposal report/certificate of data destruction as an attachment and update Certificate of disposal attribute value to Yes.');
				abort = true;
			} else if (disposedCount === 0) {
				message = gs.getMessage('No departed assets have been disposed.');
				abort = true;
			} else if (pendingCertCount !== 0) { // need to dispose all planned assets to close the task
				msgParams = [];
				msgParams.push(disposedCount + '');
				msgParams.push(plannedAssetsCount + '');
				msgParams.push(pendingCertCount + '');
				// eslint-disable-next-line max-len
				message = gs.getMessage('{0} of {1} assets have been successfully disposed. Dispose the remaining {2} departed assets to complete the task.', msgParams);
				abort = true;
			} else {
				msgParams = [];
				msgParams.push(disposedCount + '');
				msgParams.push(plannedAssetsCount + '');
				message = gs.getMessage('{0} of {1} assets have been successfully disposed.', msgParams);
			}
		}
		var outputJson = {
			abort: abort,
			message: message,
		};
		return outputJson;
	},
	locationFilter: function(location) {
		var filter = '';
		if (location) {
			filter = 'location=' + location;
		}
		return filter;
	},
	markActiveTaskClosedIncomplete: function(disposalRecord) {
		var gr = new GlideRecord(HampHWDisposalUtils.DISPOSAL_TASK_TABLE);
		gr.addQuery('hardware_disposal', disposalRecord.sys_id);
		gr.addQuery('state', 'IN', [1, 2]);
		gr.state = HampHWDisposalUtils.CLOSED_INCOMPLETE;
		gr.updateMultiple();
	},
	revert: function(plannedAssetRecord, plannedAssetStage) {
		var hardwareRecord = plannedAssetRecord.hardware.getRefRecord();
		// Clear the disposal fields on asset
		if (hardwareRecord.getValue('disposal_order_number')) {
			hardwareRecord.setValue('disposal_order_number', '');
			hardwareRecord.setValue('disposal_vendor', '');
			hardwareRecord.setValue('vendor_disposal_order_id', '');
			hardwareRecord.setValue('disposal_date', '');
			hardwareRecord.setValue('retired', '');
			hardwareRecord.update();
		}
		// set the stage of already disposed planned assets to draft
		if (plannedAssetStage === 'in_transit' || plannedAssetStage === 'pending_certificate'
		|| plannedAssetStage === 'completed') {
			new global.GlideQuery(HampHWDisposalUtils.PLANNED_ASSET_TABLE)
				.where('hardware', plannedAssetRecord.hardware)
				.where('sys_id', '!=', plannedAssetRecord.sys_id)
				.where('stage', 'already_disposed')
				.updateMultiple({ stage: 'draft' });
		}
	},
	updatePlannedAssets: function(hardwareDisposal, currStage, newStage) {
		new global.GlideQuery(HampHWDisposalUtils.PLANNED_ASSET_TABLE)
			.where('hardware_disposal', hardwareDisposal)
			.where('stage', currStage)
			.updateMultiple({
				stage: newStage,
			});
	},
	plannedAssetsfilter: function() {
		var assetFunctionFilter = 'asset_function!=asset_bundle^ORasset_function=NULL^disposal_order_numberISEMPTY';
		var filter = assetFunctionFilter + '^sys_class_name=alm_hardware^NQ'
			+ assetFunctionFilter + '^sys_class_name=alm_consumable^ref_alm_consumable.planned_for_disposal=true^EQ';
		if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			filter = 'model_categoryIN' + HAMUtils.getEntitledTNIModelCategories() + '^' + filter;
		}
		if (global.AssetUtils.IS_ITAM_COMMON_ACTIVE && sn_itam_common.ITAMCommonPalletsUtil) {
			filter = filter + '^NQ' + sn_itam_common.ITAMCommonPalletsUtil.getPalletQueryForDisposal();
		}
		return filter;
	},
	shouldMarkFieldsReadOnly: function (assetGr) {
		var output = {
			install_status: false,
			substatus: false,
		};
		if (!assetGr.disposal_order_number.nil()
			&& assetGr.getValue('install_status') === '7'
			&& assetGr.getValue('substatus') === 'disposed') {
			output.install_status = true;
			output.substatus = true;
		}
		return output;
	},
	canCancelPannedAsset: function (parent) {
		var result = false;
		var disposalStage;
		if (parent.getTableName() === 'sn_hamp_hardware_disposal') {
			disposalStage = parent.getValue('stage');
		}
		if (parent.getTableName() === 'sn_hamp_hw_asset_disposal_task' && !gs.nil(parent.hardware_disposal)) {
			disposalStage = parent.hardware_disposal.stage.toString();
		}
		var disposalCheck = (disposalStage === 'draft' || disposalStage === 'scheduled' || disposalStage === 'in_transit');
		var adminCheck = gs.hasRole('ham_admin') && disposalStage !== 'cancelled';
		result = disposalCheck || adminCheck;
		return result;
	},
	type: 'HampHWDisposalUtils',
};