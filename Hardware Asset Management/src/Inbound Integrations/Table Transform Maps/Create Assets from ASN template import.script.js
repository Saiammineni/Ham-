(function transformRow(source, target, map, log, isUpdate) {
    var logErrorMsg = [];
    var consumableSysId = '218323293743100044e0bfc8bcbe5d61'; // sys_id for model category = Consumable
    var isQuantityError = false;

    var getPo = new GlideRecord('proc_po');
    getPo.addQuery('number', source.po_number);
    getPo.query();
    var domainId = new global.AssetManagementBaseJob().getCurrentDomainSysId();

    var isValidCarrier = true;
    if (!gs.nil(source.carrier) && (gs.getProperty('sn_hamp.enable_shipping_carrier_validation_asn') === 'true')) {
        var shipCarrier = new GlideRecord('sn_itam_common_shipping_carrier');
        shipCarrier.addQuery('name', source.carrier);
        shipCarrier.addQuery('status', 'active');
        shipCarrier.query();
        isValidCarrier = shipCarrier.hasNext();
    }

    function updateFields() {
        var returnObj = {
            model: {},
            modelFound: true
        };
        var hamASNUtil =  new HAMASNUtil(); 

        //DEF0635889: added query to check if the model provided is present in the PO lines
        var getPol = new GlideRecord("proc_po_item");
        getPol.addQuery("purchase_order.number", source.po_number);
        getPol.addQuery("model.model_number", source.model_id).addOrCondition("model.name", source.model_id);
        getPol.setLimit(1);
        getPol.query();

        var getModel;
        if (getPol.next()) {
            getModel = new GlideRecord("cmdb_model");
            getModel.get(getPol.model.sys_id);
        } else {
            getModel = new GlideRecord("cmdb_model");
            getModel.addQuery("model_number", source.model_id).addOrCondition("name", source.model_id);
            getModel.query();
            if (!getModel.next()) {
                logErrorMsg.push(gs.getMessage("Cannot find a model with given Model ID"));
                ignore = true;
                returnObj.modelFound = false;
                return returnObj;
            }
        }

        var setCategory = "";

        /* handle different asset tracking strategies */
        if (getModel.getValue('asset_tracking_strategy') === 'track_as_consumable') {
            setCategory = consumableSysId;
        } else if (getModel.getValue('asset_tracking_strategy') === 'do_not_track') {
            logErrorMsg.push(gs.getMessage("Asset is not created because asset tracking strategy is set to 'Don't create asset'"));
            ignore = true;
        } else {
            setCategory = getModel.getValue('cmdb_model_category');
            if (!gs.nil(setCategory)) {
                setCategory = setCategory.split(",")[0];
            }
        }

        if (setCategory === consumableSysId) {
            var importQty = parseInt(source.quantity);
            if ((importQty === parseInt(importQty, 10)) && importQty > 0) {
                target.quantity = importQty;
            } else {
                target.quantity = 1;
            }
            target.sys_class_name = "alm_consumable";
        } else {
            var uniqueIdentifierFields = [];
            var uniqueIdentifierLabels = [];
            if (!this.uniqueIdentifer.hasOwnProperty(setCategory)) {
                // cache the unique identifier fields and labels for each model category   
                this.uniqueIdentifer[setCategory] = hamASNUtil.getUniqueAttributesByModelCategory(setCategory);
            }
            // get the unique identifier fields and labels for the model category
            uniqueIdentifierFields = this.uniqueIdentifer[setCategory].fields;
            uniqueIdentifierLabels = this.uniqueIdentifer[setCategory].labels;

            // check if the model category has unique identifier fields
            if (uniqueIdentifierFields.length > 0) {
                var mandatorycheckPassed = hamASNUtil.checkMandatoryFields(source, uniqueIdentifierFields);
                if (!mandatorycheckPassed) {
                    var uniqueIdentiferMessage = "";
                    if(uniqueIdentifierLabels.length > 1) {
                        logErrorMsg.push(gs.getMessage("Asset can not be created since {0} and {1} are missing", [uniqueIdentifierLabels.slice(0, -1).join(", "), uniqueIdentifierLabels[uniqueIdentifierLabels.length - 1]]));
                    } else if (uniqueIdentifierLabels.length === 1) {
                        logErrorMsg.push(gs.getMessage("Asset can not be created since {0} is missing", uniqueIdentifierLabels[0]));
                    }
                    ignore = true;
                }
            }
            if (!ignore) {
                // check if asset with the same unique identifier fields already exists
                var isUnique = hamASNUtil.checkUniqueFields(source, setCategory, uniqueIdentifierFields);
                if (!isUnique) {
                    if(uniqueIdentifierLabels.length > 1) {
                        logErrorMsg.push(gs.getMessage("Asset already exists with same {0}, or {1}", [uniqueIdentifierLabels.slice(0, -1).join(", "), uniqueIdentifierLabels[uniqueIdentifierLabels.length - 1]]));
                    } else {
                        logErrorMsg.push(gs.getMessage("Asset with given {0} already exists", uniqueIdentifierLabels[0]));
                    }
                    ignore = true;
                }
            }
            if (!gs.nil(source.quantity) && parseInt(source.quantity, 10) > 1) {
                isQuantityError = true;
            }
            target.quantity = 1;
            target.serial_number = source.serial;
            if (!gs.nil(setCategory)) {
                var model_category_gr = new GlideRecord('cmdb_model_category');
                model_category_gr.get(setCategory);
                if (!gs.nil(model_category_gr.asset_class)) {
                    target.sys_class_name = model_category_gr.asset_class;
                }
            }
        }

        target.model_category = setCategory;
        target.model = getModel.sys_id;
        returnObj.model = getModel;
        return returnObj;
    }

    /* validate shipping address and Model ID */
    if (gs.nil(source.ship_to_address_street) || gs.nil(source.ship_to_address_city) || gs.nil(source.ship_to_address_state) || gs.nil(source.model_id)) {
        logErrorMsg.push(gs.getMessage("Please ensure that the Model ID and Shipping address are correctly entered on the template"));
        ignore = true;
    } else if (!isValidCarrier && (gs.getProperty('sn_hamp.enable_shipping_carrier_validation_asn') === 'true')) {
        logErrorMsg.push(gs.getMessage("Carrier is invalid or inactive. Please ensure that the carrier is present in Shipping Carrier"));
        ignore = true;
    } else {
        if (getPo.next()) {
            /* PO must be in same domain as ASN import */
            if (domainId !== getPo.getValue('sys_domain')) {
                logErrorMsg.push(gs.getMessage("Asset is not created since PO ({0}) belongs to different domain", source.po_number));
                ignore = true;
            } else {
                var resultObj = updateFields();
                if (resultObj.modelFound) {
                    /* PO needs to be be in pending delivery or ordered state */
                    if (!(getPo.getValue("status").equalsIgnoreCase("pending") ||
                            getPo.getValue("status").equalsIgnoreCase("ordered"))) {

                        logErrorMsg.push(gs.getMessage("Asset can not be processed since PO {0} is not in pending delivery or ordered status", source.po_number));
                        ignore = true;
                    }

                    target.po_number = getPo.number;

                    /* shipping address should match PO ship to address */
                    var shipToStreet = getPo.ship_to.location.street.toString().toLowerCase();
                    var shipToCity = getPo.ship_to.location.city.toString().toLowerCase();
                    var shipToState = getPo.ship_to.location.state.toString().toLowerCase();
                    var templateAddressStreet = source.getValue('ship_to_address_street').toLowerCase();
                    var templateAddressCity = source.getValue('ship_to_address_city').toLowerCase();
                    var templateAddressState = source.getValue('ship_to_address_state').toLowerCase();

                    if (!(templateAddressStreet === shipToStreet &&
                            templateAddressCity === shipToCity &&
                            templateAddressState === shipToState)) {
                        logErrorMsg.push(gs.getMessage("Shipping address is different from purchase order ship to address"));
                        ignore = true;
                    } else {
                        target.location = getPo.ship_to.location;
                    }

                    var getPol = new GlideRecord('proc_po_item');
                    getPol.addQuery('model', resultObj.model.sys_id);
                    getPol.addQuery('purchase_order', getPo.sys_id);
                    getPol.orderBy('sys_created_on');
                    getPol.setLimit(1);
                    getPol.query();

                    if (getPol.next()) {
                        target.purchase_line = getPol.sys_id;
                        target.request_line = getPol.request_line;
                    }
                }
            }
        } else {
            /* create asset only if shipping address matches existing location record */
            var findLocation = new GlideRecord('cmn_location');
            findLocation.addQuery('street', source.ship_to_address_street);
            findLocation.addQuery('city', source.ship_to_address_city);
            findLocation.addQuery('state', source.ship_to_address_state);
            findLocation.query();

            if (!findLocation.next()) {
                logErrorMsg.push(gs.getMessage("Shipping address is invalid"));
                ignore = true;
            } else {
                target.location = findLocation.sys_id;
                updateFields();
            }
        }
    }
    /* Populate comments field of asset */
    var commentString = [];
    if (gs.nil(target.po_number) && !gs.nil(source.po_number)) {
        commentString.push(gs.getMessage("PO Number : {0}", source.po_number));
    }

    if (gs.nil(target.purchase_line)) {
        commentString.push(gs.getMessage("Ship To Address Street : {0}", source.ship_to_address_street));
        commentString.push(gs.getMessage("Ship To Address City : {0}", source.ship_to_address_city));
        commentString.push(gs.getMessage("Ship To Address State : {0}", source.ship_to_address_state));
        commentString.push(gs.getMessage("Ship To Address Zip : {0}", source.ship_to_address_zip));
        commentString.push(gs.getMessage("Carrier : {0}", source.carrier));
        commentString.push(gs.getMessage("Track number : {0}", source.track_number));
        commentString.push(gs.getMessage("Ship Date : {0}", source.ship_date));
    }

    target.comments = commentString.join("\n");

    /* display error message to user */
    if (ignore === true) {
        source.sys_import_state_comment = logErrorMsg.join(", ");
    } else if (isQuantityError) {
        source.sys_import_state_comment = gs.getMessage("Quantity value for non consumable asset should not be greater than 1");
    }

})(source, target, map, log, action === "update");