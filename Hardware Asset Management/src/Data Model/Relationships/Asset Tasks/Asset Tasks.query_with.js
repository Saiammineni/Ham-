(function refineQuery(current, parent) {
	// Add your code here, such as current.addQuery(field, value);
	var requestId = parent.getUniqueValue();    
	var refreshLineSysIds = new Array();

    var refreshLineGr = new GlideRecord(HAMAssetRefreshUtils.REFRESH_LINE_TABLE);
    refreshLineGr.addQuery('request_item.request', requestId);
    refreshLineGr.query();
    while (refreshLineGr.next()) {
        refreshLineSysIds.push(refreshLineGr.getValue('sys_id'));
    }

	var taskQuery = current.addQuery('parent.ref_sc_req_item.request', requestId);
	taskQuery.addOrCondition('asset_orderline', 'IN', refreshLineSysIds);
	taskQuery.addOrCondition('ref_sn_hamp_hw_refresh_line_task.refresh_line', 'IN', refreshLineSysIds);

})(current, parent);