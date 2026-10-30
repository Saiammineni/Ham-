var AssetDisposalUtils = Class.create();
AssetDisposalUtils.OPEN_STATE = 1;
AssetDisposalUtils.IN_PROGRESS_STATE = 2;
AssetDisposalUtils.CLOSED_COMPLETE_STATE = 3;
AssetDisposalUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

	updateAssetCount: function (current, stage) {
		var draftCount = 0;
		var verifiedCount = 0;
		var departedCount = 0;
		if (stage === 'verified') {
			new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
				.where('hardware_disposal', current.hardware_disposal)
				.aggregate('count')
				.groupBy('stage')
				.select()
				.forEach(function (record) {
					if (record.group.stage === 'draft') {
						draftCount = record.count;
					} else if (record.group.stage === 'verified') {
						verifiedCount = record.count;
					}
				});

			new global.GlideQuery('sn_hamp_hw_asset_disposal_task')
				.where('hardware_disposal', current.hardware_disposal)
				.where('task_name', 'verify')
				.updateMultiple({
					expected_assets: draftCount + verifiedCount,
					not_verified_assets: draftCount,
					verified_assets: verifiedCount,
				});
		} else if (stage === 'departed') {
			new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
				.where('hardware_disposal', current.hardware_disposal)
				.aggregate('count')
				.groupBy('stage')
				.select()
				.forEach(function (record) {
					if (record.group.stage === 'in_transit') {
						departedCount = record.count;
					} else if (record.group.stage === 'draft') {
						draftCount = record.count;
					} else if (record.group.stage === 'verified') {
						verifiedCount = record.count;
					}
				});

			new global.GlideQuery('sn_hamp_hw_asset_disposal_task')
				.where('hardware_disposal', current.hardware_disposal)
				.where('task_name', 'depart')
				.updateMultiple({
					expected_assets: draftCount + verifiedCount + departedCount,
					not_departed_assets: draftCount + verifiedCount,
					departed_assets: departedCount,
				});
		}
	},
	populateAssetCount: function (current, taskName) {
		var assetCount;
		if (taskName === 'depart') {
			assetCount = new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
				.where('hardware_disposal', current.getValue('hardware_disposal'))
				.where(new global.GlideQuery()
					.where('stage', 'draft')
					.orWhere('stage', 'verified'))
				.count();
			current.expected_assets = assetCount;
			current.not_departed_assets = assetCount;
			current.update();
		} else if (taskName === 'verify') {
			assetCount = new global.GlideQuery('sn_hamp_m2m_hw_asset_disposal')
				.where('hardware_disposal', current.getValue('hardware_disposal'))
				.where(new global.GlideQuery()
					.where('stage', 'draft'))
				.count();
			current.expected_assets = assetCount;
			current.not_verified_assets = assetCount;
			current.update();
		}
	},
	completeTask: function (sysId) {
		new global.GlideQuery('sn_hamp_hw_asset_disposal_task')
			.where('sys_id', sysId)
			.where(new global.GlideQuery()
				.where('state', AssetDisposalUtils.OPEN_STATE)
				.orWhere('state', AssetDisposalUtils.IN_PROGRESS_STATE))
			.updateMultiple({ state: AssetDisposalUtils.CLOSED_COMPLETE_STATE });
	},
	type: 'AssetDisposalUtils',
});