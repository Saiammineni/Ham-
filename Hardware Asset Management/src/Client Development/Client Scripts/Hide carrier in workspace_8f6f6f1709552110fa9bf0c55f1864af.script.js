function onLoad() {
    //Type appropriate comment here, and begin script below
    var carrier = g_form.getValue("carrier");
    if (typeof carrier === 'undefined' || carrier ==='') {
        g_form.setDisplay("carrier", false);
		g_form.setDisplay("shipping_carrier",true);
    } else {
		g_form.setDisplay("carrier", true);
		g_form.setDisplay("shipping_carrier",false);
  }

}