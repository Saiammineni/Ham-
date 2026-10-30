function updateAuditFields(){
	var resourceCatDictionary = new GlideRecord('sys_dictionary');
	resourceCatDictionary.addQuery('name', 'sn_hamp_resource_category');
	resourceCatDictionary.addQuery('internal_type', 'collection');
	resourceCatDictionary.addQuery('audit', false);
	resourceCatDictionary.query();
	if (resourceCatDictionary.next()) {
		resourceCatDictionary.setValue('audit', true);
		global.ModelUtils.updateEnableBR(resourceCatDictionary);
		var columnsDict = new GlideRecord('sys_dictionary');
		columnsDict.addQuery('name', 'sn_hamp_resource_category');
		columnsDict.addQuery('element', 'IN', 'resource_category,schedule_item,su_ratio');
		columnsDict.query();
		while (columnsDict.next()) {
			var oldValue = columnsDict.getValue('attributes');
			if (gs.nil(oldValue)) {
				oldValue = '';
			} else {
				oldValue += ',';
			}
			var newValue = oldValue + 'no_audit=true';
			columnsDict.setValue('attributes', newValue);
			global.ModelUtils.updateEnableBR(columnsDict);
		}
	}
}
updateAuditFields();