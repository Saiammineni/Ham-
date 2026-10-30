function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}

   // Auto populating the address fields from the user's location for ship
	
	if (newValue == 'ship') {
		var userId = g_user.userID;
		var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
		ga.addParam('sysparm_name', 'getUserAddressForShip');
		ga.addParam('sysparm_userId', userId);
		ga.getXMLAnswer(updateAddress);
	}

}

function updateAddress(answer) {
	var fieldsToBeSet = ['zip', 'country', 'state_loc', 'city', 'street', 'mobile', 'email', 'name'];
	var i;
	if (answer) {
		var returnedData = JSON.parse(answer);
		for (i = 0; i < fieldsToBeSet.length; i++) {
			var field = fieldsToBeSet[i];
			g_form.setValue(field, returnedData[field]);
		}

	} else {
		for (i = 0; i < fieldsToBeSet.length; i++) {
			g_form.setValue(fieldsToBeSet[i], '');
		}
	}

}