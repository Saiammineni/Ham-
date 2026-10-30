function onChange(control, oldValue, newValue, isLoading) {
   if (isLoading || newValue == '') {
      return;
   }

   // Auto populating the address fields from the location selected for pickup

	var locationId = g_form.getValue('pickup_location');
	var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
	ga.addParam('sysparm_name', 'getLocationAddressForPickup');
	ga.addParam('sysparm_locationId', locationId);
	ga.getXMLAnswer(updateAddress);
}

function updateAddress(answer) {
	var fieldsToBeSet = ['zip', 'country', 'state_loc', 'city', 'street'];
	var i;
	if (answer) {
		var returnedData = JSON.parse(answer);
		for (i = 0; i < fieldsToBeSet.length; i++) {
			var field = fieldsToBeSet[i];
			g_form.setValue(field, returnedData[field]);
		}

	} else {
		for (i = 0; i < fieldsToBeSet.length; i++) {
			g_form.setReadOnly(fieldsToBeSet[i], '');
		}
	}
}