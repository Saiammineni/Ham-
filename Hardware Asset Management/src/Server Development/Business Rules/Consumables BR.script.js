(function executeRule(current, previous /* null when async */) {
	g_scratchpad.consumable = false;
	g_scratchpad.quantity = 1;
	var quantity = current.asset_reclaim_line.asset.quantity.toString();
	var assetClassName = current.asset_reclaim_line.asset.sys_class_name.toString();
	if (assetClassName === 'alm_consumable') {
		g_scratchpad.consumable = true;
		g_scratchpad.quantity = quantity;
	}
}(current, previous));