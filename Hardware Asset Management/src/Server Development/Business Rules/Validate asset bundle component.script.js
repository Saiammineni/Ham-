(function executeRule(current, previous /* null when async */) {
	var operation = current.operation();
	var message;
	if (operation === 'insert') {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			// eslint-disable-next-line max-len
			message = gs.getMessage("A component can be added only when bundled model lifecycle stage is 'Design' and lifecycle stage status is 'Build'");
		} else {
			message = gs.getMessage("A component can be added only when bundled model status is 'Build'");
		}
	} else if (operation === 'update') {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			// eslint-disable-next-line max-len
			message = gs.getMessage("A component can be updated only when bundled model lifecycle stage is 'Design' and lifecycle stage status is 'Build'");
		} else {
			message = gs.getMessage("A component can be updated only when bundled model status is 'Build'");
		}
	} else if (operation === 'delete') {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			// eslint-disable-next-line max-len
			message = gs.getMessage("A component can be deleted only when bundled model lifecycle stage is 'Design' and lifecycle stage status is 'Build'");
		} else {
			message = gs.getMessage("A component can be deleted only when bundled model status is 'Build'");
		}
	}
	gs.addErrorMessage(message);

	global.ModelUtils.setAbortAction(current, true);
}(current, previous));