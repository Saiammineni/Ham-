(function refineQuery(current, parent) {
	var assets = new sn_hamp.HampLoanerUtils().getAllLoanerAssetsOfStockroom(parent);
	current.addQuery('sys_id', 'IN', assets);
})(current, parent);