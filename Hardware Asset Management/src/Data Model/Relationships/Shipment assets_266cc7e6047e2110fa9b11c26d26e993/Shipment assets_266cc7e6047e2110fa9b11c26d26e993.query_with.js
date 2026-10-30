(function refineQuery(current, parent) {
	current.addQuery('source_id',String(parent.asset_reclaim_line.sys_id));

})(current, parent);