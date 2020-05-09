const BAR_CHART_MARGIN = {
    top: 20,
    right: 10,
    bottom: 50,
    left: 80
};

const BAR_CHART_COL_WIDTH = 100;
const BAR_CHART_HEIGHT = 400;
const BAR_CHART_TRANSITION_DURATION = 1000;

const DIV_NAME = ".psl-viz";
const DIV_CLASS = "viz-module";

const GROUND_ATOM_CONTEXT_MODULE = "GroundAtom";
const GROUND_ATOM_SATISFACTION_MODULE = "GroundAtomSatisfaction"
const RULE_COUNT_MODULE = "RuleCount";
const RULE_COUNT_Y_LABEL = "Count";
const RULE_SATISFACTION_MODULE = "SatDis";
const DEF_BAR_CHART_X_LABEL = "Rule";
const DEF_SATISFACTION_Y_LABEL = "Total Satisfaction";
const SATISFACTION_Y_LABELS = [
    {"text": "Total Satisfaction",   "value": "Total Satisfaction"},
    {"text": "Mean Satisfaction",    "value": "Mean Satisfaction"},
    {"text": "Total Disatisfaction", "value": "Total Disatisfaction"},
    {"text": "Mean Disatisfaction",  "value": "Mean Disatisfaction"}
];

function updateBarChart(chart, data, menuId) {
    const yVal = document.getElementsByClassName(menuId)[0].value;
    console.log(yVal);

    // calling update
    chart.yAxisLabel = yVal;
    transformBarChart(chart, data);
}

function transformBarChart(chart, barData) {
    var data = [];
    for (var i = 1; i < barData.length+1; i++) {
        var datum = {};
        datum.type = chart.yAxisLabel;
        datum.ruleNo = barData[i-1]["ID"];
        datum.label = barData[i-1][chart.xAxisLabel];
        datum.value = barData[i-1][chart.yAxisLabel];
        data.push(datum);
    }

    // Redefine the scale for y axis
    chart.yScale.domain([0, d3.max(data, function(row) { return row.value })]);

    // Update the y-axis label
    chart.svg.transition().select(".y-label")
        .duration(BAR_CHART_TRANSITION_DURATION)
        .text(chart.yAxisLabel);

    // Update the call function so the new scale is used for the x and y axis

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

function createBarChart(chartData, div, xAxisLabel, yAxisLabel,
        chartId) {
    var data = [];
    for (var i = 1; i < chartData.length+1; i++) {
        var datum = {};
        datum.type = yAxisLabel;
        datum.ruleNo = chartData[i-1]["ID"];
        datum.label = chartData[i-1][xAxisLabel];
        datum.value = chartData[i-1][yAxisLabel];
        data.push(datum);
    }

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
        .attr("width", outterWidth)
        .attr("height", outterHeight);
    svg.classed(chartId, true);

    var svgTransformed = svg.append("g")
        .attr("transform", svgTranslation);

    // Y Axis Label
    svgTransformed.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (BAR_CHART_MARGIN.left / 1.25))
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "0.5em")
        .style("text-anchor", "middle")
        .text(yAxisLabel);

    // X Axis Label
    const xAxisLabelTranslation = "translate(" + (innerWidth / 2) + " ," +
        (innerHeight + BAR_CHART_MARGIN.bottom) + ")";
    svgTransformed.append("text")
        .attr("class", "x-label")
        .attr("transform", xAxisLabelTranslation)
        .style("text-anchor", "middle")
        .text(xAxisLabel);

    // X Axis
    svgTransformed.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end");

    // Y Axis
    svgTransformed.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "1em")
        .style("text-anchor", "end");

    var bars = svgTransformed.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(row) { return xScale(row.ruleNo); })
        .attr("width", xScale.rangeBand())
        .attr("y", function(row) { return yScale(row.value); })
        .attr("height", function(row) {
            const newHeight = innerHeight - yScale(row.value);
            if (newHeight == 0) {
                return 1;
            }
            return newHeight;
        })

    return {
        'id': chartId,
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

function createTable(data, columns, title) {
	var div = d3.select('.psl-viz').append('div');
	div.classed("viz-module", true);

    let titleDiv = div.append('div');
    titleDiv.attr('class', 'title');
    titleDiv.text(title);

    let tableDiv = div.append('div');
    tableDiv.classed('table-container', true);

	var table = tableDiv.append('table')
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
        .append('tr')
        .attr('data-atom', function(atom) { return atom.id; });

	// create a cell in each row for each column
	var cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {
                    column: column,
                    value: row[column],
                    id: row['id']
                };
            });
        })
        .enter()
        .append('td')
        .text(function(row) { return row.value; });

  return table;
}

// TODO: Better way to grab from JSON then what these functions do??
function createTruthTable(data) {
    // Find the correct data
    var truthObjectList = [];
    for (key in data["truthMap"]) {
        var truthObject = {
            "Prediction": data["groundAtoms"][key]["prediction"].toFixed(2),
            "Truth": data["truthMap"][key].toFixed(2),
            "Predicate": data["groundAtoms"][key]["text"],
            "Difference" : Math.abs(data["truthMap"][key] -
                data["groundAtoms"][key]["prediction"]).toFixed(2),
            "id": key,
        }
        truthObjectList.push(truthObject);
    }
    // Create table
    const predictionTruthCols = ['Predicate', 'Prediction','Truth',
        'Difference'];
    createTable(truthObjectList, predictionTruthCols, 'Truth Table');
}

