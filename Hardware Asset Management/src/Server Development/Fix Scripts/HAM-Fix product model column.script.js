function fixProductModelDict() {
	new global.GlideQuery('sys_dictionary')
		.where('name', 'sn_hamp_lifecycle_definition')
		.where('element', 'hw_product_model')
		.where('display', false)
		.updateMultiple({ display: true });
}
fixProductModelDict();
