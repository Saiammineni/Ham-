var input = document.getElementById("stockroom");
var observer = new MutationObserver(function(mutations, observer) {
    if(mutations[0].attributeName == "value") {
		validate();
    }
});

observer.observe(input, {
    attributeFilter: ['value']
});

function cancel() {
    var c = gel('cancelled');
    c.value = "true";
    GlideDialogWindow.get().destroy();
    return false;
}

function validate() {
    var msg;
    var stockroom = gel('stockroom').value;
    var actualStockroom = gel('actual_stockroom').value;
    if (actualStockroom !== stockroom) {
        msg = formatMessage(getMessage('HAM: Asset Reservations Stockroom Warning'));
        jQuery("#info-message-container").text(msg);
        jQuery("#info-message-container").removeClass("hide");
    } else {
        jQuery("#info-message-container").addClass("hide");
    }
}

function actionOK() {
    var stockroom = gel('stockroom').value;
    var assetReturned = gel('assetreturned').value;
	var isassetfunctional = gel('isassetfunctional').value;
	var errMsg;
	if (assetReturned === 'N') {
		errMsg = formatMessage(getMessage('To complete reclamation, update {0} value to Yes'), getMessage('Asset returned'));
        jQuery("#error-message-container").text(errMsg);
        jQuery("#error-message-container").removeClass("hide");
		return false;
    }
	if (!(isassetfunctional === 'Y' || isassetfunctional === 'N')) {
		errMsg = formatMessage(getMessage('To complete reclamation, update {0} value to either Yes or No'), getMessage('Asset functional'));
        jQuery("#error-message-container").text(errMsg);
        jQuery("#error-message-container").removeClass("hide");
		return false;
	}
    var mandatoryFields = [];
    if (stockroom === '') {
        mandatoryFields.push(getMessage('Stockroom'));
    }
    if (mandatoryFields.length > 0) {
        errMsg = formatMessage(getMessage('The following mandatory fields are not filled in: {0}'), mandatoryFields.join(', '));
        jQuery("#error-message-container").text(errMsg);
        jQuery("#error-message-container").removeClass("hide");
        return false;
    }
    return true;
}