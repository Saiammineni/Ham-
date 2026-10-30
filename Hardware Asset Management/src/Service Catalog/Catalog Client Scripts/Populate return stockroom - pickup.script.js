function onChange(control, oldValue, newValue, isLoading) {
   if (isLoading || newValue == '') {
      return;
   }

   if(g_form.getValue('refresh_method') == 'pickup'){
		var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
		ga.addParam('sysparm_name', 'getReturnStockroom');
		ga.addParam('sysparm_pickup_location', g_form.getValue('pickup_location'));
		ga.getXMLAnswer(getStockroomId);
   }
}

function getStockroomId(answer) {

	if (answer) {
		var returnedData = JSON.parse(answer);
		g_form.setValue('return_stockroom', returnedData.stockroomId);
	}
}