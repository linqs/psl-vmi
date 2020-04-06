// https://gist.github.com/jfreels/6734025
// https://www.dashingd3js.com/lessons/d3-and-json


//Currently with how the json is set up, its a jsonObject, do we need to convert it into a jsonarray?
// data = Object.keys(ob).map(function(k) { return {key:k, value:ob[k]} })

//I don't really know the proper way I should be doing this with javascript so this works for now
main();

//E.x. What does this do (from old prototype)
// "use strict";
// $(document).ready(function() {
//     main();
// });

// d3.json('data.json', function (error,data) {

function tabulate(data, columns) {
	var table = d3.select('body').append('table')
	var thead = table.append('thead')
	var	tbody = table.append('tbody');

	// append the header row
	thead.append('tr')
	  .selectAll('th')
	  .data(columns).enter()
	  .append('th')
	    .text(function (column) { return column; });

	// create a row for each object in the data
	var rows = tbody.selectAll('tr')
	  .data(data)
	  .enter()
	  .append('tr');

	// create a cell in each row for each column
	var cells = rows.selectAll('td')
	  .data(function (row) {
	    return columns.map(function (column) {
	      return {column: column, value: row[column]};
	    });
	  })
	  .enter()
	  .append('td')
	    .text(function (d) { return d.value; });

  return table;
}

function main() {
    // var output = window.pslviz.output;
    // var data = window.pslviz.data;
    d3.json("output.json", function(data) {
    console.log(data);
    // data = Object.keys(output).map(function(k) { return {key:k, value:output[k]} })
    tabulate(data, ['Predicate', 'Prediction','Truth']);
    });
}
