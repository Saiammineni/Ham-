function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading) {
		return;
	}
	if (newValue === '') {
		if (g_form.getValue('normalized_model') !== '') { g_form.setValue('normalized_model', ''); }
		g_form.setValue('normalized_device_type', '');
	} else {
		var normModel = g_form.getValue('normalized_model');
		if (normModel !== '') {
			var ga1 = new GlideAjax('sn_hamp.HAMAjaxProcessor');
			ga1.addParam('sysparm_name', 'getRelatedReferencesForProductModel');
			ga1.addParam('sysparm_product_model_id', normModel);
			ga1.getXML(parseResponseModel);
		}
	}
	if (newValue !== '') {
		var ga = new GlideAjax('sn_hamp.HAMAjaxProcessor');
		ga.addParam('sysparm_name', 'getRelatedReferencesForProduct');
		ga.addParam('sysparm_product_id', newValue);
		ga.getXML(parseResponse);
	}

	function parseResponseModel(serverResponse) {
		var result = serverResponse.responseXML.getElementsByTagName('result');
		var hwProduct = result[0].getAttribute('hw_product');
		if (hwProduct !== newValue) { g_form.setValue('normalized_model', ''); }
	}

	function parseResponse(serverResponse) {
		var result = serverResponse.responseXML.getElementsByTagName('result');
		var devicetype = result[0].getAttribute('device_type');
		var company = result[0].getAttribute('company');
		g_form.setValue('normalized_device_type', devicetype);
		if (g_form.getValue('normalized_company') !== company) { g_form.setValue('normalized_company', company); }
	}
}