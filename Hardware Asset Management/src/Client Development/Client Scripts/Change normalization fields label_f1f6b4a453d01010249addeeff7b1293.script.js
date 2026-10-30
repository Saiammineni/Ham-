function onLoad() {
	getMessage('Normalized manufacturer', function(label) {
		g_form.setLabelOf('normalized_company', label);
	});
	getMessage('Product', function(label) {
		g_form.setLabelOf('normalized_product', label);
	});
	getMessage('Model', function(label) {
		g_form.setLabelOf('normalized_model', label);
	});
	getMessage('Normalization status', function(label) {
		g_form.setLabelOf('normalized_status', label);
	});
	getMessage('Device type', function(label) {
		g_form.setLabelOf('normalized_device_type', label);
	});
}