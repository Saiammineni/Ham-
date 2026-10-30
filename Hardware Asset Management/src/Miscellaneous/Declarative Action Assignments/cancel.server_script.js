if (current.getValue('stage') !== 'cancelled' && current.getValue('stage') !== 'already_disposed') {
	current.stage = 'cancelled';
	current.update();
}