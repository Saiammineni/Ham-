var HAMUtils = Class.create();
HAMUtils.prototype = {
    initialize: function() {},
    productFilter: function(companySysId) {
        companySysId = GlideStringUtil.escapeQueryTermSeparator(companySysId);
        var filter = 'active=true';
        if (companySysId) {
            filter += '^hw_manufacturer.company=' + companySysId;
        }
        return filter;
    },
    productModelFilter: function(companySysId, productSysId) {
        var filter = 'active=true';
        if (productSysId) {
            productSysId = GlideStringUtil.escapeQueryTermSeparator(productSysId);
            filter += '^hw_product.sys_id=' + productSysId;
        } else if (companySysId) {
            companySysId = GlideStringUtil.escapeQueryTermSeparator(companySysId);
            filter += '^hw_product.hw_manufacturer.company=' + companySysId;
        }
        return filter;
    },
    isJobRunning: function(jobSysId) {
        var sysTriggerGr = new GlideRecord('sys_trigger');
        sysTriggerGr.addQuery('job_context', 'CONTAINS', jobSysId);
        sysTriggerGr.addQuery('state', '1');
        sysTriggerGr.setLimit(2);
        sysTriggerGr.query();
        if (sysTriggerGr.getRowCount() >= 2) {
            return true;
        }
        return false;
    },
    type: 'HAMUtils',
};
HAMUtils.ALM_ASSET_TABLE = 'alm_asset';
HAMUtils.calculateModelDisplayName = function(model) {
    var values;
    var normalized_status = model.normalized_status.toString();
    if (normalized_status === sn_hamp.HAMConstants.NORM_STATUSES.NORMALIZED || (normalized_status === sn_hamp.HAMConstants.NORM_STATUSES.MANUALLY_NORMALIZED && (!gs.nil(model.normalized_model)))) {
        values = [model.normalized_company.getDisplayValue(), model.normalized_model.name];
        model.display_name = global.ModelUtils.generateDisplayName(values);
    } else {
        global.ModelUtils.calculateDefaultDisplayName(model);
    }
};
HAMUtils.areCSDMFieldsChanged = function(record) {
    return record.life_cycle_stage.changes() || record.life_cycle_stage_status.changes();
};
// Returns days as integer, if empty returns '-'
HAMUtils.getNextCDSPullDays = function() {
    var clientSchedule = HAMUtils._getClientScheduleGr();
    if (!gs.nil(clientSchedule)) {
        var tableRefreshDate;
        var nextRefreshDate;
        var nextAction;
        while (clientSchedule.next()) {
            nextAction = HAMUtils.getNextAction(clientSchedule.getValue('sys_id'));
            if (gs.nil(nextAction)) {
                return '-';
            }
            tableRefreshDate = new GlideDateTime(nextAction);
            if (!nextRefreshDate || nextRefreshDate.compareTo(tableRefreshDate) === -1) {
                nextRefreshDate = tableRefreshDate;
            }
        }
        return HAMUtils.getDaysDifference(new GlideDateTime(), nextRefreshDate);
    } else {
        return '-';
    }
};
// Returns days as integer, if empty returns '-'
HAMUtils.getLastCDSPullDays = function() {
    var latestPullDate;
    var clientSchedule = new GlideRecord('cds_client_schedule');
    if (clientSchedule.isValid()) {
        clientSchedule.addQuery('table.table', 'IN', sn_hamp.HAMConstants.CONTENT_TABLES['HW_NORMALIZATION_MAP']);
        clientSchedule.query();
        while (clientSchedule.next()) {
            if (!clientSchedule.getValue('last_updated_on')) {
                latestPullDate = null;
                return '-';
            }
            if (!latestPullDate) {
                latestPullDate = clientSchedule.getValue('last_updated_on');
            }
        }
        return HAMUtils.getDaysDifference(new GlideDateTime(latestPullDate), new GlideDateTime());
    } else {
        return '-';
    }
};
HAMUtils._getClientScheduleGr = function() {
    var contentTables = Object.keys(sn_hamp.HAMConstants.CONTENT_TABLES).map(function(key) {
        return sn_hamp.HAMConstants.CONTENT_TABLES[key];
    });
    var clientSchedule = new GlideRecord('cds_client_schedule');
    if (clientSchedule.isValid()) {
        clientSchedule.addQuery('table.table', 'IN', contentTables);
        clientSchedule.orderBy('last_updated_on');
        clientSchedule.query();
        return clientSchedule;
    } else {
        return null;
    }
};
HAMUtils.getNextAction = function(sys_id) {
    var sysTriggerTable = new GlideRecord('sys_trigger');
    sysTriggerTable.addQuery('job_context', 'CONTAINS', sys_id);
    sysTriggerTable.query();
    var nextPull = '';
    if (sysTriggerTable.next()) {
        nextPull = sysTriggerTable.next_action;
    }
    return nextPull;
};
HAMUtils.getDaysDifference = function(gdt1, gdt2) {
    return GlideDateTime.subtract(gdt1, gdt2).getDayPart();
};
HAMUtils.triggerFlowAsyncronously = function(flowName, inputs) {
    var flowContextID;
    try {
        flowContextID = sn_fd.FlowAPI.startFlow(flowName, inputs);
    } catch (ex) {
        var message = ex.getMessage();
        gs.error(flowName + ': ' + message);
    }
    return flowContextID;
};
//Bundled asset methods
HAMUtils.isParentBundledModelReadonly = function(component) {
    var model = component.parent;

    if (gs.nil(model)) {
        return false;
    }

    return sn_hamp.HAMUtils.isBundledModelReadonly(model);
};
HAMUtils.isNewBundledModel = function(model) {
    return model.getValue('bundle_assets') === '1';
};
HAMUtils.isAssetExistForModel = function(model) {
    return new global.GlideQuery('alm_asset')
        .where('model', model.getUniqueValue())
        .selectOne()
        .isPresent();
};
HAMUtils.isBundledModelReadonly = function(model) {
    if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
        return (String(model.bundle_assets) === 'true' &&
            String(model.life_cycle_stage) !== sn_hamp.HAMConstants.LIFECYCLE_STAGES.DESIGN &&
            String(model.life_cycle_stage_status) !== sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.BUILD);
    } else {
        return (String(model.bundle_assets) === 'true' &&
            String(model.status) !== sn_hamp.HAMConstants.MODEL_STATUSES.BUILD);
    }
};
HAMUtils.isNotChildOfBundle = function(current) {
    if (current.parent.toString() !== '') {
        var tableName = current.parent.sys_class_name.toString();
        if (tableName !== '') {
            var gr = new GlideRecord(tableName);
            if (global.ModelUtils.isAncestor(gr, 'alm_bundle')) {
                return false;
            }
        }
    }
    return true;
};
HAMUtils.allowAssetDelete = function(current) {
    var tableName = current.sys_class_name.toString();
    if (tableName === 'alm_bundle' && HAMUtils.isAssetPresent(current.getUniqueValue())) {
        return false;
    }
    return HAMUtils.isNotChildOfBundle(current);
};
HAMUtils.releaseAsset = function(assetGr) {
        var parent = assetGr.parent;

        if (!gs.nil(parent)) {
            HAMUtils.releaseAssets(parent, [assetGr.getUniqueValue()]);
        }
    },
    HAMUtils.releaseAssets = function(bundledAsset, assetIds, updateParams, disableWorkflow) {
        if (!gs.nil(bundledAsset)) {
            var query = new global.GlideQuery('alm_asset')
                .where('parent', bundledAsset);

            if (!gs.nil(assetIds)) {
                query = query.where('sys_id', 'IN', assetIds);
            }

            var updateHash = {
                parent: null,
                model_component_id: null,
                asset_function: null,
                install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
                substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
            };

            if (updateParams) {
                Object.keys(updateParams).forEach(function(col) {
                    updateHash[col] = updateParams[col];
                });
            }

            if (disableWorkflow) {
                query = query.disableWorkflow();
            }

            query.updateMultiple(updateHash);
        }
    };
