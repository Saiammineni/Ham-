(function refineQuery(current, parent) {
	current.addQuery('hardware_disposal', parent.sys_id);
	current.addQuery('stage', 'completed');
})(current, parent);