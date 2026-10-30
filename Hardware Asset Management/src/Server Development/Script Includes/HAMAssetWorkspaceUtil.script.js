var HAMAssetWorkspaceUtil = Class.create();
HAMAssetWorkspaceUtil.prototype = {
    initialize: function() {},

    getAssetEstateTabs: function() {
        var assetEstateTabs = {
            '': {
                listTitle: '',
                table: '',
                listView: '',
                query: '',
            },
            indoor_map: {
                listTitle: gs.getMessage('Indoor map'),
                table: 'alm_hardware',
                listView: 'itam_workspace',
                query: '',
            },
            alm_asset: {
                listTitle: gs.getMessage('All assets'),
                table: 'alm_asset',
                listView: 'itam_workspace',
                query: 'model.sys_class_nameNOT INjavascript: new sn_hamp.HAMReportFilters().getEnterpriseModelClassesToBeExcluded();',
            },
            alm_hardware: {
                listTitle: gs.getMessage('Hardware assets'),
                table: 'alm_hardware',
                listView: 'itam_workspace',
                query: '',
            },
            alm_consumable: {
                listTitle: gs.getMessage('Consumable assets'),
                table: 'alm_consumable',
                listView: 'itam_workspace',
                query: 'model.sys_class_nameNOT INjavascript: new sn_hamp.HAMReportFilters().getEnterpriseModelClassesToBeExcluded();',
            },
            alm_license: {
                listTitle: gs.getMessage('Software licenses'),
                table: 'alm_license',
                listView: 'itam_workspace',
                query: '',
            },
            alm_bundle: {
                listTitle: gs.getMessage('Bundle assets'),
                table: 'alm_bundle',
                listView: 'itam_workspace',
                query: '',
            },
            alm_pallet: {
                listTitle: gs.getMessage('Pallets'),
                table: 'alm_pallet',
                listView: '',
                query: '',
            },
            alm_asset_other: {
                listTitle: gs.getMessage('Other assets'),
                table: 'alm_asset',
                listView: 'itam_workspace',
                query: 'sys_class_name=alm_asset',
            },
            asset_task: {
                listTitle: gs.getMessage('Asset tasks'),
                table: 'asset_task',
                listView: '',
                query: '',
            },

        };

        // eslint-disable-next-line
        var isSamActive = sn_itam_workspace.AssetWorkspaceUtil.isSamActive();
        var data = [];
        var tabs = Object.keys(assetEstateTabs);
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i] === 'alm_license' && isSamActive) {
                continue;
            }
            //Below two plugins com.devsnc_sn_mp_component & sn_map_componet are same plugins 
            if (tabs[i] === 'indoor_map' &&
                (!GlidePluginManager.isActive('com.devsnc_sn_map_component') &&
                    !GlidePluginManager.isActive('sn_map_component') ||
                    sn_hamp.HAMUtils.getAssetProperty(sn_hamp.HAMConstants.HAMP_INDOOR_MAP_ASSET_PROPERTY) === 'false')) {
                continue;
            } else {
                data.push(assetEstateTabs[tabs[i]]);
            }
        }

        return data;
    },
	getModelManagementTabs: function() {
		var modelManagementTabs = [
			{
				listTitle: '',
				table: '',
				listView: '',
				query: '',
			}, {
				listTitle: gs.getMessage('All models'),
				table: 'cmdb_model',
				listView: 'itam_workspace',
				query: 'sys_class_nameNOT INjavascript: new sn_hamp.HAMReportFilters().getEnterpriseModelClassesToBeExcluded();',
			}, {
				listTitle: gs.getMessage('Hardware models'),
				table: 'cmdb_hardware_product_model',
				listView: 'itam_workspace',
				query: '',
			}, {
				listTitle: gs.getMessage('Consumable models'),
				table: 'cmdb_consumable_product_model',
				listView: 'itam_workspace',
				query: '',
			}, {
				listTitle: gs.getMessage('Bundled models'),
				table: 'cmdb_model',
				listView: 'itam_workspace',
				query: 'bundle=true',
			}, {
				listTitle: gs.getMessage('Contract models'),
				table: 'cmdb_contract_product_model',
				listView: 'itam_workspace',
				query: '',
			}, {
				listTitle: gs.getMessage('Software models'),
				table: 'cmdb_software_product_model',
				listView: '',
				query: '',
			},
		];
		if (HAMUtils.isEAMDataModelInstalled()) {
			modelManagementTabs[4].query = modelManagementTabs[4].query+'^sys_class_nameNOT INjavascript: new sn_hamp.HAMReportFilters().getEnterpriseModelClassesToBeExcluded();^ORsys_idINjavascript: new sn_hamp.HAMReportFilters().getEAMBundlesWithHardwareComponentsFilter();';
		}
		return modelManagementTabs;
	},

	getInventoryTabs: function() {
        //titles , tables array used to populate params for the tabs.
        //If any of the tab does not need params currently inserting empty string in both arrays
		
        var titles = ['', gs.getMessage('All stockrooms'), gs.getMessage('Asset audits'), gs.getMessage('Disposal orders'), gs.getMessage('Loaner asset orders'), gs.getMessage('RMA orders'), gs.getMessage('RMA line items'), gs.getMessage('Transfer orders'), gs.getMessage('Donation orders'), gs.getMessage('Repair orders'), gs.getMessage('Asset attestations')];
        var tables = ['', 'alm_stockroom', 'sn_hamp_asset_audit', 'sn_hamp_hardware_disposal', 'sn_hamp_loaner_asset_order', 'sn_hamp_rma_request', 'sn_hamp_rma_request_line', 'alm_transfer_order', 'sn_itam_common_donation_order','sn_itam_common_repair_order', 'sn_itam_common_asset_attestation'];
		
        var data = [];
        var params = {};
		
        for (var i = 0; i < titles.length; i++) {
            params = {};
            params['listTitle'] = titles[i];
            params['table'] = tables[i];
            params['listView'] = '';
            params['query'] = '';
            data.push(params);
        }

        return data;
    },
	
    type: 'HAMAssetWorkspaceUtil',
};