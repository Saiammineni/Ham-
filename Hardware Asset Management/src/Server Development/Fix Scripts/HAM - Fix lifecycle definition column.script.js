function fixLifecycleDefinitionDict() {
	new global.GlideQuery('sys_dictionary')
		.where('element', 'content_lifecycle_definition')
    .where('name', 'IN', ['cmdb_hardware_model_lifecycle','cmdb_consumable_model_lifecycle'])
		.where('reference', 'sn_hamp_content_lifecycle_definition')
		.updateMultiple({ reference: 'sn_hamp_lifecycle_definition' });
}
fixLifecycleDefinitionDict();