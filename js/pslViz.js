// TODO(eriq): Enable after violations are fixed.
// 'use strict';

window.pslviz = window.pslviz || {};

const BAR_CHART_MARGIN = {
    top: 20,
    right: 10,
    bottom: 50,
    left: 80
};

// TODO(eriq): Dynamic sizes.
const BAR_CHART_COL_WIDTH = 100;
const BAR_CHART_HEIGHT = 400;
const BAR_CHART_TRANSITION_DURATION = 1000;

const DIV_NAME = ".psl-viz";
const DIV_CLASS = "viz-module";

const NAVBAR_MODEL_CONTEXT_CHANGER = "navbar-model-context";
const NAVBAR_GROUND_ATOM_CONTEXT_CHANGER = "navbar-ground-atom-context";
const NAVBAR_GROUND_RULE_CONTEXT_CHANGER = "navbar-ground-rule-context";
const RULE_OVERVIEW_MODULE = "module-overview-table";
const RULE_OVERVIEW_TABLE_TITLE = "Rule Overview";
const TRUTH_TABLE_MODULE = "module-truth-table";
const TRUTH_TABLE_TITLE = "Truth Table";
const VIOLATED_GROUND_RULES_MODULE = "module-violation-table";
const VIOLATED_GROUND_RULES_TABLE_TITLE = "Violated Constraints";
const GROUND_ATOM_SATISFACTION_MODULE = "module-ground-atom-compatability-chart";
const GROUND_ATOM_RULES_MODULE = "module-associated-rules-table";
const ASSOCIATED_GROUND_RULES_TABLE_TITLE = "Associated Ground Rules";
const INDIVIDUAL_GROUND_RULE_MODULE = "module-individual-ground-rule-table";
const RULE_COUNT_MODULE = "module-rulecount-chart";
const RULE_COUNT_Y_LABEL = "Count";
const RULE_COUNT_CHART_TITLE = "Ground Rule Count";
const RULE_SATISFACTION_MODULE = "module-compatability-chart";
const RULE_SATISFACTION_CHART_TITLE = "Rule Compatability";
const DEF_BAR_CHART_X_LABEL = "Rule";
const DEF_SATISFACTION_Y_LABEL = "Total Satisfaction";
const SATISFACTION_Y_LABELS = [
    "Total Satisfaction",
    "Mean Satisfaction",
    "Total Dissatisfaction",
    "Mean Dissatisfaction"
];

// Regular expressions to clean rules.
const RULE_STRING_REPLACEMENTS = [
    // [pattern, replacement].

    // "+ -1.0" -> "-1.0"
    [/\+ -(\d+\.\d+)/g, "- $1"],

    // "1.0 * A" -> "A"
    [/1\.0 \*/g, ""],

    // "~( Foo(A, B) )" -> "!Foo(A, B)"
    [/~\( ([^)]+\)) \)/g, "!$1"],

    // ^"( ... ) >> Foo(A, B)" -> "... ) >> Foo(A, B)"
    [/^\( /, ""],

    // "... ) >> Foo(A, B)" -> "... >> Foo(A, B)"
    [/ \) (>>)/, " $1"],

    // ">>" -> "→"
    [/>>/, "→"],

    // " )"$ -> ""
    [/ \)$/, ""],
];

// Regular expressions to clean ground rules.
const GROUND_RULE_STRING_REPLACEMENTS = [
    // [pattern, replacement].

    // "& ('123' != '432')" -> ""
    // "('123' != '432') &" -> ""
    [/(\('[^']+' != '[^']+'\) & )|( & \('[^']+' != '[^']+'\))/g, ""],
];

function updateBarChart(chart, data, newYVal) {
    chart.yAxisLabel = newYVal;
    transformBarChart(chart, data);
}

