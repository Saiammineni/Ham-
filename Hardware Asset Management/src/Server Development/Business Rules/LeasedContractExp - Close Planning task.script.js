(function executeRule(current, previous) {
	current.state = 3;
	current.work_notes = gs.getMessage('Task closed due to selection of lease action in parent record');
	current.setWorkflow(false);
	current.update();
}(current, previous));