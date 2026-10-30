(function refineQuery(current, parent) {

	current.addQuery('asset_audit', parent.sys_id);
	current.addQuery('audit_status', 'excluded');

})(current, parent);