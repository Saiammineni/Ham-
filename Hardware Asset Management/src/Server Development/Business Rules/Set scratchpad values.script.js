(function executeRule(current, previous /*null when async*/) {
	g_scratchpad.is_trm_installed = GlidePluginManager.isActive('com.snc.apm_trm');
	if (g_scratchpad.is_trm_installed) {
		var lcGR = new GlideRecordSecure('sn_apm_trm_standards_product_lifecycle');
		g_scratchpad.can_read_trm_lifecycle = lcGR.canRead();
	}
  g_scratchpad.shouldHideNormalization = sn_hamp.HAMUtils.isZTMOnlyInstance();
}(current, previous));