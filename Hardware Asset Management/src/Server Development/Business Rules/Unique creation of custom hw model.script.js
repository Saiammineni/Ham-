function _ifSimilarRecordExist(model) {
    var sysDomainId = gs.nil(model.sys_domain) ? 'global' : model.sys_domain;

    var modelGR = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_PRODUCT_MODEL);
    modelGR.addQuery('model_number', model.model_number);
    modelGR.addQuery('hw_product', model.hw_product);
    modelGR.addQuery('sys_domain', sysDomainId);
    modelGR.setLimit(1);
    modelGR.query();

    return modelGR.hasNext();
}

function _processInsert(currentModel) {
    if (_ifSimilarRecordExist(currentModel)) {
        gs.addErrorMessage(gs.getMessage('There is already a model with the same model number and hardware product'));
        currentModel.setAbortAction(true);
    }
}

function _processUpdate(currentModel) {
    if (currentModel.model_number.changes() || currentModel.hw_product.changes()) {
        if (_ifSimilarRecordExist(currentModel)) {
            gs.addErrorMessage(gs.getMessage('There is already a model with the same model number and hardware product'));
            currentModel.setAbortAction(true);
        }
    }
}

(function executeRule(current) {
    if (current.operation() === 'insert') {
        _processInsert(current);
    } else if (current.operation() === 'update') {
        _processUpdate(current);
    }
}(current));