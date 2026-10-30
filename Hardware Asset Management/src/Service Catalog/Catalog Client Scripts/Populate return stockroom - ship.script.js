function onChange(control, oldValue, newValue, isLoading) {
   if (isLoading || newValue == '') {
      return;
   }

   //Type appropriate comment here, and begin script below
	if(newValue == 'true' && g_form.getValue('refresh_method') == 'ship'){
		var ga = new GlideAjax('HAMZeroTouchAssetRefreshUtilsAJAX');
		ga.addParam('sysparm_name', 'getReturnStockroom');
		ga.addParam('sysparm_street', g_form.getValue('street'));
		ga.addParam('sysparm_city', g_form.getValue('city'));
		ga.addParam('sysparm_state', g_form.getValue('state_loc'));
		ga.addParam('sysparm_country', g_form.getValue('country'));
		ga.getXMLAnswer(getStockroomId);
	}
}

function getStockroomId(answer) {

	if (answer) {
		var returnedData = JSON.parse(answer);
		g_form.setValue('return_stockroom', returnedData.stockroomId);
	}
}