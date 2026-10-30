(function refineQuery(current, parent) {

	current.addQuery('hardware_disposal',parent.hardware_disposal);
	if (parent.task_name == 'documentation') {
		current.addQuery('stage', 'IN', ['pending_certificate','completed']);
	}


})(current, parent);