HAMUtils.isAssetPresent = function(bundledAsset) {
    if (!gs.nil(bundledAsset)) {
        var asset = false;
        asset = new global.GlideQuery('alm_asset')
            .where('parent', bundledAsset)
            .selectOne()
            .isPresent();
        return asset;
    }
    return false;
};
// Function deprecated. Please use ITAMCommonUtil.addAssetFunctionQuery instead
HAMUtils.addAssetFunctionQuery = function(gr, feature) {
    var loanerFeatures = [];
    loanerFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.COMMON);
    loanerFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.SOURCING);
    loanerFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.STOCK_RULE);
    var bundleFeatures = [];
    bundleFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.COMMON);
    bundleFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.SOURCING);
    bundleFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.TO_FORM);
    bundleFeatures.push(global.AssetUtils.ASSET_FUNCTION_FEATURE.STOCK_RULE);

    // Loaner assets shouldn't be considered as regular assets
    // Licenses are not considered as loaner assets.
    if (loanerFeatures.indexOf(feature) !== -1) {
        gr.addNullQuery('asset_function')
            .addOrCondition('asset_function', '!=', sn_hamp.HAMConstants.ASSET_FUNCTION.LOANER)
            .addOrCondition('sys_class_name', 'alm_license');
    }
    // Bundle component assets shouldn't be considered as regular assets
    // Licenses are not considered as bundle component assets.
    if (bundleFeatures.indexOf(feature) !== -1) {
        gr.addNullQuery('asset_function')
            .addOrCondition('asset_function', '!=', sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE)
            .addOrCondition('sys_class_name', 'alm_license');
    }
};
HAMUtils.assetModelRefQual = function(asset, refQual, processedData) {
    // Bundle assets should be created using new bundle models whose status is 'In Production'
    if (processedData.assetClass.toString() === sn_hamp.HAMConstants.BUNDLE_ASSET_TABLE) {
        refQual = processedData.categoryClause + '^' + sn_hamp.HAMConstants.BUNDLE_ASSETS_COLUMN + '=true';
        if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
            refQual = refQual + '^life_cycle_stage.name=' + sn_hamp.HAMConstants.LIFECYCLE_STAGES.OPERATIONAL +
                '^life_cycle_stage_status.name=' + sn_hamp.HAMConstants.LIFECYCLE_STAGE_STATUSES.IN_USE;
        } else {
            refQual = refQual + '^status=' + sn_hamp.HAMConstants.MODEL_STATUSES.IN_PRODUCTION;
        }
    }
    return refQual;
};
HAMUtils.isParentFieldEditable = function(assetGr) {
    return assetGr.parent.sys_class_name.toString() === sn_hamp.HAMConstants.BUNDLE_ASSET_TABLE;
};
HAMUtils.removeDeviceAllocAndUpdateWorknotes = function(ciID, assetDisplayName, table, sysId) {
    var deviceAllocations;
    if (!gs.nil(ciID)) {
        deviceAllocations = new global.GlideQuery('alm_entitlement_asset')
            .where('allocated_to', ciID)
            .selectOne('sys_id')
            .orElse(null);
    }
    if (!gs.nil(deviceAllocations)) {
        new AssetAutomationAPI().removeDeviceAlloc(ciID);
        var tableGr = new global.GlideQuery(table)
            .where('sys_id', sysId)
            .toGlideRecord();
        tableGr.query();
        tableGr.next();
        // eslint-disable-next-line max-len
        tableGr.work_notes = gs.getMessage('Device allocations for asset {0} are removed', [assetDisplayName]);
        tableGr.update();
    }
};
HAMUtils.isComponentOfBudledModel = function(bundledModel) {
    return new global.GlideQuery('cmdb_m2m_model_component')
        .where('child', bundledModel.getValue('sys_id'))
        .selectOne('sys_id')
        .isPresent();
};
// Consumable methods
HAMUtils.canMarkForDisposal = function(asset) {
    return HAMUtils._getUIActionDisplayStatus(asset);
};
HAMUtils.canConsume = function(asset) {
    return HAMUtils._getUIActionDisplayStatus(asset);
};
HAMUtils.canRetire = function(asset) {
    return HAMUtils._getUIActionDisplayStatus(asset);
};
HAMUtils.canCancelFromDisposal = function(asset) {
    return HAMUtils._getUIActionDisplayStatus(asset);
};
// Internal method to know if UI actions can be shown for an asset under bundle.	
HAMUtils._getUIActionDisplayStatus = function(asset) {
    if (!HAMUtils.isNotChildOfBundle(asset)) {
        // implies asset is child of a bundle.	
        return {
            answer: false,
            continueProcessing: false
        };
    } else {
        return {
            answer: true,
            continueProcessing: true
        };
    }
};
HAMUtils.canSplit = function(consumable) {
    var bundleValidation = HAMUtils._getUIActionDisplayStatus(consumable);
    if (!bundleValidation.continueProcessing || consumable.planned_for_disposal || !gs.nil(consumable.process_id)) {
        return {
            answer: false,
            continueProcessing: false
        };
    }
    return {
        answer: true,
        continueProcessing: true
    };
};
HAMUtils.getFlowFromDecisionTable = function(decisionID, decisionInputs, defaultFlow) {
    var flow = defaultFlow;
    // eslint-disable-next-line no-undef
    var dtAPI = new sn_dt.DecisionTableAPI();
    try {
        var response = dtAPI.getDecision(decisionID, decisionInputs);
        if (gs.nil(response)) {
            flow = '';
        } else {
            flow = response.sys_scope.scope + '.' + response.internal_name;
        }
    } catch (err) {
        gs.error(err);
    }
    return flow;
};
HAMUtils.cancelFlowWithContextId = function(flowContextId, reason) {
    sn_fd.FlowAPI.cancel(flowContextId, reason);
};
HAMUtils.cancelFlow = function(sourceRecordSysId, reason) {
    new global.GlideQuery('sys_flow_context')
        .where('source_record', sourceRecordSysId)
        .select('sys_id')
        .forEach(function(flowContext) {
            // eslint-disable-next-line new-cap
            sn_fd.FlowAPI.cancel(flowContext.sys_id, reason);
        });
};
HAMUtils.compareDates = function(date1, date2) {
    date1 = new GlideDateTime(date1);
    date2 = new GlideDateTime(date2);
    var diff = GlideDate.subtract(date1, date2);
    diff = diff.getNumericValue();
    if (diff > 0) {
        return '>';
    } // If date2 > date1
    if (diff < 0) {
        return '<';
    } // If date2 < date1
    if (diff === 0) {
        return '=';
    } // If date2 == date1
    return null;
};
HAMUtils.getAsGlideRecord = function(table, recordID) {
    var gr = new global.GlideQuery(table)
        .where('sys_id', recordID)
        .toGlideRecord();
    gr.query();
    gr.next();
    return (gr.isValidRecord() ? gr : null);
};
HAMUtils.consumableMergeFieldCheck = function(consumableGr, baseCheck) {
    var canMerge = false;
    var orFields = ['process_table', 'process_id', ];
    if (baseCheck) {
        canMerge = true;
    } else {
        canMerge = orFields.some(function(field) {
            return consumableGr[field].changes();
        });
    }
    return canMerge;
};
HAMUtils.consumableMergeConditionCheck = function(consumableGr, baseCheck) {
    var canMerge = baseCheck;
    canMerge = canMerge && HAMRMAUtils.mergeConditionCheck(consumableGr);
    canMerge = canMerge && HampLoanerUtils.consumableMergeConditionCheck(consumableGr);
    canMerge = canMerge && HAMUtils.reclamationMergeConditionCheck(consumableGr);
    return canMerge;
};
HAMUtils.reclamationMergeConditionCheck = function (consumableGr) {
    var canMerge = true;
    if (consumableGr.getValue('process_table') === sn_hamp.HAMConstants.HARDWARE_RECLAIM_LINE
    && !gs.nil(consumableGr.getValue('process_id'))) {
        canMerge = false;
    }
	return canMerge;
};
HAMUtils.getDepreciationExcClasses = function() {
    var hamExcludedclasses = [];
    return hamExcludedclasses;
};

