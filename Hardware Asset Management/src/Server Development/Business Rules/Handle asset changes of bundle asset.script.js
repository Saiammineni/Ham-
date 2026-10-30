(function executeRule(current, previous /* null when async */) {
	function abortRemoveFromBundle() {
		gs.addErrorMessage(gs.getMessage(
			"Asset can be removed from bundle only for statuses 'Build' and 'Retire'"
		));
		global.ModelUtils.setAbortAction(current, true);
	}

	var isCurBundleAsset = !gs.nil(current.parent) && (String(current.parent.sys_class_name) === 'alm_bundle');

	var bundleUtils = new sn_hamp.HAMAssetBundleUtils();

	if (isCurBundleAsset) {
		var status = bundleUtils.canAddToBundle(current);

		if (!status.canAdd) {
			gs.addErrorMessage(status.errorMessage);
			global.ModelUtils.setAbortAction(current, true);
			return;
		}
	}

	var prevParent = previous.parent;
	var prevInstallStatus = String(prevParent.install_status);
	var prevSubStatus = String(prevParent.substatus);
	var isPrevBundleAsset = !gs.nil(prevParent) && (String(prevParent.sys_class_name) === 'alm_bundle');

	if (isPrevBundleAsset
        && !bundleUtils.isIncompleteBundleAllowedForStatus(prevInstallStatus, prevSubStatus)) {
		abortRemoveFromBundle();
		return;
	}

	// Set or unset asset_function
	var isAssetFunctionBundle = (String(current.asset_function) === sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE);

	if (isCurBundleAsset && !isAssetFunctionBundle) {
		gs.addInfoMessage(
			gs.getMessage("'Asset function' was set to 'Asset Bundle' as asset is child of bundle")
		);
		current.setValue('asset_function', sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE);
	}

	if (!isCurBundleAsset && isAssetFunctionBundle) {
		gs.addInfoMessage(
			gs.getMessage("'Asset function' was not set to 'Asset Bundle' as asset is not child of bundle")
		);
		current.setValue('asset_function', String(previous.asset_function));
	}
}(current, previous));