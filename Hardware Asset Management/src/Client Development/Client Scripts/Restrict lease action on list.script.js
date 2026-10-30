function onCellEdit(sysIDs, table, oldValues, newValue, callback) { // eslint-disable-line
	var saveAndClose = true;
	// Allow change from list only when lease action is empty
	for (var i = 0; i < oldValues.length; i++) {
		if (oldValues[i] !== '') { saveAndClose = false; }
	}
	callback(saveAndClose);
}