HAMUtils.getMandatoryFieldsMessage = function(mandatoryFields) {
    return gs.getMessage('The following mandatory fields are not filled in: {0}', mandatoryFields.join(', '));
};

HAMUtils.checkIfFieldsEmptyInRecord = function(glideRecord, fields, missingFields) {
    if (fields && fields.length > 0) {
        fields.forEach(function(field) {
            if (gs.nil(glideRecord[field])) {
                missingFields.push(glideRecord[field].getLabel());
            }
        });
    }
    if (missingFields.length > 0) {
        return true;
    }
};

HAMUtils.isConsumablesSupportedByProcess = function() {
    if (global.Consumables.shouldMergeConsumable) {
        return true;
    }
    return false;
};
// API to get License opt in status of a model category
HAMUtils.getLicenseOptinStatus = function(modelCategory) {
    if (gs.nil(modelCategory) || gs.nil(modelCategory.resource_category)) {
        return 'NA';
    }
    if (modelCategory.resource_category.opt_in) {
        return 'Y';
    } else {
        return 'N';
    }
};
// API returns the License opt in status processing the model category list - modelGr is an optional param
HAMUtils.getLicenseOptinStatusForModelCategoryList = function(modelCategoryList, modelGr) {
    if (gs.nil(modelCategoryList)) {
        return 'NA';
    }
	// Check if model is an OTAM model and to be normalised
	if (!gs.nil(modelGr) && sn_itam_common.OTAMCommonUtils.isModelEligibleForHAMNormalization(modelGr)) {
		return 'Y';
	}
    var modelCategoryArray = modelCategoryList.split(',');

    //If No TNI app/entitlement, TNI models to be marked as 'N'
    if (!gs.nil(modelGr) && sn_hamp.HAMTNIUtils.hasNoEntitlementForTNIModels(modelGr)) {
        return 'N';
    }

    // get the opt in status of model category if there is only one model category
    if (modelCategoryArray.length <= 1) {
        var modelCategoryGR = new GlideRecord(sn_hamp.HAMConstants.MODEL_CATEGORY_TABLE);
        if (modelCategoryGR.get(modelCategoryArray[0])) {
            return HAMUtils.getLicenseOptinStatus(modelCategoryGR);
        }
    }

    var gq = new global.GlideQuery(sn_hamp.HAMConstants.MODEL_CATEGORY_TABLE);
    // Do not change the order of checks: Opt in, NA, Opt out
    // check if list contains atleast one opted in model category
    var listHasOptedinModelCategory = gq.where('resource_category.opt_in', true)
        .where('sys_id', 'IN', modelCategoryArray)
        .selectOne()
        .isPresent();
    if (listHasOptedinModelCategory) {
        return 'Y';
    }
    // check if list contains atleast one model category which doesn't have resource category
    var listHasModelCategoryWithoutResourceCategory = gq.whereNull('resource_category')
        .where('sys_id', 'IN', modelCategoryArray)
        .selectOne()
        .isPresent();
    if (listHasModelCategoryWithoutResourceCategory) {
        return 'NA';
    }
    // check if list contains only opted out model categories
    var listHasOptedoutModelCategories = gq.where('resource_category.opt_in', false)
        .where('sys_id', 'IN', modelCategoryArray)
        .selectOne()
        .isPresent();
    if (listHasOptedoutModelCategories) {
        return 'N';
    }
    // return default value 'NA'
    return 'NA';
};

