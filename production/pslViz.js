function show_hist(hist_data, xVal, yVal, moduleName) {

  var data = [];

  var div = d3.select(".psl-viz").append("div");
  div.classed("viz-module", true);

  // Add drop down menu to customize y-axis
  var dropDown = div.append("select")
                      .attr("id", moduleName + "-drop-down");

  var menu = document.getElementById(moduleName + "-drop-down");
  var index = 0;
  for ( var label in hist_data[0] ) {
    if ( label != xVal ) {
      var option = document.createElement("option");
      option.text = label;
      menu.options.add(option);
      if ( label == yVal ) {
        menu.options.selectedIndex = index;
      }
      index++;
    }
  }

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

  console.log(isScrollDisplayed)
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

    // 	  rects.attr("transform", function(d) { return "translate(" + xscale(d.label) + ",0)"; })

      rects.enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return xscale(d.label); })
            .attr("y", function (d) { return yscale(d.value); })
            .attr("width", xscale.rangeBand())
            .attr("height", function (d) { return height - yscale(d.value); });

      rects.exit().remove();
  };
}

function tabulate(data, columns) {
	var div = d3.select('.psl-viz').append('div');
	div.classed("viz-module", true);

	var table = div.append('table');
	var thead = table.append('thead');
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

$( document ).ready(function() {
    d3.json("PSLVizData.json", function(data) {
      console.log(data["PredictionTruth"])
      tabulate(data["PredictionTruth"], ['Predicate', 'Prediction','Truth']);
      show_hist(data["SatDis"], "Rule", "Total Satisfaction", "SatDis");
      show_hist(data["RuleCount"], "Rule", "Count", "RuleCount");
  });
});

//TODO: An overall js file that creates an initilize that is passed in data then hand off that data to the proper functions
