(function refineQuery(current, parent) {
	current.addQuery('source_id',String(parent.rma_request_line.sys_id));

})(current, parent);