function createViolationTable(data) {
    // Find the correct data
    var rulesObject = data["rules"];
    var groundRulesObject = data["groundRules"];
    var violationObjectList = [];
    for (ruleID in rulesObject) {
        if (rulesObject[ruleID]["weighted"] == false) {
            for (groundRuleID in groundRulesObject) {
                if (groundRulesObject[groundRuleID]["ruleID"] == ruleID) {
                    if (groundRulesObject[groundRuleID]["disatisfaction"] > 0) {
                        var violationObject = {
                            //TODO: Constraints seem to never be in groundRules
                            "Violated Constraint": "",
                            "Dissatisfaction":
                                groundRulesObject[groundRuleID]["disatisfaction"]
                        };
                        violationObjectList.push(violationObject);
                    }
                }
            }
        }
    }
    // Create table
    const violatedGroundRulesCols = ['Violated Constraint', 'Dissatisfaction'];
    createTable(violationObjectList, violatedGroundRulesCols,
        'Violated Constraints');
}

//Create a table that gives an overview for all rules
function createRuleOverviewTable(data) {
    //Bring Sat/Dis data to 2nd decimal place and gather all rule data
    var overviewData = [];
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];
        var ruleData = {
            "Rule" : rule["Rule"],
            "ID" : rule["ID"],
            "Weighted" : rule["Weighted"],
            "Count" : rule["Count"],
            "Total Disatisfaction": rule["Total Disatisfaction"].toFixed(2),
            "Mean Disatisfaction": rule["Mean Disatisfaction"].toFixed(2)
        }
        overviewData.push(ruleData);
    }
    const overviewCols = ["ID", "Rule", "Weighted", "Count",
        "Total Disatisfaction", "Mean Disatisfaction"];
    createTable(overviewData, overviewCols, "Rule Overview");
}

function exists(container, item) {
    var i = container.length;
    while ( i >= 0 ) {
        if ( item == container[i] ) {
            return true;
        }
        i--;
    }
    return false;
}

// Compute the rule statistics for each ground rule, the aggregated
// statistics will be associated with the parent rule of each ground rule.
// If the function is given a Ground Atom, then the function only computes the
// aggregated statistics for each ground rule that contains the given ground
// atom.
function computeRuleData(data, groundAtom) {
    const rules = data["rules"];
    const groundRules = data["groundRules"];
    var totalGroundRules = 0;
    var satisfactionData = [];
    var ruleIdentifier = 1;
    for ( rule in rules ) {
        var totSat = 0;
        var totDis = 0;
        var ruleData = {};
        var groundRuleCount = 0;
        for ( groundRule in groundRules ) {
            if ( groundRules[groundRule]["ruleID"] == rule ) {
                if ( groundAtom == undefined ) {
                    totSat += 1 - groundRules[groundRule]["disatisfaction"];
                    totDis += groundRules[groundRule]["disatisfaction"];
                    groundRuleCount++;
                }
                else {
                    const groundAtoms = groundRules[groundRule]["groundAtoms"];
                    if ( exists(groundAtoms, groundAtom) ) {
                        totSat += 1 - groundRules[groundRule]["disatisfaction"];
                        totDis += groundRules[groundRule]["disatisfaction"];
                        groundRuleCount++;
                    }
                }
            }
        }
        satMean = (groundRuleCount != 0 ? (totSat/groundRuleCount):(0));
        disSatMean = (groundRuleCount != 0 ? (totDis/groundRuleCount):(0));
        ruleData = {
            "Rule": rules[rule]["text"],
            "ID" : ruleIdentifier,
            "Weighted" : rules[rule]["weighted"],
            "Count" : rules[rule]["count"],
            "Total Satisfaction": totSat,
            "Mean Satisfaction": satMean,
            "Total Disatisfaction": totDis,
            "Mean Disatisfaction": disSatMean
        };
        ruleIdentifier++;
        satisfactionData.push(ruleData);
    }
    return satisfactionData;
}

// Get the rule data needed for the Satisfaction module
function readSatisfactionData(data) {
    var ruleSatData = [];
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];
        if (rule["Weighted"] == true) {
            var ruleData = {
                "Rule" : rule["Rule"],
                "ID" : rule["ID"],
                "Total Satisfaction": rule["Total Satisfaction"],
                "Mean Satisfaction": rule["Mean Satisfaction"],
                "Total Disatisfaction": rule["Total Disatisfaction"],
                "Mean Disatisfaction": rule["Mean Disatisfaction"]
            }
            ruleSatData.push(ruleData);
        }
    }
    return ruleSatData;
}

// Get the rule data needed for the rule count module
function readRuleCountData(data) {
    var ruleCountData = [];
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];
        var ruleData = {
            "Rule": rule["Rule"],
            "Count": rule["Count"],
            "ID" : rule["ID"]
        }
        ruleCountData.push(ruleData);
    }
    return ruleCountData;
}

