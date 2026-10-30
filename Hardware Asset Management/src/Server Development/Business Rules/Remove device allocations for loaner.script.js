(function executeRule(current, previous /* null when async */) {
	// If CI present, remove any device allocations
	var ciID = current.loaner_order.asset.ci;
	var displayName = current.loaner_order.asset.display_name;
	// eslint-disable-next-line max-len
	sn_hamp.HAMUtils.removeDeviceAllocAndUpdateWorknotes(ciID, displayName, 'sn_hamp_loaner_asset_order', current.loaner_order);
}(current, previous));