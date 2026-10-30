if (cancelled == "false") {
    var returnedDate = returned_on;
    var gDate = new GlideDateTime();
    var currentDate = gDate.getLocalDate();
    var rdt = new GlideDateTime(returnedDate);
    var cdt = new GlideDateTime(currentDate);
    if (!gs.nil(returnedDate) && rdt.after(cdt)) {
        gs.addErrorMessage(gs.getMessage('Reclamation of loaner asset is incomplete as returned date {0} is not valid. Returned date cannot be in future', returnedDate));
    } else {
        new sn_hamp.HampLoanerUtils().earlyReturnLoanerAsset(loaner_order, loaner_asset, returned_on, stockroom,isassetfunctional);
    }
}
response.sendRedirect("sn_hamp_loaner_asset_order.do?sys_id=" + loaner_order);