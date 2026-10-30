(function executeRule(current, previous) {
	if (current.name.changes() && (!gs.nil(current.name)) && (!gs.nil(previous.name))) {
		params = {};
		params.hwProductModelSysId = current.getValue('sys_id');
		params.newName = current.getValue('name');
		params.oldName = previous.getValue('name');
		params.companyDisplayValue = current.hw_product.hw_manufacturer.company.getDisplayValue();
		// hwnorm2hamp global.HAMProductModelUpdateHandler.processNameChange(params);
		sn_hamp.HAMProductModelUpdateHandler.processNameChange(params);
	}
}(current, previous));