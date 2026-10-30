function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}
	var ga = new GlideAjax('sn_hamp.HAMAjaxProcessor');
	ga.addParam('sysparm_name', 'getRelatedReferencesForProductModel');
	ga.addParam('sysparm_product_model_id', newValue);
	ga.getXML(parseResponse);

	function parseResponse(serverResponse) {
		var result = serverResponse.responseXML.getElementsByTagName('result');
		var hwProduct = result[0].getAttribute('hw_product');
		var company = result[0].getAttribute('company');

		if (g_form.getValue('normalized_product') !== hwProduct) { g_form.setValue('normalized_product', hwProduct); }
		if (g_form.getValue('normalized_company') !== company) { g_form.setValue('normalized_company', company); }
	}
}