new global.GlideQuery('sys_dictionary')
	.where('name', 'sn_hamp_m2m_hw_asset_disposal')
	.where('element', 'hardware')
	.where('read_only', true)
	.updateMultiple({ read_only: false });