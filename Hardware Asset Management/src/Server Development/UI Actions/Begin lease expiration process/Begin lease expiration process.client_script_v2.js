function onClick(g_form) {
	var actionName = g_form.getActionName();
	function confirmAction() {
		g_form.submit(actionName);
	}
	
	var title = getMessage('Confirmation');
	var msg = getMessage('There are assets associated to this lease that are excluded from HAM features, Do you want to proceed with this flow?');
	var cancelLabel = getMessage('Cancel');
	var confirmLabel = getMessage('OK');

	// show confirmation popup if contract has excluded assets
	if (g_scratchpad.shouldShowLeasePopUp === true) {
		g_modal.confirm(
			title,
			msg,
			function (response) {
				if (response) {
					confirmAction();
				}
			},
			{
				cancelTitle: cancelLabel,
				confirmTitle: confirmLabel,
			}
		);
	} else {
		g_form.submit(actionName);
	}	
}