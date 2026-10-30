(function executeRule(current, previous /* null when async */) {
	if (current.isActionAborted()) { return; }
	var result = new sn_hamp.HAMRMAUtils().handleTaskCompletion(current);
	if (!result.checksPassed) {
		if (result.message) { gs.addErrorMessage(result.message); }
		current.state = previous.state;
		current.active = true;
		gs.setRedirect(current.getLink(true));
	} else {
		if (result.message) { gs.addInfoMessage(result.message); }
		if (gs.hasRole('inventory_user')) {
			gs.setRedirect(current.rma_request_line.getRefRecord().getLink(true));
		} else {
			gs.setRedirect(current.getLink(true));
		}
	}
}(current, previous));