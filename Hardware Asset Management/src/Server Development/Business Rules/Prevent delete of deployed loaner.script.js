(function executeRule(current, previous /* null when async */) {
	gs.addErrorMessage(gs.getMessage('Cannot delete loaner asset order when stage is Deployed'));
	current.setAbortAction(true);
}(current, previous));