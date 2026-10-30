(function executeRule(current, previous /* null when async */) {
	var stageToState = {
		'new': 0, // eslint-disable-line quote-props
		prepare: 1,
		deployed: 2,
		completed: 3,
		cancelled: 4,
	};
	current.state = stageToState[current.stage];
}(current, previous));