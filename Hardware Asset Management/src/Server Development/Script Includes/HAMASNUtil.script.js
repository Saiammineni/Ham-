var HAMASNUtil = Class.create();
HAMASNUtil.prototype = {
    initialize: function () {
    },

    getUniqueAttributesByModelCategory: function (modelCategory) {
        var uniqueIdentifierFields = [];
        var uniqueIdentifierLabels = [];
        var assetCmdbUtil = new global.AssetCMDBUtil();
        if (assetCmdbUtil.getMandatoryFieldCheck) {
            uniqueIdentifierFields = assetCmdbUtil.getMandatoryFieldCheck(modelCategory);
        } else {
            uniqueIdentifierFields = ['serial_number'];
        }
        var labelQuery = new GlideRecord("alm_asset");
        labelQuery.initialize();
        for (var i = 0; i < uniqueIdentifierFields.length; i++) {
            uniqueIdentifierLabels.push(labelQuery[uniqueIdentifierFields[i]].getLabel().toLowerCase());
        }
        return {
            'fields': uniqueIdentifierFields,
            'labels': uniqueIdentifierLabels
        }
    },

    checkMandatoryFields: function (importRowGr, uniqueIdentifierFields) {
        var mandatorycheckPassed = false;
        // Check if any mandatory field exists and is not null in the importRowGr object
        mandatorycheckPassed = uniqueIdentifierFields.some(function (field) {
            var adjustedField = field;
            if (field === 'serial_number') {
                adjustedField = 'serial';
            }
            return !gs.nil(importRowGr[adjustedField]);
        });
        // Return true if any field is valid, otherwise false
        return mandatorycheckPassed;
    },

    checkUniqueFields: function (importRowGr, modelCategory, uniqueIdentifierFields) {
        // Initialize a GlideQuery to check for assets with the same model category
        if(!uniqueIdentifierFields.includes("serial_number") && !uniqueIdentifierFields.includes("asset_tag")) {
            return true;
        }
        var checkUniqueQuery = new global.GlideQuery("alm_asset");
        checkUniqueQuery = checkUniqueQuery.where('model_category', modelCategory);

        // Create a condition query to check for unique identifier fields (serial_number, asset_tag)
        // mac_address is not supported for HAM as it is not captured in any asset creation
        var conditionQuery = new global.GlideQuery("alm_asset");
        var firstCondition = true;

        // Add condition for serial_number if it exists in uniqueIdentifierFields and is not null
        if (uniqueIdentifierFields.includes("serial_number") && !gs.nil(importRowGr.serial)) {
            conditionQuery = conditionQuery.where('serial_number', importRowGr.serial);
            firstCondition = false;
        }

        // Add condition for asset_tag if it exists in uniqueIdentifierFields and is not null
        if (uniqueIdentifierFields.includes("asset_tag") && !gs.nil(importRowGr.asset_tag)) {
            if (firstCondition) {
                conditionQuery = conditionQuery.where('asset_tag', importRowGr.asset_tag);
            } else {
                conditionQuery = conditionQuery.orWhere('asset_tag', importRowGr.asset_tag);
            }
        }

        // Combine the condition query with the main query
        checkUniqueQuery = checkUniqueQuery.where(conditionQuery);

        // Count the number of matching records and return true if no matches are found
        var count = checkUniqueQuery.count();
        // Return true if no matching records are found, otherwise false
        return count === 0;
    },

    type: 'HAMASNUtil'
};