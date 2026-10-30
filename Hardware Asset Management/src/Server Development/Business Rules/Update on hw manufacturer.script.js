(function executeRule(current, previous) {
	if (current.company.changes() && (!gs.nil(current.company)) && (!gs.nil(previous.company))) {
		var params = {};
		params.hwManufacturerSysId = current.getValue('sys_id');
		params.newCompany = current.getValue('company');
		params.oldCompany = previous.getValue('company');
		// hwnorm2hamp global.HAMManufacturerUpdateHandler.processCompanyChange(params);
		sn_hamp.HAMManufacturerUpdateHandler.processCompanyChange(params);
	}
}(current, previous));