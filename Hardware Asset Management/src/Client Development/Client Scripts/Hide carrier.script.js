function onLoad() {
    //Type appropriate comment here, and begin script below
    var carrier = g_form.getValue("carrier");
	var shippingCarrier = g_form.getValue("shipping_carrier");
    if(carrier === '' || typeof carrier === 'undefined') {
        g_form.setDisplay("carrier", false);
		g_form.setDisplay("shipping_carrier",true);
    } else if (shippingCarrier !== '' || typeof shippingCarrier !== 'undefined') {
		g_form.setDisplay("carrier", false);
		g_form.setDisplay("shipping_carrier",true);
	} else {
		g_form.setDisplay("carrier", true);
		g_form.setDisplay("shipping_carrier",false);
	} 

}

