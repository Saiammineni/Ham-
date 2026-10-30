(function executeRule(current, previous) {
	if (!HAMUtils.isNotChildOfBundle(current)) {
		var message = gs.getMessage('Individual assets cannot be deleted from a bundled asset.');
		gs.addErrorMessage(message);
		global.ModelUtils.setAbortAction(current, true);
	}
}(current, previous));