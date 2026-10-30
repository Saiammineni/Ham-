(function executeRule(current, previous /* null when async */) {
	var hampHWDisposalUtils = new HampHWDisposalUtils();
	var output = hampHWDisposalUtils.checkTaskCompletion(current);
	if (output.abort) {
		gs.addErrorMessage(output.message);
		current.state = previous.state;
		gs.setRedirect(current.getLink(true));
	} else {
		gs.addInfoMessage(output.message);
		gs.setRedirect(current.hardware_disposal.getRefRecord().getLink(true));
	}
}(current, previous));