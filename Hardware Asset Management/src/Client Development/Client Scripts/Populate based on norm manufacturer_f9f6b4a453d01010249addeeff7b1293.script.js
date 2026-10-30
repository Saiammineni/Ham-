function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading) {
		return;
	}
	var companyId;
	if (newValue === '') {
		if (g_form.getValue('normalized_product') !== '') { g_form.setValue('normalized_product', ''); }
		if (g_form.getValue('normalized_model') !== '') { g_form.setValue('normalized_model', ''); }
		g_form.setValue('normalized_device_type', '');
	} else {
		var normProduct = g_form.getValue('normalized_product');
		if (normProduct !== '') {
			var ga = new GlideAjax('sn_hamp.HAMAjaxProcessor');
			ga.addParam('sysparm_name', 'getRelatedReferencesForProduct');
			ga.addParam('sysparm_product_id', normProduct);
			ga.getXML(parseResponse);
		}
	}

	function parseResponse(serverResponse) {
		var result = serverResponse.responseXML.getElementsByTagName('result');
		companyId = result[0].getAttribute('company');
		if (companyId !== newValue) {
			g_form.setValue('normalized_product', '');
			g_form.setValue('normalized_model', '');
			g_form.setValue('normalized_device_type', '');
		}
	}
}