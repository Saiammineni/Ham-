(function executeRule(current, previous) {
	if (!new sn_hamp.HAMContractManagementUtils().checkEAMContract(current)) {
		var showLeasedAssets = new sn_hamp.HAMContractManagementUtils().isContractExpirationActivated(current);
		g_scratchpad.AssetsCoveredRelatedList = { isVisible: !showLeasedAssets };
	}
	var shouldShowPopUp = new HAMLicensingUtility().checkIfContractHasExcludedAssets(current);
	g_scratchpad.shouldShowLeasePopUp = shouldShowPopUp;
}(current, previous));