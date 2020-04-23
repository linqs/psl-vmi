const BAR_CHART_MARGIN =  {top: 20, right: 10, bottom: 20, left: 40};

const BAR_CHART_WIDTH = 1500;
const BAR_CHART_HEIGHT = 400;

function updateBarChart(moduleName, xVal) {
  const yVal = document.getElementById(moduleName+"-drop-down").value;
  console.log(yVal);
  // calling update
  transformBarChart(window.data[moduleName], xVal, yVal, moduleName);
}

function transformBarChart(hist_data, xVal, yVal, moduleName) {

  var data = [];
  for (var i = 1; i < hist_data.length+1; i++) {
    var datum = {};
    datum.type = yVal;
    datum.ruleNo = "Rule " + i;
    datum.label = hist_data[i-1][xVal];
    datum.value = hist_data[i-1][yVal];
    data.push(datum);
  }
  // Sort in ascending order
  data.sort(function (a,b) {return a.value - b.value});

  const xAxisWidth  = BAR_CHART_WIDTH - BAR_CHART_MARGIN.left - 
                      BAR_CHART_MARGIN.right;
  const yAxisHeight = BAR_CHART_HEIGHT - BAR_CHART_MARGIN.top - 
                      BAR_CHART_MARGIN.bottom;

  // Redefine the scale for x and y axis
  var xscale = d3.scale.ordinal()
                  .domain(data.map(function (d) { return d.ruleNo; }))
                  .rangeBands([0, xAxisWidth], .2);

  var yscale = d3.scale.linear()
                  .domain([0, d3.max(data, function (d) { return d.value; })])
                  .range([yAxisHeight , 0]);

  var newXAxis  = d3.svg.axis().scale(xscale).orient("bottom");
  var newYAxis  = d3.svg.axis().scale(yscale).orient("left");

  // Update the call function so the new scale is used for the x and y axis
  d3.select("g.x-axis-" + moduleName)
      .transition()
      .duration(1000)
      .call(newXAxis);

  d3.select("g.y-axis-" + moduleName)
      .transition()
      .duration(1000)
      .call(newYAxis);

  // Update the new the attributes of each bar for the bar chart
  d3.selectAll("rect.bar-" + moduleName)
      .data(data)
      .transition(1000)
      .attr("x", function (d) { return xscale(d.ruleNo); })
      .attr("y", function (d) { return yscale(d.value); })
      .attr("height", function (d) {
                const newHeight = yAxisHeight - yscale(d.value);
                if ( newHeight == 0 )
                  return 1;
                return newHeight; 
              });
}

function show_hist(hist_data, xVal, yVal, moduleName) {

  var div = d3.select(".psl-viz").append("div");
  div.classed("viz-module", true);

  var dropDown = div.append("select")
                      .attr("id", moduleName + "-drop-down");

  var menu = document.getElementById(moduleName + "-drop-down");
  var index = 0;
  for (var label in hist_data[0]) {
    if ( label != xVal ) {
      var option = document.createElement("option");
      option.text = label;
      menu.options.add(option);
      if ( label == yVal ) {
        menu.options.selectedIndex = index;
      }
    }
    index++;
  }
  console.log( menu.value );
  if ( menu.options.length > 1 ) {
    menu.onchange = function() {
      updateBarChart(moduleName, xVal);
    };
  }

  var data = [];
  for (var i = 1; i < hist_data.length+1; i++) {
    var datum = {};
    datum.type = yVal;
    datum.ruleNo = "Rule " + i;
    datum.label = hist_data[i-1][xVal];
    datum.value = hist_data[i-1][yVal];
    data.push(datum);
  }

  // console.log(isScrollDisplayed)
  // Sort in ascending order
  data.sort(function (a,b) {return a.value - b.value});

  const xAxisWidth  = BAR_CHART_WIDTH - BAR_CHART_MARGIN.left - 
                      BAR_CHART_MARGIN.right;
  const yAxisHeight = BAR_CHART_HEIGHT - BAR_CHART_MARGIN.top - 
                      BAR_CHART_MARGIN.bottom;

  var xscale = d3.scale.ordinal()
                  .domain(data.map(function (d) { return d.ruleNo; }))
                  .rangeBands([0, xAxisWidth], .2);

  var yscale = d3.scale.linear()
                  .domain([0, d3.max(data, function (d) { return d.value; })])
                  .range([yAxisHeight, 0]);

  var xAxis = d3.svg.axis().scale(xscale).orient("bottom");
  var yAxis = d3.svg.axis().scale(yscale).orient("left");

  var svg = div.append("svg")
                .attr("width", BAR_CHART_WIDTH)
                .attr("height", BAR_CHART_HEIGHT);

  const svgTranslate = "translate(" + BAR_CHART_MARGIN.left + "," + 
                        BAR_CHART_MARGIN.top + ")";
  var diagram = svg.append("g")
                     .attr("transform", svgTranslate);

  diagram.append("g")
          .attr("class", "x-axis-" + moduleName)
          .attr("transform", "translate(0, " + yAxisHeight + ")")
          .call(xAxis);

  diagram.append("g")
          .attr("class", "y-axis-" + moduleName)
          .call(yAxis);

  var bars = diagram.append("g");

  var showLabelValue = d3.tip()
      .attr("class", "d3-tip")
      .html(function(d) {
        return "<h4>"+ "Rule: " + d.label + "</h4>" + d.type + ": " + d.value;
      });

  svg.call(showLabelValue);
 
  bars.selectAll("rect")
              .data(data, function (d) {return d.ruleNo; })
              .enter().append("rect")
              .attr("class", "bar-" + moduleName)
              .attr("x", function (d) { return xscale(d.ruleNo); })
              .attr("y", function (d) { return yscale(d.value); })
              .attr("width", xscale.rangeBand())
              .attr("height", function (d) {
                const newHeight = yAxisHeight - yscale(d.value);
                if ( newHeight == 0 )
                  return 1;
                return newHeight; 
              })
              .on('mouseover', showLabelValue.show)
              .on('mouseout', showLabelValue.hide)
              .style("fill", "steelblue");
}

