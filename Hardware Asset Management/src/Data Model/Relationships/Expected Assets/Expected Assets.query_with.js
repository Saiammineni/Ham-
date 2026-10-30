(function refineQuery(current, parent) {

	// Add your code here, such as current.addQuery(field, value);
	current.addQuery('asset_audit', parent.sys_id);
	current.addQuery('asset.model_category', '!=', '218323293743100044e0bfc8bcbe5d61');
	current.addEncodedQuery('audit_statusINexpected,not_found');

})(current, parent);