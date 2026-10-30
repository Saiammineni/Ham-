function onSubmit() {
	var rma_assets = g_form.getValue('rma_assets');
	if (!rma_assets || JSON.parse(rma_assets).length === 0) {
		g_form.addErrorMessage(getMessage('At least one asset needs to be added to place the order.'));
		return false;
	}
}