function tabulate(data, columns, sortOptions, sortTarget, moduleName) {

	var div = d3.select('.psl-viz').append('div');
	div.classed("viz-module", true);

  var dropDown = div.append("select")
                      .attr("id", moduleName + "-drop-down");

  var menu = document.getElementById(moduleName + "-drop-down");

  for (var i = 0; i < sortOptions.length; i++) {
    var option = document.createElement("option");
    option.text = sortOptions[i];
    menu.options.add(option);
  }

  menu.onchange = function(d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateChart function with this selected option
    update(selectedOption)
   };

	var table = div.append('table')
    table.append("thead").append("tr");

  var headers = table.select("tr").selectAll("th")
                      .data(columns)
                      .enter()
                      .append("th")
                      .text(function(d) { return d; });

	// create a row for each object in the data
	var rows = table.selectAll('tr')
                    .data(data)
	                  .enter()
	                  .append('tr')
                      .sort(function (a, b) {
                      if (a.Prediction > b.Prediction) {
                          return 1;
                      }
                      if (a.Prediction < b.Prediction) {
                          return -1;
                      }
                      // a must be equal to b
                      return 0;
                  });

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

    /**
    Code below does sorting on clicking headers
    **/
    // var clicks = 0;
    // headers.on("click", function(d) {
    //     console.log(clicks);
    //     if (d == columns[1]) {
    //         if (clicks % 2 == 0) {
    //             rows.sort(function (a, b) {
    //                 if (a[columns[1]] > b[columns[1]]) {
    //                     return -1;
    //                 }
    //                 if (a[columns[1]] < b[columns[1]]) {
    //                     return 1;
    //                 }
    //                 // a must be equal to b
    //                 return 0;
    //             });
    //         }
    //         else {
    //             rows.sort(function (a, b) {
    //                 if (a[columns[1]] > b[columns[1]]) {
    //                     return 1;
    //                 }
    //                 if (a[columns[1]] < b[columns[1]]) {
    //                     return -1;
    //                 }
    //                 // a must be equal to b
    //                 return 0;
    //             });
    //         }
    //     }
    //     clicks++;
    // })

  function update(selectedGroup) {
    // console.log(selectedGroup);
    rows.sort(function (a, b) {
            if (a[sortTarget] > b[sortTarget]) {
                if (selectedGroup == "Ascending") {
                  return 1;
              }
                else {
                    return -1;
                }
            }
            if (a[sortTarget] < b[sortTarget]) {
                if (selectedGroup == "Ascending") {
                return -1;
              }
              else {
                  return 1;
              }
            }
            // a must be equal to b
            return 0;
        });
  }

    // d3.select(moduleName + "-drop-down").on("change", function(d) {
    //   // recover the option that has been chosen
    //   var selectedOption = d3.select(this).property("value")
    //   // run the updateChart function with this selected option
    //   update(selectedOption)
    // })

  return table;
}

$( document ).ready(function() {
    d3.json("PSLVizData.json", function(data) {
      console.log(data);
      window.data = data;

      const tableSortOptions = ["Ascending", "Descending"];
      const PredictionTruthCols = ['Predicate', 'Prediction','Truth'];
      tabulate(data["PredictionTruth"], PredictionTruthCols, tableSortOptions, 
               "Prediction", "PredictionTruth");

      const violatedGroundRulesCols = ['Violated Rule', 'Parent Rule', 
                                       'Violation'];
      tabulate(data["ViolatedGroundRules"], violatedGroundRulesCols,
               tableSortOptions, "Violation", "Violation");

      console.log(data["ViolatedGroundRules"]);
      show_hist(data["SatDis"], "Rule", "Total Satisfaction", "SatDis");
      show_hist(data["RuleCount"], "Rule", "Count", "RuleCount");
  });
});

//TODO: An overall js file that creates an initilize that is passed in data then
// hand off that data to the proper functions
