const BAR_CHART_MARGIN = {
      top: 20,
      right: 10,
      bottom: 20,
      left: 40
    };

const BAR_CHART_COL_WIDTH = 100;
const BAR_CHART_HEIGHT = 400;
const BAR_CHART_TRANSITION_DURATION = 1000;

function updateBarChart(chart) {

  const yVal = document.getElementById(chart.menuId).value;
  console.log(yVal);

  // calling update
  chart.yAxisLabel = yVal;
  transformBarChart(chart, window.data[chart.id]);
}

function transformBarChart(chart, barData) {

  console.log(barData);
  var data = [];
  for (var i = 1; i < barData.length+1; i++) {
    var datum = {};
    datum.type = chart.yAxisLabel;
    datum.ruleNo = "Rule " + i;
    datum.label = barData[i-1][chart.xAxisLabel];
    datum.value = barData[i-1][chart.yAxisLabel];
    data.push(datum);
  }
  // This should soon have a drop down menu for the user to choose how they
  // want to sort their data
  // Sort in ascending order
  data.sort(function (a,b) {return a.value - b.value});

  // Redefine the scale for x and y axis
  chart.xScale.domain(data.map(function (d) { return d.ruleNo; }));
  chart.yScale.domain([0, d3.max(data, function(row) { return row.value })]);

  // Update the y-axis label
  chart.svg.transition().select(".y-label")
    .duration(BAR_CHART_TRANSITION_DURATION)
    .text(chart.yAxisLabel);

  // Update the call function so the new scale is used for the x and y axis
  chart.svg.transition().select(".x-axis")
    .duration(BAR_CHART_TRANSITION_DURATION)
    .call(chart.xAxis);

  chart.svg.transition().select(".y-axis")
    .duration(BAR_CHART_TRANSITION_DURATION)
    .call(chart.yAxis);

  // Update the new the attributes of each bar for the bar chart with new data
  chart.svg.selectAll(".bar")
    .data(data)
    .transition()
    .duration(BAR_CHART_TRANSITION_DURATION)
    .attr("x", function(row) { return chart.xScale(row.ruleNo); })
    .attr("width", chart.xScale.rangeBand())
    .attr("y", function(row) { return chart.yScale(row.value); })
    .attr("height", function(row) {
      const newHeight = chart.innerHeight - chart.yScale(row.value);
      if ( newHeight == 0 )
        return 1;
      return newHeight;
    });
}

function createBarChart(chartData, containerSelector, xAxisLabel, yAxisLabel,
                   chartId) {

  var div = d3.select(containerSelector).append("div");
  div.classed("viz-module", true);

  var menuId = chartId + "-drop-down";

  var dropDown = div.append("select")
                      .attr("id", menuId);

  var menu = document.getElementById(menuId);
  var index = 0;
  console.log(chartId);
  for (var label in chartData[0]) {
    if ( label != xAxisLabel ) {
      var option = document.createElement("option");
      option.text = label;
      menu.options.add(option);
      // Default selected y-axis label
      if ( label == yAxisLabel ) {
        menu.options.selectedIndex = index;
      }
    }
    index++;
  }
  // Remove unnecassary drop down menu
  if ( menu.options.length < 2 ) {
    menu.remove();
  }

  var data = [];
  for (var i = 1; i < chartData.length+1; i++) {
    var datum = {};
    datum.type = yAxisLabel;
    datum.ruleNo = "Rule " + i;
    datum.label = chartData[i-1][xAxisLabel];
    datum.value = chartData[i-1][yAxisLabel];
    data.push(datum);
  }

  // console.log(isScrollDisplayed)
  // Sort in ascending order
  data.sort(function (a,b) {return a.value - b.value});

  const outterWidth = data.length * BAR_CHART_COL_WIDTH;
  const outterHeight = BAR_CHART_HEIGHT;

  // The dimensions inside the margins.
  const innerWidth = outterWidth - BAR_CHART_MARGIN.left -
                     BAR_CHART_MARGIN.right;
  const innerHeight = outterHeight - BAR_CHART_MARGIN.top -
                      BAR_CHART_MARGIN.bottom;

  var xScale = d3.scale.ordinal()
                  .domain(data.map(function (d) { return d.ruleNo; }))
                  .rangeBands([0, innerWidth], .2);

  var yScale = d3.scale.linear()
                  .domain([0, d3.max(data, function (d) { return d.value; })])
                  .range([innerHeight, 0]);

  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  const svgTranslation = "translate(" + BAR_CHART_MARGIN.left + "," +
                         BAR_CHART_MARGIN.top + ")";
  var svg = div.append("svg")
                .attr("id", chartId)
                .attr("width", outterWidth)
                .attr("height", outterHeight)
                .append("g")
                .attr("transform", svgTranslation);;

  // Y Axis Label
  svg.append("text")
      .attr("class", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - (BAR_CHART_MARGIN.left / 1.25))
      .attr("x", 0 - (innerHeight / 2))
      .attr("dy", "0.5em")
      .style("text-anchor", "middle")
      .text(yAxisLabel);

  const xAxisLabelTranslation = "translate(" + (innerWidth / 2) + " ," +
                                (innerHeight + BAR_CHART_MARGIN.bottom) + ")";
  // X Axis Label
  svg.append("text")
      .attr("class", "x-label")
      .attr("transform", xAxisLabelTranslation)
      .style("text-anchor", "middle")
      .text(xAxisLabel);


  // X Axis
  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + innerHeight + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end");

  // Y Axis
  svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "1em")
      .style("text-anchor", "end");

  var showLabelValue = d3.tip()
      .attr("class", "d3-tip")
      .html(function(d) {
        return "<h4>"+ "Rule: " + d.label + "</h4>" + d.type + ": " + d.value;
      });

  svg.call(showLabelValue);

  var bars = svg.selectAll("bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(row) { return xScale(row.ruleNo); })
      .attr("width", xScale.rangeBand())
      .attr("y", function(row) { return yScale(row.value); })
      .attr("height", function(row) {
        const newHeight = innerHeight - yScale(row.value);
        if ( newHeight == 0 )
          return 1;
        return newHeight;
      })
      .on('mouseover', showLabelValue.show)
      .on('mouseout', showLabelValue.hide);
  return {
    'id': chartId,
    'menuId' : menuId,
    'containerSelector': containerSelector,
    'svg': svg,
    'xScale': xScale,
    'yScale': yScale,
    'xAxis': xAxis,
    'yAxis': yAxis,
    'xAxisLabel': xAxisLabel,
    'yAxisLabel': yAxisLabel,
    'bars': bars,
    'outterWidth': outterWidth,
    'outterHeight': outterHeight,
    'innerWidth': innerWidth,
    'innerHeight': innerHeight,
  };
}

