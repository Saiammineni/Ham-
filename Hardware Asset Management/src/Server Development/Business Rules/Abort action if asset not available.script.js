(function executeRule(current, previous /* null when async */) {
	gs.addErrorMessage(gs.getMessage('The selected loaner asset is not available. Please select another asset.'));
	current.setAbortAction(true);
}(current, previous));