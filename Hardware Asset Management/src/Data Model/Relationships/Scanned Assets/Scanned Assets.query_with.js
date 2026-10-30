(function refineQuery(current, parent) {

	// Add your code here, such as current.addQuery(field, value);
	current.addQuery('asset_audit', parent.sys_id);
	current.addQuery('scanned', true);
	current.addQuery('audit_status', '!=', 'excluded');

})(current, parent);