// updates models with empty license opt in appropriately
HAMUtils.updateEmptyLicenceOptInModels = function(modelTable) {
	var modelGr = new GlideRecord(modelTable);
	modelGr.addNullQuery('norm_license_opt_in');
	modelGr.query();
	while (modelGr.next()) {
		var licenseOptIn = HAMUtils.getLicenseOptinStatusForModelCategoryList(modelGr.cmdb_model_category, modelGr);
        if (!gs.nil(licenseOptIn)) {
			modelGr.norm_license_opt_in = licenseOptIn;
			modelGr.update();
		}
	}
};

// returns encoded query to check if model category on model contains atleast one of model categories of a resource category
HAMUtils.getContainsOneOfModelCategoryEncodedQuery = function(resourceCategory) {
    return new global.GlideQuery(sn_hamp.HAMConstants.MODEL_CATEGORY_TABLE)
        .where('resource_category', resourceCategory)
        .select('sys_id')
        .reduce(function(encodedQuery, modelCategory) {
            return (encodedQuery === '' ? (encodedQuery + 'cmdb_model_categoryLIKE' + modelCategory.sys_id) :
                (encodedQuery + '^OR' + 'cmdb_model_categoryLIKE' + modelCategory.sys_id));
        }, '');
};

HAMUtils.scheduleNormalizationJob = function() {
    var jobId = sn_hamp.HAMConstants.NormalizationDailyJob;
    var gr = new GlideRecord('sysauto_script');
    if (gr.get(jobId)) {
        gs.executeNow(gr);
    }
};

