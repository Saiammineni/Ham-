(function executeRule(current, previous) {
	g_scratchpad.assetClass = current.getValue('sys_class_name');

	if (!gs.nil(current.lease_contract)) {
		g_scratchpad.isLeaseContractPresent = true;
		g_scratchpad.isLeaseContractAsset = new sn_hamp.HAMContractManagementUtils().leaseContractHasAsset(
			current.lease_contract,
			current
		);
	}
	g_scratchpad.showLoanerAssetOrders = new sn_hamp.HampLoanerUtils().showLoanerAssetOrdersListOnAsset(current);
	g_scratchpad.isHAMActive = true;
	g_scratchpad.unknownModelCategorySysId = sn_hamp.HAMConstants.UNKNOWN_MODEL_CATEGORY_SYS_ID;
	var isAssetExcluded = sn_hamp.HAMLicensingUtility.isAssetExcludedFromHAMFlows(current);
	var shouldDisplayExclusionFlag = new sn_hamp.HAMLicensingUtility().shouldShowExclusionField(current);
	var exclusionMessage = '';
	if (isAssetExcluded) {
		exclusionMessage = sn_hamp.HAMLicensingUtility.getExcludedAssetDisplayMessage();
	}
	g_scratchpad.assetExclusion = {
		excluded_from_ham: isAssetExcluded,
		message: exclusionMessage,
		show_exclusion_field: shouldDisplayExclusionFlag
	};
}(current, previous));