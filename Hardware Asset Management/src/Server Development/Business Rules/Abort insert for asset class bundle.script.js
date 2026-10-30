(function executeRule(current, previous) {
	var gr = new GlideRecord(current.asset_class);
	if (global.ModelUtils.isAncestor(gr, 'alm_bundle') && current.getValue('cmdb_ci_class') !== null) {
		var message = gs.getMessage('Asset bundles can not be added to any CI class');
		gs.addErrorMessage(message);
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));