// updates License opt in to Yes on models which has model categories of opted in resource category
HAMUtils.updateLicenseOptInOnResCatOptIn = function(modelTable, resourceCategory) {
    var mth = HAMUtils.getModelTableHierarchy();
    if (mth.indexOf(modelTable) !== -1) {
        var encodedQuery = HAMUtils.getContainsOneOfModelCategoryEncodedQuery(resourceCategory);

        // query the base tables as any model class can be programatically be ased as an asset
        var modelTableGr = new GlideRecord('cmdb_model');
        modelTableGr.addEncodedQuery(encodedQuery);
        modelTableGr.query();
        if (modelTableGr.hasNext()) {
            // mark the assets as included for each of the model 
            while (modelTableGr.next()) {
                sn_hamp.HAMUtils.markAssetsForHAMFlows(resourceCategory, 'Y', encodedQuery, modelTableGr.getValue('sys_id'));
            }
            // If model has norm_license_opt_in then value is set as Y
            modelTableGr = new GlideRecord(modelTable);
            var normLicenseFieldExists = modelTableGr.isValid() && modelTableGr.isValidField('norm_license_opt_in');
            if (normLicenseFieldExists) {
                modelTableGr.addEncodedQuery(encodedQuery);
                modelTableGr.query();
                while (modelTableGr.next()) {
                    modelTableGr.norm_license_opt_in = 'Y';
                    var update = global.ModelUtils.updateDisableBR(modelTableGr);
                }
                sn_hamp.HAMUtils.scheduleNormalizationJob();
            }

        }
    }
};

// updates License opt in on models which has model categories of opted out resource category
HAMUtils.updateLicenseOptInOnResCatOptOut = function(modelTable, resourceCategory) {
    var mth = HAMUtils.getModelTableHierarchy();
    if (mth.indexOf(modelTable) !== -1) {
        var encodedQuery = HAMUtils.getContainsOneOfModelCategoryEncodedQuery(resourceCategory);

        // query the base tables as any model class can be programatically be ased as an asset
        var modelTableGr = new GlideRecord('cmdb_model');
        modelTableGr.addEncodedQuery(encodedQuery);
        modelTableGr.query();
        if (modelTableGr.hasNext()) {
            // mark the assets as excluded for each of the model 
            while (modelTableGr.next()) {
                sn_hamp.HAMUtils.markAssetsForHAMFlows(resourceCategory, 'N', encodedQuery, modelTableGr.getValue('sys_id'));
            }
            // If model has norm_license_opt_in then value is set as N
            modelTableGr = new GlideRecord(modelTable);
            var normLicenseFieldExists = modelTableGr.isValid() && modelTableGr.isValidField('norm_license_opt_in');
            if (normLicenseFieldExists) {
                modelTableGr.addEncodedQuery(encodedQuery);
                modelTableGr.query();
                var licenseOptIn;
                while (modelTableGr.next()) {
                    licenseOptIn = HAMUtils.getLicenseOptinStatusForModelCategoryList(modelTableGr.getValue('cmdb_model_category'), modelTableGr);
                    if (modelTableGr.getValue('norm_license_opt_in') !== licenseOptIn) {
                        modelTableGr.setValue('norm_license_opt_in', licenseOptIn);
                        modelTableGr.update();
                    }
                }
            }
        }
    }
};

// updates License opt in on models when Opt in status of resource category changes
HAMUtils.updateLicenseOptInOnResCatOptInChange = function(resourceCategory, optIn) {
    sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(modelTable) {
        if (modelTable === 'cmdb_hardware_product_model') {
            (optIn === '1' ? HAMUtils.updateLicenseOptInOnResCatOptIn(modelTable, resourceCategory) :
                HAMUtils.updateLicenseOptInOnResCatOptOut(modelTable, resourceCategory));
        }
        HAMUtils.updateEmptyLicenceOptInModels(modelTable);
    });
};

HAMUtils.getModelTableHierarchy = function() {
    var session = gs.getSession();
    var modelTableHierarchyCacheKey = 'CmdbModelTableHierarchy';
    var modelTableHierarchy = session.getClientData(modelTableHierarchyCacheKey);
    if (gs.nil(modelTableHierarchy)) {
        modelTableHierarchy = HAMUtils.getHierarchy('cmdb_model');
        session.putClientData(modelTableHierarchyCacheKey, modelTableHierarchy);
    }
    return modelTableHierarchy;
};

// updates the opt in status of resource category
HAMUtils.updateOptInStatus = function(resourceCategorySysId, optIn) {
    var resourceCategoryGR = new GlideRecord(sn_hamp.HAMConstants.RESOURCE_CATEGORY_TABLE);
    if (resourceCategoryGR.get(resourceCategorySysId)) {
        resourceCategoryGR.setValue('opt_in', optIn);
        return resourceCategoryGR.update();
    }
    return false;
};

HAMUtils.autoOptInResourceCategories = function() {
    var resourceCategoryGR = new GlideRecord(sn_hamp.HAMConstants.RESOURCE_CATEGORY_TABLE);
    resourceCategoryGR.addQuery('sys_id', '!=', HAMConstants.MOBILE_RESOURCE_CAT_SYSID);
    resourceCategoryGR.query();
    while (resourceCategoryGR.next()) {
        resourceCategoryGR.setValue('opt_in', true);
        resourceCategoryGR.update();
    }
};