function getGroundAtomOptions(data) {
    const groundAtoms = data["groundAtoms"];
    groundAtomOptions = [];
    for ( groundAtom in groundAtoms ) {
        var option = {
            "text": groundAtoms[groundAtom]["text"],
            "value": groundAtom
        };
        groundAtomOptions.push(option);
    }
    return groundAtomOptions;
}

function updateGroundAtomContext(data, groundAtomString, div) {
    const groundAtom = parseInt(groundAtomString);
    let SatData = computeRuleData(data, groundAtom);
    let groundAtomSatData = readSatisfactionData(SatData);
    console.log(groundAtomSatData);

    const oldChart = document.getElementsByClassName(window.groundAtomChart);
    const oldMenu = document.getElementsByClassName(window.groundAtomYLabelMenuId);
    if ( oldChart.length != 0 ) {
        oldChart[0].remove();
    }
    if ( oldMenu.length != 0 ) {
        oldMenu[0].remove();
    }

    const groundAtomYLabelMenuId = createMenu(SATISFACTION_Y_LABELS,
        DEF_SATISFACTION_Y_LABEL, GROUND_ATOM_SATISFACTION_MODULE, div);
    const groundAtomChart = createBarChart(groundAtomSatData, div,
        DEF_BAR_CHART_X_LABEL, DEF_SATISFACTION_Y_LABEL,
        GROUND_ATOM_SATISFACTION_MODULE);
    // Keep track of the Y-label menu and the ground atom chart so as the user
    // selects a new ground atom we delete the old bar chart and menu
    //
    // TODO: Investigate if we can observe this same task by using the old menu
    // to update with the newly constructed bar chart. The same menu is being
    // created everytime, how do we implement it so that the menu is created
    // once and the bar chart can change?
    window.groundAtomYLabelMenuId = groundAtomYLabelMenuId;
    window.groundAtomChart = groundAtomChart.id;
    var menu = document.getElementsByClassName(groundAtomYLabelMenuId)[0];
    menu.onchange = function() {
        updateBarChart(groundAtomChart, groundAtomSatData,
            groundAtomYLabelMenuId);
    };
}

function createMenu(options, defaultValue, moduleName, div) {
    const menuId = moduleName + "-menu";
    var select = div.append("select");
    select.classed(menuId, true);

    var menu = document.getElementsByClassName(menuId)[0];
    var index = 0;
    while ( index < options.length ) {
        var menuOption = document.createElement("option");
        menuOption.text = options[index].text;
        menuOption.value = options[index].value;
        menu.options.add(menuOption);
        if ( defaultValue != undefined && options[index] == defaultValue ) {
            menu.options.selectedIndex = index;
        }
        index++;
    }
    return menuId;
}

function setupBarChartModule(data, xAxisLabel, yAxisLabel, menuOptions,
        moduleName) {
    var div = d3.select(DIV_NAME).append("div");
    div.classed(DIV_CLASS, true);
    var menuId = undefined;
    if ( menuOptions != undefined ) {
        menuId = createMenu(menuOptions, yAxisLabel, moduleName, div);
    }
    var chart = createBarChart(data, div, xAxisLabel, yAxisLabel, moduleName);
    if ( menuId != undefined ) {
        document.getElementsByClassName(menuId)[0].onchange = function () {
            updateBarChart(chart, data, menuId);
        };
    }
}

function init(data) {
    console.log(data);

    // Convert all ObjectID keys into ints
    var numKeys = d3.keys(data).length
    for (var i = 0; i < numKeys; i++) {
        var key = d3.keys(data)[i];
        if (!isNaN(key)) {
            var data_copy = data[key];
            data[parseInt(key)] = data_copy;
            delete data[key];
        }
    }

    // Compute all needed rule data and put into one object;
    var overallRuleData = computeRuleData(data, undefined);

    createTruthTable(data);
    createViolationTable(data);
    createRuleOverviewTable(overallRuleData);

    // Make each of our tables a tablesorter instance.
    $(`.viz-module table.tablesorter`).tablesorter();

    // Satisfaction Module
    let satData = readSatisfactionData(overallRuleData);
    setupBarChartModule(satData, DEF_BAR_CHART_X_LABEL,
        DEF_SATISFACTION_Y_LABEL, SATISFACTION_Y_LABELS,
        RULE_SATISFACTION_MODULE);

    // Rule Count Module
    const ruleCountData = readRuleCountData(overallRuleData);
    setupBarChartModule(ruleCountData, DEF_BAR_CHART_X_LABEL,
        RULE_COUNT_Y_LABEL, undefined, RULE_COUNT_MODULE);

    // Ground Atom Context
    var groundAtomDiv = d3.select(DIV_NAME).append("div");
    groundAtomDiv.classed(DIV_CLASS, true);

    // Set context handlers.
    $('*[data-atom]').click(function() {
        console.log("Selected context atom: " + this.dataset.atom);
        updateGroundAtomContext(data, this.dataset.atom, groundAtomDiv);
    });
}

$(document).ready(function() {
    init(window.pslviz.data);
});
