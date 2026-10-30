if ('false' == cancelled) {
	sn_hamp.HAMUtils.updateOptInStatus(resourceCategory, optIn);
	response.sendRedirect('sn_hamp_resource_category.do?sys_id=' + resourceCategory);
}