(function executeRule(current, previous /* null when async */) {
	// eslint-disable-next-line max-len
	gs.addErrorMessage(gs.getMessage('Returned on date is not valid. Task cannot be closed with returned date in future'));
	current.state = previous.state;
	gs.setRedirect(current.getLink(true));
}(current, previous));