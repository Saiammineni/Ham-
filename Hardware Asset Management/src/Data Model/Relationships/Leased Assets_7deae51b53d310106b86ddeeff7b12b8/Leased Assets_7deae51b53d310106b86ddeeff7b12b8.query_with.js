(function refineQuery(current, parent) {
	var assetIDs = new sn_hamp.HAMProcurementConditionUtils().getLeasedAssetsForPurchaseOrder(parent);
	if (assetIDs.length === 0) {
		current.addNullQuery('sys_id');
	} else {
		current.addQuery('sys_id', 'IN', assetIDs);
	}
})(current, parent);