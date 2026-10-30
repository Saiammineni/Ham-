function onLoad() {
	var POL_ASSETS_RELATED_LIST = 'alm_asset.purchase_line';

	function hideAssetsOnPOL(po) {
		var poType = po.po_type;
		if (!(poType === 'lease_extension' || poType === 'lease_buyout' || poType === 'lease_settlement')) {
			return;
		}
		var status = po.status;
		if (status === 'requested' || status === 'ordered') {
			g_form.hideRelatedList(POL_ASSETS_RELATED_LIST);
		}
	}

	g_form.getReference('purchase_order', hideAssetsOnPOL);
}