function transformBarChart(chart, barData) {
    let data = [];
    for (let i = 1; i < barData.length + 1; i++) {
        data.push({
            'ruleNo': barData[i-1]["ID"],
            'value': barData[i-1][chart.yAxisLabel],
        });
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
        .attr("height", function(row) { return chart.innerHeight - chart.yScale(row.value); });
}

function createBarChart(chartData, div, xAxisLabel, yAxisLabel, chartId) {
    let data = [];
    for (let i = 1; i < chartData.length + 1; i++) {
        data.push({
            'ruleNo': chartData[i - 1]["ID"],
            'value': chartData[i - 1][yAxisLabel],
        });
    }

    const outterWidth = data.length * BAR_CHART_COL_WIDTH;
    const outterHeight = BAR_CHART_HEIGHT;

    // The dimensions inside the margins.
    const innerWidth = outterWidth - BAR_CHART_MARGIN.left - BAR_CHART_MARGIN.right;
    const innerHeight = outterHeight - BAR_CHART_MARGIN.top - BAR_CHART_MARGIN.bottom;

    let xScale = d3.scale.ordinal()
        .domain(data.map(function (d) { return d.ruleNo; }))
        .rangeBands([0, innerWidth], 0.2);

    let yScale = d3.scale.linear()
        .domain([0, d3.max(data, function (d) { return d.value; })])
        .range([innerHeight, 0]);

    let xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    let yAxis = d3.svg.axis().scale(yScale).orient("left");

    const svgTranslation = "translate(" + BAR_CHART_MARGIN.left + "," + BAR_CHART_MARGIN.top + ")";

    let svg = div.append("svg")
        .attr("width", outterWidth)
        .attr("height", outterHeight)
        .classed(chartId, true);

    let svgTransformed = svg.append("g")
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
    const xAxisLabelTranslation = "translate(" + (innerWidth / 2) + " ," + (innerHeight + BAR_CHART_MARGIN.bottom) + ")";

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

    let bars = svgTransformed.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(row) { return xScale(row.ruleNo); })
        .attr("width", xScale.rangeBand())
        .attr("y", function(row) { return yScale(row.value); })
        .attr("height", function(row) { return innerHeight - yScale(row.value); });

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

function createTable(data, columns, title, className) {
	let div = d3.select(DIV_NAME).append('div');
	div.classed(DIV_CLASS, true);
    div.classed(className, true);

    let titleDiv = div.append('div');
    titleDiv.attr('class', 'title');
    titleDiv.text(title);

    let tableDiv = div.append('div');
    tableDiv.classed('table-container', true);

	let table = tableDiv.append('table')
    .attr("class", "tablesorter")
    table.append("thead").append("tr");

    let headers = table.select("tr").selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function(d) { return d; });

	// create a row for each object in the data
	let rows = table.append("tbody").selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    // TODO: Right now this is how im handling two tables that require
    // different functionallity on row click. Perhaps this should be changed?
    if (className == GROUND_ATOM_RULES_MODULE) {
        rows.attr('data-rule', function (row) { return row.id; });
    } else if (className == TRUTH_TABLE_MODULE || INDIVIDUAL_GROUND_RULE_MODULE) {
        rows.attr('data-atom', function(atom) { return atom.id; });
    }

	// create a cell in each row for each column
	let cells = rows.selectAll('td')
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

// TODO(eriq): Clean up nav and hash.
function createNavBar() {
    let div = d3.select('.psl-viz').append('div');
    div.classed("navbar", true);

    // Add anchor points to the div
    let mydiv = document.getElementsByClassName("navbar")[0];
    let aTag = document.createElement('a');
    aTag.classList.add(NAVBAR_MODEL_CONTEXT_CHANGER);
    aTag.setAttribute('href',"#Model Context");
    aTag.innerText = "Model";
    mydiv.appendChild(aTag);

    /*
    // When the user scrolls the page, execute myFunction
    window.onscroll = function() {myFunction()};

    // Add the sticky class to the navbar when you reach its scroll position.
    // Remove "sticky" when you leave the scroll position
    function myFunction() {
        let navbar = document.getElementsByClassName("navbar")[0];
        let sticky = navbar.offsetTop;
        if (window.pageYOffset >= sticky) {
            navbar.classList.add("sticky")
        }
        else {
            navbar.classList.remove("sticky");
        }
    }
    */
}

function modelContextChangeHandler() {
    // Remove ground atom and ground rule modules.
    removeGroundAtomContext();
    removeGroundRuleContext();
}

function removeGroundRuleContext() {
    let groundRuleContextChanger = document.getElementsByClassName(NAVBAR_GROUND_RULE_CONTEXT_CHANGER);
    let groundRuleSatisfaction = document.getElementsByClassName(INDIVIDUAL_GROUND_RULE_MODULE);

    if (groundRuleContextChanger.length != 0) {
        groundRuleContextChanger[0].remove();
    }

    if (groundRuleSatisfaction.length != 0) {
        groundRuleSatisfaction[0].remove();
    }
}

function removeGroundAtomContext() {
    let groundAtomCompatability = document.getElementsByClassName(GROUND_ATOM_SATISFACTION_MODULE);
    let groundAtomAssociatedRules = document.getElementsByClassName(GROUND_ATOM_RULES_MODULE);
    let groundAtomContextChanger = document.getElementsByClassName(NAVBAR_GROUND_ATOM_CONTEXT_CHANGER);

    if (groundAtomCompatability.length != 0) {
        groundAtomCompatability[0].remove();
    }

    if (groundAtomAssociatedRules.length != 0) {
        groundAtomAssociatedRules[0].remove();
    }

    if (groundAtomContextChanger.length != 0) {
        groundAtomContextChanger[0].remove();
    }
}

// TODO: Better way to grab from JSON then what these functions do??
function createTruthTable(data) {
    // Find the correct data
    let truthObjectList = [];
    for (key in data["truthMap"]) {
        let truthObject = {
            "Prediction": data["groundAtoms"][key]["prediction"].toFixed(2),
            "Truth": data["truthMap"][key].toFixed(2),
            "Predicate": data["groundAtoms"][key]["text"],
            "Difference" : Math.abs(data["truthMap"][key] -
                    data["groundAtoms"][key]["prediction"]).toFixed(2),
            "id": key,
        };
        truthObjectList.push(truthObject);
    }

    // Create table
    const predictionTruthCols = ['Predicate', 'Prediction', 'Truth', 'Difference'];
    createTable(truthObjectList, predictionTruthCols, TRUTH_TABLE_TITLE, TRUTH_TABLE_MODULE);
}

function createViolationTable(data) {
    // Find the correct data
    let rulesObject = data["rules"];
    let groundRulesObject = data["groundRules"];
    let violationObjectList = [];
    for (ruleID in rulesObject) {
        if (rulesObject[ruleID]["weighted"] != false) {
            continue
        }

        for (groundRuleID in groundRulesObject) {
            if (groundRulesObject[groundRuleID]["ruleID"] == ruleID && groundRulesObject[groundRuleID]["dissatisfaction"] > 0) {
                let violationObject = {
                    //TODO: Constraints seem to never be in groundRules
                    "Violated Constraint": "",
                    "Dissatisfaction":
                        groundRulesObject[groundRuleID]["dissatisfaction"].toFixed(2)
                };
                violationObjectList.push(violationObject);
            }
        }
    }

    // Create table if there are violated constraints
    if (violationObjectList.length != 0) {
        const violatedGroundRulesCols = ['Violated Constraint', 'Dissatisfaction'];
        createTable(violationObjectList, violatedGroundRulesCols, VIOLATED_GROUND_RULES_TABLE_TITLE, VIOLATED_GROUND_RULES_MODULE);
    }
}

// Create a table that gives an overview for all rules
function createRuleOverviewTable(data) {
    // Bring Sat/Dis data to 2nd decimal place and gather all rule data
    let overviewData = [];
    for (let i = 0; i < data.length; i++) {
        let rule = data[i];
        let ruleData = {
            "ID" : rule["ID"],
            "Rule" : rule["cleanText"],
            "Weighted" : rule["Weighted"],
            "Count" : rule["Count"],
            "Total Dissatisfaction": rule["Total Dissatisfaction"].toFixed(2),
            "Mean Dissatisfaction": rule["Mean Dissatisfaction"].toFixed(2)
        }
        overviewData.push(ruleData);
    }

    const overviewCols = [
        "ID",
        "Rule",
        "Weighted",
        "Count",
        "Total Dissatisfaction",
        "Mean Dissatisfaction"
    ];

    createTable(overviewData, overviewCols, RULE_OVERVIEW_TABLE_TITLE, RULE_OVERVIEW_MODULE);
}

function createAssociatedGroundAtomsTable(data, groundAtomKeyString) {
    const groundAtom = parseInt(groundAtomKeyString);

    // Create associtated ground rules list
    let groundRuleObject = data["groundRules"];
    let associatedGroundRules = [];
    for (groundRuleID in groundRuleObject){
        if (groundRuleObject[groundRuleID]["groundAtoms"].includes(groundAtom)){
            associatedGroundRules.push(createGroundRule(data, groundRuleID))
        }
    }

    let tableTitle = data["groundAtoms"][groundAtom]["text"] + " " + ASSOCIATED_GROUND_RULES_TABLE_TITLE;
    const associatedGroundRuleCols = ["Ground Rule", "Dissatisfaction"];
    createTable(associatedGroundRules, associatedGroundRuleCols, tableTitle, GROUND_ATOM_RULES_MODULE);

    // Add tablesorter to this new table
    $(`.viz-module table.tablesorter`).tablesorter();

    // Add context watcher / updater to this table
    $('*[data-rule]').click(function() {
        updateGroundRuleContext(data, this.dataset.rule);
    });
}

function createIndividualGroundRuleTable(data, groundRuleKeyString) {
    // convert rule string id to int id
    const groundRuleID = parseInt(groundRuleKeyString);
    let groundAtomObject = data["groundAtoms"];
    let groundRule = data["groundRules"][groundRuleKeyString];

    let atomElementList = []
    for (let i = 0; i < groundRule["groundAtoms"].length; i++) {
        let atomID  = groundRule["groundAtoms"][i];
        let tableElem = {
            "Ground Atom" : groundAtomObject[atomID]["text"],
            "Truth Value" : groundAtomObject[atomID]["prediction"].toFixed(2),
            "id" : atomID
        }
        atomElementList.push(tableElem);
    }

    let tableTitle = createGroundRule(data, groundRuleID)["Ground Rule"];
    const atomCols = ["Ground Atom", "Truth Value"];
    createTable(atomElementList, atomCols, tableTitle, INDIVIDUAL_GROUND_RULE_MODULE);

    // Add tablesorter to this new table
    $(`.viz-module table.tablesorter`).tablesorter();

    // Set click handler for ground atoms in the ground rule
    $('*[data-atom]').click(function() {
        updateGroundAtomContext(data, this.dataset.atom);
    });

    // Insert Satisfaction value as a DOM element
    let individualGroundRuleTable = document.getElementsByClassName(INDIVIDUAL_GROUND_RULE_MODULE)[0];
    let containerDiv = individualGroundRuleTable.getElementsByClassName("table-container")[0];
    let aTag = document.createElement('a');
    aTag.innerText = "Rule Satisfaction: " + (1 - groundRule["dissatisfaction"]).toFixed(2);
    individualGroundRuleTable.insertBefore(aTag, containerDiv);
}

// TODO(eriq): This can probably be removed, looks like copy-pasta.
function exists(container, item) {
    let i = container.length;
    while (i >= 0) {
        if (item == container[i]) {
            return true;
        }
        i--;
    }

    return false;
}

// Compute the rule statistics for each ground rule, the aggregated
// statistics will be associated with the parent rule of each ground rule.
// If the function is given a Ground Atom, then the function only computes the
// aggregated statistics for each ground rule that contains the given ground atom.
function computeRuleData(data, groundAtom) {
    const rules = data["rules"];
    const groundRules = data["groundRules"];

    let totalGroundRules = 0;
    let satisfactionData = [];
    let ruleIdentifier = 1;

    for (rule in rules) {
        let totSat = 0;
        let totDis = 0;
        let ruleData = {};
        let groundRuleCount = 0;
        for (let groundRule in groundRules) {
            if (groundRules[groundRule]["ruleID"] != rule) {
                continue;
            }

            if (groundAtom == undefined) {
                totSat += 1 - groundRules[groundRule]["dissatisfaction"];
                totDis += groundRules[groundRule]["dissatisfaction"];
                groundRuleCount++;
            } else {
                const groundAtoms = groundRules[groundRule]["groundAtoms"];
                if (exists(groundAtoms, groundAtom)) {
                    totSat += 1.0 - groundRules[groundRule]["dissatisfaction"];
                    totDis += groundRules[groundRule]["dissatisfaction"];
                    groundRuleCount++;
                }
            }
        }

        satMean = (groundRuleCount != 0 ? (totSat/groundRuleCount):(0));
        disSatMean = (groundRuleCount != 0 ? (totDis/groundRuleCount):(0));
        ruleData = {
            "cleanText": rules[rule]["cleanText"],
            "ID" : ruleIdentifier,
            "Weighted" : rules[rule]["weighted"],
            "Count" : rules[rule]["count"],
            "Total Satisfaction": totSat,
            "Mean Satisfaction": satMean,
            "Total Dissatisfaction": totDis,
            "Mean Dissatisfaction": disSatMean
        };
        ruleIdentifier++;
        satisfactionData.push(ruleData);
    }

    return satisfactionData;
}

// Get the rule data needed for the Satisfaction module
function readSatisfactionData(data) {
    let ruleSatData = [];
    for (let i = 0; i < data.length; i++) {
        let rule = data[i];
        if (!rule["Weighted"]) {
            continue;
        }

        let ruleData = {
            "Rule" : rule["cleanText"],
            "ID" : rule["ID"],
            "Total Satisfaction": rule["Total Satisfaction"],
            "Mean Satisfaction": rule["Mean Satisfaction"],
            "Total Dissatisfaction": rule["Total Dissatisfaction"],
            "Mean Dissatisfaction": rule["Mean Dissatisfaction"]
        }
        ruleSatData.push(ruleData);
    }

    return ruleSatData;
}

// Get the rule data needed for the rule count module
function readRuleCountData(data) {
    let ruleCountData = [];
    for (let i = 0; i < data.length; i++) {
        let rule = data[i];
        let ruleData = {
            "Rule": rule["Rule"],
            "Count": rule["Count"],
            "ID" : rule["ID"]
        }
        ruleCountData.push(ruleData);
    }

    return ruleCountData;
}

function updateGroundAtomContext(data, groundAtomKeyString) {
    const groundAtom = parseInt(groundAtomKeyString);
    let satData = computeRuleData(data, groundAtom);
    let groundAtomSatData = readSatisfactionData(satData);

    removeGroundAtomContext();
    removeGroundRuleContext();

    // Grab navbar and update navbar with new atom context
    let navbar = document.getElementsByClassName("navbar")[0];
    let aTag = document.createElement('a');
    aTag.classList.add(NAVBAR_GROUND_ATOM_CONTEXT_CHANGER);
    aTag.setAttribute('href',"#Ground Atom Context");
    aTag.innerText = data["groundAtoms"][groundAtom]["text"];
    aTag.onclick = function() {
        removeGroundRuleContext();
    };
    navbar.appendChild(aTag);

    // Create new associated ground rules table
    createAssociatedGroundAtomsTable(data, groundAtomKeyString)

    // Create Compatibility Chart with Ground Atom Context
    let barChartTitle = data["groundAtoms"][groundAtom]["text"] + " " + RULE_SATISFACTION_CHART_TITLE;
    setupBarChartModule(groundAtomSatData, DEF_BAR_CHART_X_LABEL,
            DEF_SATISFACTION_Y_LABEL, SATISFACTION_Y_LABELS,
            GROUND_ATOM_SATISFACTION_MODULE, barChartTitle);
}

function updateGroundRuleContext(data, groundRuleKeyString) {
    removeGroundRuleContext();

    // Grab navbar and update navbar with new rule context
    let navbar = document.getElementsByClassName("navbar")[0];
    let aTag = document.createElement('a');
    aTag.classList.add(NAVBAR_GROUND_RULE_CONTEXT_CHANGER);
    aTag.setAttribute('href',"#Ground Rule Context");
    aTag.innerText = createGroundRule(data, groundRuleKeyString)["Ground Rule"];
    navbar.appendChild(aTag);

    // Create new individual ground rule
    createIndividualGroundRuleTable(data, groundRuleKeyString);
}

function createMenu(options, defaultValue, moduleName, div) {
    const menuId = moduleName + "-menu";
    let select = div.append("select");
    select.classed(menuId, true);

    let menu = document.getElementsByClassName(menuId)[0];
    for (let index = 0; index < options.length; index++) {
        let menuOption = document.createElement("option");
        menuOption.text = options[index];
        menu.options.add(menuOption);
        if (options[index] == defaultValue) {
            menu.options.selectedIndex = index;
        }
    }

    return menuId;
}

function setupBarChartModule(data, xAxisLabel, yAxisLabel, menuOptions, className, title) {
    let oldModule = document.getElementsByClassName(className);
    if (oldModule.length != 0) {
        oldModule[0].remove();
    }

    let div = d3.select(DIV_NAME).append("div");
    div.classed(DIV_CLASS, true);

    div.classed(className, true);
    let titleDiv = div.append('div');
    titleDiv.attr('class', 'title');
    titleDiv.text(title);

    let menuId = undefined;
    if (menuOptions != undefined) {
        menuId = createMenu(menuOptions, yAxisLabel, className, div);
    }

    let chart = createBarChart(data, div, xAxisLabel, yAxisLabel, className);
    if (menuId != undefined) {
        document.getElementsByClassName(menuId)[0].onchange = function () {
            let newVal = document.getElementsByClassName(menuId)[0].value;
            updateBarChart(chart, data, newVal);
        };
    }
}

function cleanRuleString(ruleText) {
    RULE_STRING_REPLACEMENTS.forEach(function(replacementInfo) {
        ruleText = ruleText.replace(replacementInfo[0], replacementInfo[1]);
    });

    return ruleText;
}

function cleanGroundRuleString(ruleText) {
    GROUND_RULE_STRING_REPLACEMENTS.forEach(function(replacementInfo) {
        ruleText = ruleText.replace(replacementInfo[0], replacementInfo[1]);
    });

    return ruleText;
}

// Given data and ground rule ID returns the rule in non-DNF form
function createGroundRule(data, groundRuleID) {
    let groundRuleObject = data["groundRules"][groundRuleID];
    let parentRule = data["rules"][groundRuleObject["ruleID"]]["cleanText"];

    // Create patterns to find predicate / constants and label to be placed
    // on them.
    let predicatePattern = new RegExp("\\w+\\s*\\(","g");
    let constantPattern = new RegExp("\\'\\w+\\'", "g");
    let nonVariableLabel = "__0_";

    // Find all instances of predicates and constants in the parent rule
    let predicates = [...parentRule.matchAll(predicatePattern)];
    let constants = [...parentRule.matchAll(constantPattern)];

    // Collect indicies for all predicates and constants so we can label them
    let indicies = []
    for (let i = 0; i < predicates.length; i++) {
        indicies.push(predicates[i].index);
    }

    for (let i = 0; i < constants.length; i++) {
        indicies.push(constants[i].index + 1)
    }

    // Sort in descending order so we can place labels with collected indicies
    indicies = indicies.sort((a, b) => b - a);

    // Apply the labels to a copy of the parent rule
    let createdGroundRule = parentRule;
    for (let i = 0; i < indicies.length; i++) {
        let index = indicies[i];
        createdGroundRule = createdGroundRule.slice(0, index) + nonVariableLabel + createdGroundRule.slice(index);
    }

    // Replace all variables in the labeled parent rule
    let varConstList = Object.entries(groundRuleObject["constants"]);
    for (let [variable, constant] of varConstList) {
        let re = new RegExp("\\b"+variable+"\\b","g");
        // Add surrounding single quotes to variables
        constant = "\'" + constant + "\'";
        createdGroundRule = createdGroundRule.replace(re, constant);
    }

    // Get rid of all labels
    let replaceLabelsPattern = new RegExp(nonVariableLabel, "g");
    createdGroundRule = createdGroundRule.replace(replaceLabelsPattern, "");

    return {
        "Ground Rule" : cleanGroundRuleString(createdGroundRule),
        "Dissatisfaction" : groundRuleObject["dissatisfaction"].toFixed(2),
        "id" : groundRuleID
    };
}

// Sets up the visualization itself:
// Given a data file creates respective tables, charts, context handlers, etc.
function init(data) {
    indexData(data);

    // Save the data for debugging.
    window.pslviz.data = data;

    // clear psl-viz DOM element for visualization
    const baseNode = document.getElementsByClassName("psl-viz")[0];
    while (baseNode.firstChild) {
        baseNode.removeChild(baseNode.lastChild);
    }

    // Change footer style so that it stays at bottom of page.
    let footer = document.querySelector(".site-footer");
    footer.style["position"] = "relative";

    // Create the context navigation bar
    createNavBar()
    $("." + NAVBAR_MODEL_CONTEXT_CHANGER).click(function() {
        modelContextChangeHandler();
    });

    // Compute all needed rule data and put into one object;
    let overallRuleData = computeRuleData(data, undefined);

    createTruthTable(data);
    createViolationTable(data);
    createRuleOverviewTable(overallRuleData);

    // Make each of our tables a tablesorter instance.
    $(`.viz-module table.tablesorter`).tablesorter();

    // Satisfaction Module
    let satData = readSatisfactionData(overallRuleData);
    setupBarChartModule(satData, DEF_BAR_CHART_X_LABEL,
            DEF_SATISFACTION_Y_LABEL, SATISFACTION_Y_LABELS,
            RULE_SATISFACTION_MODULE, RULE_SATISFACTION_CHART_TITLE);

    // Rule Count Module
    let ruleCountData = readRuleCountData(overallRuleData);
    setupBarChartModule(ruleCountData, DEF_BAR_CHART_X_LABEL,
            RULE_COUNT_Y_LABEL, undefined, RULE_COUNT_MODULE,
            RULE_COUNT_CHART_TITLE);

    // Set context handlers.
    $('*[data-atom]').click(function() {
        updateGroundAtomContext(data, this.dataset.atom);
    });
}

// Go through the data and pre-compute whatever we can.
function indexData(data) {
    for (let ruleID in data.rules) {
        data.rules[ruleID].cleanText = cleanRuleString(data.rules[ruleID].text);
    }

    return data;
}

// Read the file in the file selector and load up the main UI.
function handleDataFile() {
    let reader = new FileReader();
    reader.onload = function(event) {
        let text = event.target.result;
        let json = JSON.parse(text);
        init(json);
    }

    reader.readAsText(this.files[0]);
}

$(document).ready(function() {
    // Watch the file selector for a new data file.
    let input = document.querySelector('.psl-viz .psl-data-input');
    input.addEventListener("change", handleDataFile, false);
});
