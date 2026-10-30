function getMessageOnModelStatusCheck() {
	var isLegacyInProduction = (String(current.model.status) === sn_hamp.HAMConstants.MODEL_STATUSES.IN_PRODUCTION);
	if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
		// eslint-disable-next-line max-len
		var isLifeCycleOperational = (String(current.model.life_cycle_stage) === sn_hamp.HAMConstants.LIFECYCLE_STAGES.OPERATIONAL
        && String(current.model.life_cycle_stage_status) === sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.IN_USE);
		if (!isLifeCycleOperational && !isLegacyInProduction) {
			// eslint-disable-next-line max-len
			return gs.getMessage("Asset bundle can only be created from a Bundled model with lifecycle stage 'Operational' and lifecycle stage status 'In Use'");
		}
		return null;
	} if (!isLegacyInProduction) {
		return gs.getMessage("Asset bundle can only be created from a Bundled model with status 'In Production'");
	}
	return null;
}
var operation = current.operation();
var message;
if (operation === 'insert') {
	if (!gs.nil(current.model)) {
		message = getMessageOnModelStatusCheck();
	}
	if (current.getValue('install_status') !== sn_hamp.HAMConstants.ASSET_STATUSES.BUILD) {
		message = gs.getMessage("Bundle can only be created with status 'Build'");
	}
} else if (operation === 'update') {
	message = gs.getMessage('Asset status cannot be changed as not all assets are associated to bundle');
}
if (message) {
	gs.addErrorMessage(message);
	current.setAbortAction(true);
}