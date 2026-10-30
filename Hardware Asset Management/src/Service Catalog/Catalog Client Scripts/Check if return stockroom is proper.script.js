function onSubmit() {
	//Type appropriate comment here, and begin script below
	if(g_form.getValue('refresh_method') == 'ship'){
		if(g_form.getValue('return_stockroom')){
			return true;
		}
		else{
			g_form.clearValue('acknowledgement');
			g_form.showFieldMsg('acknowledgement', getMessage('No stockroom is serviceable for the address details provided. Provide valid details against the street, city, state and country fields.'), 'error');
			return false;
		}
	}
	return true;
}