(function executeRule(current, previous /* null when async */) {
	current.state = previous.state;
	current.setAbortAction(true);
}(current, previous));