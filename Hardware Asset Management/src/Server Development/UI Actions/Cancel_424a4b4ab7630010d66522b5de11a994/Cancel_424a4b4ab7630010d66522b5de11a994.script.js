function check () {
	g_form.setMandatory('pickup_contact', false);
	g_form.setMandatory('vendor_order_id', false);
	g_form.setMandatory('vendor', false);
	g_form.setMandatory('scheduled_date', false);
	gsftSubmit(null, g_form.getFormElement(), 'cancel_disposal');
}

function cancelDisposalOrder () {
	var hampHWDisposalUtils = new HampHWDisposalUtils();
	hampHWDisposalUtils.markActiveTaskClosedIncomplete(current);
	current.update();
	action.setRedirectURL(current);
}

if (typeof window === 'undefined') { cancelDisposalOrder(); }
