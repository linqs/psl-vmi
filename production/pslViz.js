function createMenu(name, dropOptions, func) {
    var menu = document.getElementById(name);

    for (var i = 0; i < dropOptions.length; i++) {
        var option = document.createElement("option");
        option.text = dropOptions[i];
        menu.options.add(option);
    }

    menu.onchange = function(d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value")
      // run the updateChart function with this selected option
      func(selectedOption)
   };

   return menu;
}

function createGraph( hist_data, xVal, yVal, sortOptions, displayOptions, moduleName) {

  var div = d3.select(".psl-viz").append("div");
  div.classed("viz-module", true);

  var sortDropDown = div.append("select")
                      .attr("id", moduleName + "-sort-drop-down");

  var displayDropDown = div.append("select")
                      .attr("id", moduleName + "-display-drop-down");

  function updateSort(selectedGroup) {
    console.log(selectedGroup);
  }

  function updateDisplay(selectedGroup) {
    console.log(selectedGroup);
  }

  var menuSort = createMenu(moduleName + "-sort-drop-down", sortOptions, updateSort);
  var menuDisplay = createMenu(moduleName + "-display-drop-down", displayOptions, updateDisplay);

  // console.log( yVal );
  data = [];
  for (var i = 0; i < hist_data.length; i++) {
    var datum = {};
    datum.label = hist_data[i][xVal];
    datum.value = hist_data[i][yVal];
    data.push(datum);
  }

  var margin =  {top: 20, right: 10, bottom: 20, left: 40};
  var marginOverview = {top: 30, right: 10, bottom: 20, left: 40};
  var selectorHeight = 40;
  var width = 1500 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom - selectorHeight;
  var heightOverview = 80 - marginOverview.top - marginOverview.bottom;

  var maxLength = d3.max(data.map(function(d){ return d.label.length}))
  var barWidth = maxLength * 7;
  var numBars = Math.round(width/barWidth);
  var isScrollDisplayed = barWidth * data.length > width;

  // Sort in ascending order
  data.sort(function (a,b) {return a.value - b.value});

  var xscale = d3.scale.ordinal()
                  .domain(data.slice(0,numBars).map(function (d) { return d.label; }))
                  .rangeBands([0, width], .2);

  var yscale = d3.scale.linear()
                  .domain([0, d3.max(data, function (d) { return d.value; })])
                  .range([height, 0]);

  var xAxis  = d3.svg.axis().scale(xscale).orient("bottom");
  var yAxis  = d3.svg.axis().scale(yscale).orient("left");

  var svg = div.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom + selectorHeight);

  var diagram = svg.append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  diagram.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0, " + height + ")")
          .call(xAxis);

  diagram.append("g")
          .attr("class", "y axis")
          .call(yAxis);

  var bars = diagram.append("g");

  bars.selectAll("rect")
              .data(data.slice(0, numBars), function (d) {return d.label; })
              .enter().append("rect")
              .attr("class", "bar")
              .attr("x", function (d) { return xscale(d.label); })
              .attr("y", function (d) { return yscale(d.value); })
              .attr("width", xscale.rangeBand())
              .attr("height", function (d) { return height - yscale(d.value); });

  if (isScrollDisplayed)
  {
    var xOverview = d3.scale.ordinal()
                       .domain(data.map(function (d) { return d.label; }))
                       .rangeBands([0, width], .2);
    yOverview = d3.scale.linear().range([heightOverview, 0]);
    yOverview.domain(yscale.domain());

    var subBars = diagram.selectAll('.subBar')
                          .data(data)

    subBars.enter().append("rect")
                    .classed('subBar', true)
                    .attr({
                        height: function(d) {
                          return heightOverview - yOverview(d.value);
                      },
                        width: function(d) {
                          return xOverview.rangeBand()
                      },
                        x: function(d) {
                          return xOverview(d.label);
                      },
                        y: function(d) {
                          return height + heightOverview + yOverview(d.value)
                      }
                    });

    var displayed = d3.scale.quantize()
                        .domain([0, width])
                        .range(d3.range(data.length));

    diagram.append("rect")
              .attr("transform", "translate(0, " + (height + margin.bottom) + ")")
              .attr("class", "mover")
              .attr("x", 0)
              .attr("y", 0)
              .attr("height", selectorHeight)
              .attr("width", Math.round(parseFloat(numBars * width)/data.length))
              .attr("pointer-events", "all")
              .attr("cursor", "ew-resize")
              .call(d3.behavior.drag().on("drag", display));
  }
  function display () {
      var x = parseInt(d3.select(this).attr("x")),
          nx = x + d3.event.dx,
          w = parseInt(d3.select(this).attr("width")),
          f, nf, new_data, rects;

      if ( nx < 0 || nx + w > width ) return;

      d3.select(this).attr("x", nx);

      f = displayed(x);
      nf = displayed(nx);

      if ( f === nf ) return;

      new_data = data.slice(nf, nf + numBars);

      xscale.domain(new_data.map(function (d) { return d.label; }));
      diagram.select(".x.axis").call(xAxis);

      rects = bars.selectAll("rect")
                    .data(new_data, function (d) {return d.label; });

      rects.attr("x", function (d) { return xscale(d.label); });

    //    rects.attr("transform", function(d) { return "translate(" + xscale(d.label) + ",0)"; })

      rects.enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return xscale(d.label); })
            .attr("y", function (d) { return yscale(d.value); })
            .attr("width", xscale.rangeBand())
            .attr("height", function (d) { return height - yscale(d.value); });

      rects.exit().remove();
  };
}

function tabulate(data, columns, sortOptions, sortTarget, moduleName) {

	var div = d3.select('.psl-viz').append('div');
	div.classed("viz-module", true);

  var dropDown = div.append("select")
                      .attr("id", moduleName + "-drop-down");

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

  var menu = createMenu(moduleName + "-drop-down", sortOptions, update);

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

  return table;
}

$( document ).ready(function() {
  d3.json("PSLVizData.json", function(data) {
    // console.log(data["PredictionTruth"])

    var sortOptions = ["Ascending", "Descending"];
    tabulate(data["PredictionTruth"], ['Predicate', 'Prediction','Truth'], sortOptions, "Prediction", "PredictionTruth");
    tabulate(data["ViolatedGroundRules"], ['Violated Rule', 'Parent Rule', 'Weighted', 'Violation'], sortOptions, "Violation", "Violation");
    var displayOptions = Object.keys(data["SatDis"][0]);
    var index = displayOptions.indexOf("Rule");
    if (index !== -1) displayOptions.splice(index, 1);
    createGraph(data["SatDis"], "Rule", "Total Satisfaction", sortOptions, displayOptions, "SatDis");
    displayOptions = [];
    createGraph(data["RuleCount"], "Rule", "Count", sortOptions, displayOptions, "RuleCount");
  });
});

//TODO: An overall js file that creates an initilize that is passed in data then hand off that data to the proper functions
