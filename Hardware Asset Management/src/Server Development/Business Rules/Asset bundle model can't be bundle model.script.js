function bundleModelErrorMessage(childRef) {
	var isLegacyInProduction = (String(childRef.status) === sn_hamp.HAMConstants.MODEL_STATUSES.IN_PRODUCTION);
	if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
		// eslint-disable-next-line max-len
		var isLifeCycleOperational = (String(childRef.life_cycle_stage) === sn_hamp.HAMConstants.LIFECYCLE_STAGES.OPERATIONAL
		&& String(childRef.life_cycle_stage_status) === sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.IN_USE);
		if (!isLifeCycleOperational && !isLegacyInProduction) {
			// eslint-disable-next-line max-len
			return gs.getMessage("Bundled model with lifecycle stage - 'Operational' and lifecycle stage status - 'In Use' can only be added as component");
		}
		return null;
	} if (!isLegacyInProduction) {
		return gs.getMessage("Bundled model with status - 'In Production' can only be added as component");
	}
	return null;
}
(function executeRule(current, previous /* null when async */) {
	var errorMsg;
	if (String(current.model_category.sys_id) === sn_hamp.HAMConstants.BUNDLE_CATEGORY_ID) {
		var childRef = current.child;
		if (String(childRef.bundle_assets) === 'false') {
			errorMsg = gs.getMessage('Bundled model cannot be added as a component to asset bundled model');
		} else {
			errorMsg = bundleModelErrorMessage(childRef);
		}
	}

	if (errorMsg) {
		gs.addErrorMessage(errorMsg);
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));