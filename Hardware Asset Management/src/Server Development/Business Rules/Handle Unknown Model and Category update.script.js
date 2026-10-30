var isModelCatUnknown = (current.getValue('model_category') === HAMConstants.UNKNOWN_MODEL_CATEGORY_SYS_ID);
var isModelUnknown = (current.getValue('model') === HAMConstants.UNKNOWN_MODEL_SYS_ID);
var errorMsg;
if (isModelCatUnknown) {
	// eslint-disable-next-line max-len
	errorMsg = gs.getMessage('Asset cannot be updated with Product Model Category of "Unknown Model Category". Please update model category to a different value');
	gs.addErrorMessage(errorMsg);
	global.ModelUtils.setAbortAction(current, true);
} else if (isModelUnknown) {
	// eslint-disable-next-line max-len
	errorMsg = gs.getMessage('Asset cannot be updated with Product Model of "Unknown Product Model". Please update model to a different value');
	gs.addErrorMessage(errorMsg);
	global.ModelUtils.setAbortAction(current, true);
}

if (!current.isActionAborted()) {
	try {
		if (global.AssetandCI.canCreateCIForAsset(current)) {
			new global.AssetandCI().createCI(current);
		}
	} catch (err) {
		gs.addErrorMessage(err);
		global.ModelUtils.setAbortAction(current, true);
	}
}