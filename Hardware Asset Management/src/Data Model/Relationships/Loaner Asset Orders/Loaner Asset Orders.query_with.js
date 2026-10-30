(function refineQuery(current, parent) {
	var processTable = parent.getValue('process_table');
	var assetFuction = parent.getValue('asset_function');
	var installStatus = parent.getValue('install_status');

	if (assetFuction === HAMConstants.ASSET_FUNCTION.LOANER &&
		processTable === HampLoanerUtils.LOANER_ORDER_TABLE &&
		!gs.nil(parent.getValue('process_id'))) {
		current.addQuery('sys_id', parent.getValue('process_id'));
		return;
	}

	if (installStatus === HAMConstants.ASSET_STATUSES.IN_STOCK &&
		!gs.nil(parent.getValue('stockroom')) &&
		!gs.nil(parent.getValue('model'))) {
		current.addQuery('model', parent.getValue('model'));
		current.addQuery('asset_stockroom', parent.getValue('stockroom'));
		return;
	}

	current.addNullQuery('sys_id');
}(current, parent));