(function executeRule(current, previous) {
	new sn_hamp.HAMProcurementUtils().createPOLine(current.contract_asset, current);
}(current, previous));