// Creates a scheduled job by script and returns the Sys Id of the job
HAMUtils.runScriptByJob = function(script, time, name, domainSysId, documentKey) {
    // eslint-disable-next-line max-len
    var triggerSysId = new global.AssetManagementBaseJob().runScriptByJob(script, time, name, domainSysId, documentKey, true);
    if (!gs.nil(triggerSysId)) {
        return triggerSysId;
    }
    // runScriptByJob doesn't return anything till Quebec
    var triggerGR = new GlideRecord('sys_trigger');
    triggerGR.addQuery('name', name);
    triggerGR.addQuery('document_key', documentKey);
    triggerGR.query();
    if (triggerGR.next()) {
        return triggerGR.getUniqueValue();
    }
    return '';
};

HAMUtils.submitJobToUpdateModelsLicense = function(resourceCatGr) {
    var script = ('sn_hamp.HAMUtils.updateLicenseOptInOnResCatOptInChange(\'' +
        resourceCatGr.getValue('sys_id') + '\', \'' +
        resourceCatGr.getValue('opt_in') + '\');');
    var resourceCatSysId = resourceCatGr.getUniqueValue();
    // Scheduled job display name: 'HAM - (Optin/Optout)_ResourceCategoryName'
    var name = ('HAM - Optin/Optout_' + resourceCatGr.getDisplayValue('resource_category'));
    // Schedule job to update License opt in field on affected models
    var scheduleItemSysId = sn_hamp.HAMUtils.runScriptByJob(script, '', name, '', resourceCatSysId);
    // update Schedule item on resource category record
    if (!gs.nil(scheduleItemSysId)) {
        var triggerGR = new GlideRecord('sys_trigger');
        if (triggerGR.get(scheduleItemSysId)) {
            resourceCatGr.setValue('schedule_item', scheduleItemSysId);
            resourceCatGr.update();
        }
    }
};

// API to check if License Setup is done on the instance
HAMUtils.isLicenseSetupDone = function() {
    return new global.GlideQuery(sn_hamp.HAMConstants.RESOURCE_CATEGORY_TABLE)
        .where('opt_in', true)
        .selectOne()
        .isPresent();
};

HAMUtils.shouldAutoOptInResourceCategories = function() {
    var assetPropertyGR = new GlideRecord(sn_hamp.HAMConstants.ASSET_PROPERTY_TABLE);
    assetPropertyGR.addQuery('key', 'com.sn_hamp.auto_opt_in_resource_categories');
    assetPropertyGR.addQuery('value', 'true');
    assetPropertyGR.query();
    return assetPropertyGR.hasNext();
};

HAMUtils.hasEntitlement = function(entitlementID, scope) {
	return HAMAppUtils.hasEntitlement(entitlementID, scope);
};

HAMUtils.getDateInInternalFormat = function(dateInUserFormat) {
    var gd = new GlideDate();
    gd.setDisplayValue(dateInUserFormat);
    return gd.getValue();
};

HAMUtils.mobileCarrierRefQual = function() {
    var gr = new GlideRecord(HAMConstants.COMPANY_TABLE);
    gr.addQuery('vendor', true);
    return gr.getEncodedQuery();
};

HAMUtils.mobileServiceContractRefQual = function() {
    var gr = new GlideRecord(HAMConstants.CONTRACT_TABLE);
    gr.addQuery('contract_model', HAMConstants.SERVICE_CONTRACT_MODEL_SYS_ID);
    return gr.getEncodedQuery();
};

HAMUtils.getTableExtensions = function(table) {
    var gth = new global.GlideTableHierarchy(table);
    return gth.getAllExtensions();
};

HAMUtils.getHierarchy = function(table) {
    var gth = new global.GlideTableHierarchy(table);
    return gth.getHierarchy();
};

HAMUtils.isConsumableClassAsset = function(assetGr) {
    return HAMUtils.isConsumableClass(assetGr.sys_class_name);
};
HAMUtils.isConsumableClass = function(className) {
    return HAMUtils.getTableExtensions(HAMConstants.ALM_CONSUMABLE_TABLE).indexOf(
        String(className)
    ) > -1;
};
HAMUtils.validateMandatoryDetails = function(taskRec) {
    var task = taskRec.getValue('sys_class_name');
    var output = {
        isProcessed: false,
        returnValue: taskRec
    };
    switch (task) {
        case 'sn_hamp_hw_refresh_line_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HAMAssetRefreshUtils.validateFieldsForRefresh(taskRec);
            return output;
        case 'sn_hamp_loaner_asset_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HampLoanerUtils.validateFieldsForLoaner(taskRec);
            return output;
        case 'sn_hamp_contract_asset_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HAMLeaseContractExpirationUtils.validateFieldsForContractTask(taskRec);
            return output;
        default:
            return output;
    }
};
HAMUtils.canCloseTask = function(taskRec) {
    var task = taskRec.getValue('sys_class_name');
    var output = {
        isProcessed: false,
        returnValue: false
    };
    switch (task) {
        case 'sn_hamp_hw_refresh_line_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HAMAssetRefreshUtils.canCloseRefreshTask(taskRec);
            return output;
        case 'sn_hamp_loaner_asset_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HampLoanerUtils.canCloseLoanerTask(taskRec);
            return output;
        case 'sn_hamp_asset_rma_task':
            output.isProcessed = true;
            output.returnValue = false;
            return output;
        case 'sn_hamp_contract_asset_task':
            output.isProcessed = true;
            output.returnValue = sn_hamp.HAMLeaseContractExpirationUtils.canCloseLeaseContractTask(taskRec);
            return output;
        default:
            return output;
    }
};

