var diff=function(x,y){return x.dateNumericValue() - y;};
var days=function(x,y){return diff(x,y)/(24*60*60*1000);};
var curDate = new GlideDateTime();
if (current.start_date.nil())
	-10000;
else if (current.start_date.dateNumericValue() == 0)
	0;
else {
	days(current.start_date, curDate.getNumericValue());
}