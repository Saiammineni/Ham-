function showMessage(response) {
	var optin = response.responseXML.documentElement.getAttribute('answer');
	if (optin === 'false') { // case where customer has not opted in the content services
		// eslint-disable-next-line max-len
		g_form.addInfoMessage(getMessage("Please <a href = '/sn_hamp_content_service_setup.do' target='_blank'>opt-in</a> to the ServiceNow Hardware Asset Management Content Service program to export files."));
	} else {
		// eslint-disable-next-line max-len
		g_form.addInfoMessage(getMessage('Select "Run Export". Once status is updated to "Ready for Download", refresh the page and download attached file.'));
	}
}
function onLoad() {
	// Based on content_type, display specific instructions
	var contentType = g_form.getValue('content_type');
	if (g_form.getValue('status') !== 'in_progress') {
		// Show error message
		if (g_form.getValue('status') === 'failed') {
			g_form.addErrorMessage(formatMessage(getMessage(
				'Failed to {0} the content. Please contact your system administrator for failure details.'
			), contentType));
		} else if (contentType === 'import') {
			// eslint-disable-next-line max-len
			g_form.addInfoMessage(getMessage("Select 'Attach Content File' to upload the Hardware Library Content '.zip' File. Then select 'Run Import'."));
		} else if (contentType === 'export') {
			// Check if customer has opted in to content service
			var ga = new GlideAjax('HAMAjaxProcessor');
			ga.addParam('sysparm_name', 'hasCustomerOptedIn');
			ga.getXML(showMessage); // async ajax call
		}
	}
	// Set Label
	g_form.setLabelOf('sys_updated_on', getMessage('Last updated'));
	// Hide fields
	if (g_form.getValue('status') === 'new') {
		g_form.setVisible('sys_updated_on', false);
	}
}