function createTable(data, columns, tableId) {

	var div = d3.select('.psl-viz').append('div');
	div.classed("viz-module", true);

	var table = div.append('table')
    .attr("id", tableId)
    .attr("class", "tablesorter")
    table.append("thead").append("tr");

  var headers = table.select("tr").selectAll("th")
                      .data(columns)
                      .enter()
                      .append("th")
                      .text(function(d) { return d; });

	// create a row for each object in the data
	var rows = table.append("tbody").selectAll('tr')
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

//TODO: Better way to grab from JSON then what these functions do??
function createTruthTable(data, tableIdList) {
  //Find the correct data
  var truthObjectList = [];
  for (key in data["truthMap"]) {
    var truthObject = {};
    truthObject.Prediction = data["groundAtoms"][key]["prediction"];
    truthObject.Truth = data["truthMap"][key];
    truthObject.Predicate = data["groundAtoms"][key]["string"];
    truthObjectList.push(truthObject);
  }
  //Create table
  const predictionTruthCols = ['Predicate', 'Prediction','Truth'];
  var tableId = "PredictionTruth";
  tableIdList.push(tableId)
  createTable(truthObjectList, predictionTruthCols, tableId);
}

function createViolationTable(data, tableIdList) {
  //Find the correct data
  var rulesObject = data["rules"];
  var groundRulesObject = data["groundRules"];
  var violationObjectList = [];
  for (ruleID in rulesObject) {
    if (rulesObject[ruleID]["weighted"] == false){
      for (groundRuleID in groundRulesObject){
        if (groundRulesObject[groundRuleID]["ruleID"] == ruleID) {
          if (groundRulesObject[groundRuleID]["disatisfaction"] > 0){
            var violationObject = {};
            violationObject.ViolatedRule = "Implement creating ground rules";
            violationObject.ParentRule = rulesObject[ruleID]["string"];
            violationObject.Violation = groundRulesObject[groundRuleID]["disatisfaction"];
            violationObjectList.push(violationObject);
          }
        }
      }
    }
  }
  //Create table
  const violatedGroundRulesCols = ['Violated Rule', 'Parent Rule', 'Violation'];
  var tableId = "Violation";
  tableIdList.push(tableId)
  createTable(violationObjectList, violatedGroundRulesCols, tableId);
}

//TODO: Will have to implement something like this for transformBarChart
// function createDissatisfactionChart(data){
//   var rulesObject = data["rules"];
//   var groundRulesObject = data["groundRules"];
//   var disObjectList = [];
//   for (ruleID in rulesObject){
//     var disObject = {};
//     var totalSat = 0;
//     var totalDis = 0;
//     for (groundRuleID in groundRulesObject){
//       if (groundRulesObject[groundRuleID]["ruleID"] == ruleID){
//         totalDis += groundRulesObject[groundRuleID]["disatisfaction"];
//         totalSat += 1 - groundRulesObject[groundRuleID]["disatisfaction"];
//       }
//     }
//     disObject.TotalDissatisfaction = totalDis;
//     disObject.TotalSatisfaction = totalSat;
//     // disObject.DissatisfactionPercentage
//     // disObject.SatisfactionPercentage
//     disObject.Rule = rulesObject[ruleID]["text"];
//     disObjectList.push(disObject)
//   }
//   console.log(disObjectList);
//
//   return createBarChart(disObjectList, ".psl-viz", "Rule",
//                                    "TotalSatisfaction", "SatDis");
// }


$( document ).ready(function() {
    d3.json("PSLVizData.json", function(data) {
      console.log(data);
      window.data = data;

      //Convert all ObjectID keys into ints
      var numKeys = d3.keys(data).length
      for (var i = 0; i < numKeys; i++){
        var key = d3.keys(data)[i];
        if (!isNaN(key)) {
          var data_copy = data[key];
          data[parseInt(key)] = data_copy;
          delete data[key];
        }
      }

      const tableIdList = []
      createTruthTable(data, tableIdList);
      createViolationTable(data, tableIdList);

      //Make each of our tables a tablesorter instance via their chartId
      tableIdList.forEach(function(id) {
        $(`#${id}`).tablesorter();
      });

      // var satDisChart = createDissatisfactionChart(data);
      var satDisChart = createBarChart(data["SatDis"], ".psl-viz", "Rule",
                                       "Total Satisfaction", "SatDis");
      document.getElementById(satDisChart.menuId).onchange = function () {
        updateBarChart(satDisChart);
      }
      var ruleCountChart = createBarChart(data["RuleCount"], ".psl-viz", "Rule",
                                          "Count", "RuleCount");
  });
});

//TODO: An overall js file that creates an initilize that is passed in data then
// hand off that data to the proper functions