// EAM related methods
HAMUtils.isEAMActive = function() {
    return GlidePluginManager.isActive('sn_eam');
};
HAMUtils.isEAMDataModelInstalled = function() {
    return GlidePluginManager.isActive('sn_ent');
};

// Check if className is present in the hierarchy of EAM
HAMUtils.checkIfEAMClass = function(className, baseClassName) {
    if (!HAMUtils.isEAMActive()) {
        return false;
    }
    var hierarchy = HAMUtils.getTableExtensions(baseClassName);
    return hierarchy.indexOf(className.toString()) != -1;
};
HAMUtils.IS_ITAM_COMMON_ACTIVE = function() {
    return GlidePluginManager.isActive('com.sn_itam_common');
};
// Get all class names in the hierarchy of EAM asset base class
HAMUtils.getEAMAssetClasses = function() {
    return [].concat(HAMUtils.getTableExtensions(HAMConstants.EAM_ASSET_BASE_CLASS), HAMUtils.getTableExtensions(HAMConstants.ASSET_GROUP_BASE_CLASS));
};
// Get all class names in the hierarchy of EAM model base class
HAMUtils.getEAMModelClasses = function() {
    return HAMUtils.getTableExtensions(HAMConstants.EAM_MODEL_BASE_CLASS);
};

// Exclude all assets of a model category
HAMUtils.markAssetsForHAMFlows = function(resourceCategory, excludeFlag, encodedQuery, model) {
    var assetTable = HAMUtils.getAssetTableForModelCategory(resourceCategory);
    //This check is added for TNI classes, as no asset class is there in UTAH, can be removed later
    if (assetTable.length !== 0) {
        var assetGr = new GlideRecord(HAMConstants.ALM_ASSET_TABLE);
        encodedQuery = encodedQuery.replaceAll('cmdb_model_categoryLIKE', 'model_category=') + '^model=' + model;
        assetGr.addEncodedQuery(encodedQuery,true);
        assetGr.query();
        var excluded = excludeFlag === 'N' ? true : false;
        if (assetGr.hasNext()) {
            assetGr.setValue('excluded_from_ham', excluded);
            assetGr.updateMultiple();
        }
    }
};

// Get asset class for asset exclusion
//This check is added for TNI classes, as no asset class is there in UTAH 
HAMUtils.getAssetTableForModelCategory = function(resourceCategory) {
    var assetTable = [];
    var catGr = new GlideRecord(sn_hamp.HAMConstants.MODEL_CATEGORY_TABLE);
    catGr.addQuery('resource_category', resourceCategory);
    catGr.query();
    while (catGr.next()) {
        if (assetTable.indexOf(catGr.getValue('asset_class')) === -1) {
            assetTable.push(catGr.getValue('asset_class'));
        }
    }
    return assetTable;
};
HAMUtils.VALID_APPS = [HAMConstants.HAM_APP, HAMConstants.OTAM_APP, HAMConstants.TNI_APP, HAMConstants.ZTM_APP];

HAMUtils.getEntitledTNIModels = function() {
    return HAMTNIUtils.getTNIModels();
};

HAMUtils.getEntitledTNIModelCategories = function() {
    return HAMTNIUtils.getTNIModelCategories();
};

HAMUtils.filterOutNonTNIModels = function(models) {
    return HAMTNIUtils.filterOutNonTNIModels(models);
};

HAMUtils.alterFilterBasedOnTNIEntitlement = function(filter, flowFilter, flowName) {
    if (flowName === 'DISPOSAL') {
        return HAMTNIUtils.alterFilterBasedOnTNIEntitlement(filter, flowFilter, '^modelIN');
    }
    if (flowName === 'STOCK_ORDER') {
        return HAMTNIUtils.alterFilterBasedOnTNIEntitlement(filter, flowFilter, '^sys_idIN');
    }
};

HAMUtils.getEAMExclusionMessage = function(featureName) {
    return gs.getMessage('Enterprise assets are not allowed in {0}', featureName);
};
HAMUtils.RMA_EAM_EXCLUSION_FEATURE_NAME = 'hardware RMA requests';

HAMUtils.addTNIAssetClasses = function(assetClasses) {
    var tniAssetClass = HAMUtils.getAssetTableForModelCategory(sn_hamp.HAMConstants.TNI_RESOURCE_CAT_SYSID);
    for (var i = 0; i < tniAssetClass.length; i++) {
        if (assetClasses.indexOf(tniAssetClass[i]) === -1) {
            assetClasses.push(tniAssetClass[i]);
        }
    }
    return assetClasses;
};

HAMUtils.checkIfModelIsTNI = function(modelSysid) {
    var result = {
        hasEntitlement: true,
        message: ''
    };
    var tniModels = HAMUtils.getEntitledTNIModels();
    if (tniModels.indexOf(modelSysid) === -1) {
        result.hasEntitlement = false;
        result.message = gs.getMessage('This model is excluded from the licensed hardware asset features with the current entitlement. Include only the TNI models to proceed.');
    }
    return result;
};

HAMUtils.getModelClassNames = function() {
    var modelClasses = sn_hamp.HAMConstants.MODEL_TYPES.slice();
    if (HAMUtils.HAS_TNI_ENTITLEMENT) {
        var tniClasses = HAMUtils.getTableExtensions(HAMConstants.TNI_BASE_MODEL_CLASS);
        tniClasses.forEach(function(newItem) {
            modelClasses.indexOf(newItem) === -1 ? modelClasses.push(newItem) : '';
        });
    }
    return modelClasses;
};

