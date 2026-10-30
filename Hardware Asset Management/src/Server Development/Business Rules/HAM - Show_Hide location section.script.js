(function executeRule(current, previous) {

	if((sn_hamp.HAMUtils.showAssetOnMap && sn_hamp.HAMUtils.showAssetOnMap(current.sys_id.toString()))
		|| global.ModelUtils.isAncestor(current, 'alm_pallet')
		|| global.ModelUtils.isAncestor(current, 'alm_bundle')) {
		g_scratchpad.showLocationSection = true;
	}

})(current, previous);