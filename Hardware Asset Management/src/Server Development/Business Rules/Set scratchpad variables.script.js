(function executeRule(current, previous /*null when async*/) {
	g_scratchpad.new_custom_licensing_applicable = new sn_hamp.HAMLicensingUtility()._checkHAMSKUForLicensingChanges();
}(current, previous));