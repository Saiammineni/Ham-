function onLoad() {
	if (g_scratchpad.showLoanerAssetOrders === true) { return; }

	if (g_scratchpad.assetClass === 'alm_consumable') {
		g_form.hideRelatedList('REL:e6df971db7f220106b866d07ee11a955');
	} else {
		g_form.hideRelatedList('sn_hamp_loaner_asset_order.asset');
	}
}