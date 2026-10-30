function validateInsertStatusWithoutCSDM() {
	if (!current.status.changes()) {
		return null;
	}
	if (String(current.status) !== sn_hamp.HAMConstants.MODEL_STATUSES.BUILD) {
		// eslint-disable-next-line max-len
		return gs.getMessage("Bundled model with 'Bundle assets' checked can only be created with status - Build.");
	}
	return null;
}
function validateInsertStatusWithCSDM() {
	if (sn_hamp.HAMUtils.areCSDMFieldsChanged(current)) {
		if (String(current.life_cycle_stage) !== sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.DESIGN
			&& String(current.life_cycle_stage_status) !== sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.BUILD) {
			// eslint-disable-next-line max-len
			return gs.getMessage("Bundled model with 'Bundle assets' checked can only be created with lifecycle stage - Design and lifecycle stage status - Build.");
		}
		return null;
	}
	return validateInsertStatusWithoutCSDM();
}
function validateUpdateStatusWithoutCSDM() {
	if (!current.status.changes()) {
		return null;
	}
	if (String(current.status) === sn_hamp.HAMConstants.MODEL_STATUSES.BUILD
		&& sn_hamp.HAMUtils.isAssetExistForModel(current)) {
		// eslint-disable-next-line max-len
		return gs.getMessage("Status cannot be changed to 'Build'; Asset bundles are associated with bundled model record");
	}
	if (String(current.status) !== sn_hamp.HAMConstants.MODEL_STATUSES.IN_PRODUCTION
		&& sn_hamp.HAMUtils.isComponentOfBudledModel(current)) {
		// eslint-disable-next-line max-len
		return gs.getMessage("Status cannot be changed to '{0}'; This record is a component of another bundled model", [String(current.status)]);
	}
	return null;
}
function validateUpdateStatusWithCSDM() {
	if (sn_hamp.HAMUtils.areCSDMFieldsChanged(current)) {
		if (String(current.life_cycle_stage) === sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.DESIGN
			&& String(current.life_cycle_stage_status) === sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.BUILD
			&& sn_hamp.HAMUtils.isAssetExistForModel(current)) {
			// eslint-disable-next-line max-len
			return gs.getMessage("Lifecycle stage cannot be changed to 'Design' and lifecycle stage status cannot be changed to 'Build'; Asset bundles are associated with bundled model record");
		}
		if (String(current.life_cycle_stage) !== sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.OPERATIONAL
			&& String(current.life_cycle_stage_status) !== sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.IN_USE
			&& sn_hamp.HAMUtils.isComponentOfBudledModel(current)) {
			// eslint-disable-next-line max-len
			return gs.getMessage("Lifecycle stage cannot be changed to '{0}' and Lifecycle stage status to '{1}'; This record is a component of another bundled model", [String(current.life_cycle_stage), String(current.life_cycle_stage_status)]);
		}
		return null;
	}
	return validateUpdateStatusWithoutCSDM();
}
(function executeRule(current, previous /* null when async */) {
	var operation = current.operation();

	var message;

	if (operation === 'insert') {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			message = validateInsertStatusWithCSDM();
		} else {
			message = validateInsertStatusWithoutCSDM();
		}
	} else if (operation === 'update') {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			message = validateUpdateStatusWithCSDM();
		} else {
			message = validateUpdateStatusWithoutCSDM();
		}
	} else if (operation === 'delete' && sn_hamp.HAMUtils.isAssetExistForModel(current)) {
		// If there are assets for this model, Dont allow delete.
		message = gs.getMessage('Cannot delete as bundled assets are associated with it');
	}

	// Make sure model_category always has 'Bundle'.
	if ((operation === 'insert' || operation === 'update')
		&& String(current.cmdb_model_category).indexOf(sn_hamp.HAMConstants.BUNDLE_CATEGORY_ID) === -1) {
		message = gs.getMessage("Model category of 'Bundle' is required for creation of a Bundled model record");
	}
	// If message is not empty abort.
	if (!gs.nil(message)) {
		gs.addErrorMessage(message);
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));