(function executeRule(current, previous) {
	if (current.substate.toString() === 'expiring' && current.state.toString() !== 'active') {
		current.substate = '';
	}
}(current, previous));