HAMUtils.isNonLicensedModelAllowed = function(modelGr) {
    if (HAMUtils.HAS_ONLY_TNI_ENTITLEMENT && modelGr.getValue('norm_license_opt_in') === 'NA') {
        return false;
    }
    return true;
};
HAMUtils.isParentAsset = function(assetId) {
    var result = false;
    if (!gs.nil(assetId)) {
        var childAssetGr = new GlideRecord(HAMUtils.ALM_ASSET_TABLE);
        childAssetGr.addQuery('parent', assetId);
        childAssetGr.setLimit(1);
        childAssetGr.query();
        if (childAssetGr.hasNext()) {
            result = true;
        }
    }
    return result;
};

HAMUtils.isAssetExcludedforMap = function(table, assetSysId) {
    if (table !== HAMConstants.HARDWARE_ASSET_TABLE) {
        return false;
    }
    var assetGr = new GlideRecord(HAMConstants.HARDWARE_ASSET_TABLE);
    if(assetGr.get(assetSysId)) {
		return HAMLicensingUtility.isAssetExcludedFromHAMFlows(assetGr);
	}
	return true;
};

HAMUtils.showNewButtonForModelComponentsRL = function(parent) {
    var answer = true;
    if (parent.getTableName() === 'cmdb_model' && parent.getValue('bundle_assets') === '1') {
        if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
            if (parent.getValue('life_cycle_stage') !== 'Design' && parent.getValue('life_cycle_stage_status') !== 'Build') {
                answer = false;
            }
        } else {
            if (parent.getValue('status') !== 'Build') {
                answer = false;
            }
        }
    }
    return answer;
};

HAMUtils.showAssetOnMap = function(assetId) {
    var validModels = ['cmdb_hardware_product_model', 'cmdb_consumable_product_model'];
    var assetRecord = new global.GlideQuery(HAMConstants.ALM_ASSET_TABLE)
        .where('sys_id', assetId)
        .selectOne('model.sys_class_name')
        .get();
    var className = assetRecord.model.sys_class_name;
    if (validModels.indexOf(className) > -1) {
        return true;
    }
    return false;
};

// Check and update license setup cache
HAMUtils.checkLicenseSetupCache = function() {
    var hamLicenseCacheName = 'HAMLicenseCache'; // this is OOB data in sys_scoped_cache table
    var licenseCacheKey = 'licensingOptedIn'; // key for license setup cache
    var scopedCache = sn_scoped_cache.ScopedCacheManager;
    // Cache value is null first time 
    // and becomes null if there is any update on HAM Resource category table records
    var value = scopedCache.get(hamLicenseCacheName, licenseCacheKey);
    if (gs.nil(value)) {
        // check if licensing set up is done and update cache value
        sn_scoped_cache.ScopedCacheManager.put(hamLicenseCacheName, licenseCacheKey, (HAMUtils.isLicenseSetupDone()).toString());
    }
    return (scopedCache.get(hamLicenseCacheName, licenseCacheKey));
};

HAMUtils.getEAMBundlesWithHardwareComponents = function() {
    var bundleModels = [];
    new global.GlideQuery('cmdb_m2m_model_component')
        .where('child.sys_class_name', 'cmdb_hardware_product_model')
        .where('parent.bundle', true)
        .select('parent')
        .forEach(function(component) {
            bundleModels.push(component.parent);
        });
    return bundleModels.join(',');
};

HAMUtils.getStopWatch = function() {
    return new Date();
};

HAMUtils.getStopWatchTime = function(stopWatch) {
    return ((new Date().getTime()) - stopWatch.getTime()) / 1000;
};

HAMUtils.getAssetProperty = function(propName) {
    var assetPropGr = new global.GlideQuery(sn_hamp.HAMConstants.ASSET_PROPERTY_TABLE)
        .where('key', propName)
        .select('value')
        .limit(1)
        .toArray(1);
    return assetPropGr[0].value.toString();
};

HAMUtils.isZTMOnlyInstance = function() {
	return HAMAppUtils.isOnlyAppLicensed(HAMConstants.ZTM_APP);
};

HAMUtils.hasAccessToHAMContent = function() {
    var isZTMOnlyInstall = HAMUtils.isZTMOnlyInstance();
    return !isZTMOnlyInstall;
};

// Calculates and updates the license opt in of model
HAMUtils.calculateLicenseOptInForModel = function(modelGr) {
	var licenseOptIn = HAMUtils.getLicenseOptinStatusForModelCategoryList(modelGr.getValue('cmdb_model_category'), modelGr);
	if (modelGr.getValue('norm_license_opt_in') === licenseOptIn) {
		return;
	}
	modelGr.setValue('norm_license_opt_in', licenseOptIn);
	modelGr.update();
};
// TNI constants should be at the last for the dependent functions to be loaded
HAMUtils.HAS_ONLY_TNI_ENTITLEMENT = HAMTNIUtils.hasOnlyTNIEntitlement();
HAMUtils.HAS_HAM_AND_TNI_ENTITLEMENT = HAMTNIUtils.hasHAMandTNIEntitlement();
HAMUtils.HAS_TNI_ENTITLEMENT = HAMTNIUtils.hasTNIEntitlement();
HAMUtils.HAS_HAM_ONLY_ENTITLEMENT = HAMTNIUtils.hasHAMEntitlement();
