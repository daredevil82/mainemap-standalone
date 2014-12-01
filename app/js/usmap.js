/*
    File:   usmap.js
    Author: Jason Johns
    Date:   1-14-2014
    Desc:   Render map of paths input from specified JSON file and handle user interactions
*/

$(document).ready(function(){

    var defaults = new Defaults(),
        q,
        projection,
        path,
        zoom, 
        svg,
        tooltip,
        cityTooltip,
        data,
        pop,
        default_tooltip = true,
        chloropleth_selected= false,
        density = false,
        jsonData = null;

    var url = "",
    button = -1;

    init();

    function init(){

        initElements();

        //initialize projection with default scale.  
        projection = d3.geo.mercator()
                        .scale(5500)
                        .translate([0, 0])
                        .center([-71.8, 47.5])
                        .precision(0);

        //set up the path attribute
        path = d3.geo.path()
                    .projection(projection);

        //define zoom behavior and set limit of [1, 10]
        zoom = d3.behavior.zoom()
                    .scaleExtent([1, 3])
                    .on("zoom", zoom);

        //initialize map element with basic attribute settings
        svg = d3.select("#map_container")
                    .append("svg")
                    .attr("width", defaults.getWidth())
                    .attr("height", defaults.getHeight())
                    .attr("transform", "translate(-5, -5)")
                    .call(zoom);

        d3.select("body")
            .on("keydown", keyHandler);

        svg.append("rect")
            .attr("class", "background")
            .attr("width", defaults.getWidth())
            .attr("height", defaults.getHeight());

        //initialize tooltip overlay
        tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 1e-6)
                    .style("background", "rgba(250, 250, 250, .7)");
        
        cityTooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 1e-6)
                        .style("background", "rgba(250, 250, 250, .7)");

        tooltip.append("div")
            .attr("id", "countyName");

        cityTooltip.append("div")
            .attr("id", "cityData");

        $("#countyName").append(defaults.defaultTooltipTemplate());
        $("#cityData").append(defaults.cityTooltip());

        d3.json(defaults.getUrls().maine, function(e, map){

            g = svg.append("g");

            g.append("g")
                .attr("class", "counties")
                .selectAll("path")
                .data(map.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", function(d){
                    return d.properties.name;
                })
                .on("mouseover", showTooltip)
                .on("mousemove", updateTooltip)
                .on("mouseout", hideTooltip)
                .on("contextmenu", rightClick)
                .on("click", mouseClick);
        });
            
        //handles the insertion of city points on the map
        d3.csv(defaults.getUrls().cities, function(e, map){
            g.selectAll("circle")
                .data(map)
                .enter()
                .append("circle")
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon,d.lat]) + ")";
                })
                .attr("r", 5)
                .style("fill", "red")
                .style("stroke", "black")
                .on("mouseover", showCityTooltip)
                .on("mouseout", hideCityTooltip);
        });
        
    }

    function keyHandler(d, i){
        if (d3.event.ctrlKey)
            console.log("control key pressed");
    }

    function mouseClick(d, i){
        console.log(d.properties.fips);

        $.ajax({
            url : "getCountyData/",
            type : "POST",
            data : {"fips" : d.properties.fips},
            dataType : "json",
            success : function(results){
                if (results.success == "true")
                    var data = JSON.parse(results.data);
                    console.log(data);
                    if ($("#county_data").hasClass("hide_element")){
                        $(".data_wrapper").addClass("hide_element");
                        $("#county_data").removeClass("hide_element").addClass("show_element");
                    }
            }

        })
    }

    function rightClick(d, i){
        d3.event.preventDefault();
        hideTooltip(d, i);
    }


    //Handles the slide event for the population slider
    function populationSliderHandler(year){
        $.ajax({
            url : "getCensusYearData",
            type : "POST",
            data : {"year" : year},
            dataType : "json",
            success : function(results){    
                if (results.success == "true"){
                    jsonData = {
                        "density" : JSON.parse(results.density),
                        "pop" : JSON.parse(results.pop)
                    };
                    renderValues();
                }
            }
        });
    }

    function showCityTooltip(d, i){
        cityTooltip.style("left", (d3.event.pageX - 25) + "px")
                .style("top", (d3.event.pageY + 40) + "px")
                .transition()
                .duration(300)
                .style("opacity", 1)
                //.style("background-color", "")
                .style("display", "block");

        $("#city_name").text(d.city);

        $(this).css({
            "stroke" :"#FF0000", 
            "stroke-width" : 1.5 + "px",
            "fill" : "#00FF00"
        });

    }

    function hideCityTooltip(d, i){
        cityTooltip.transition()
                .duration(200)
                .style("opacity", 0);

        $(this).css({
            "stroke" : "#000000", 
            "stroke-width" : 1.0 + "px",
            "fill" : "#FF0000"
        });
    }

    function updateTooltip(d, i){
        tooltip.style("left", (d3.event.pageX - 75) + "px")
                .style("top", (d3.event.pageY + 11) + "px");

    }

    //Shows the tooltip on mouseover of a county
    function showTooltip(d, i){
        tooltipText(d);
        tooltip.style("left", (d3.event.pageX - 75) + "px")
                .style("top", (d3.event.pageY + 11) + "px")
                .transition()
                .duration(300)
                .style("opacity", 1)
                .style("display", "block");

        $(this).css("stroke", "#FF0000")
                .css("stroke-width", 1.5 + "px");
    }

    function tooltipText(d){
        
        $("#county").text(d.properties.name);
        $("#fips").text(d.properties.fips);
        
        if ($(".extra_data").css("display") != "none"){
            $(".pop_year").text($("#slider_value").text());
            $("#county_population").text(jsonData.pop[d.properties.name]);
            $("#county_density").text(jsonData.density[d.properties.name]);
        }
        
    }

    //Hides the tooltip once the mouse pointer leaves the county
    function hideTooltip(d, i){
        tooltip.transition()
                .duration(200)
                .style("opacity", 0);

        $(this).css("stroke", "#000000")
                .css("stroke-width", 1.0 + "px");
    }

    //Handles the zoom and panning of the map element
    function zoom(){
        //console.log(d3.event.translate);
        g.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    }


    //Handle the initialization of jquery ui elements and event binding
    function initElements(){
        $("#map_selection, #county_data_selection").buttonset();

        $(".pop_button").click(function(){
            if ($("#population_slider_wrapper").hasClass("hide_element")) {
                $("#population_slider_wrapper").removeClass("hide_element").addClass("show_element");
                $(".extra_data").css("display", "block");
                mapColors();
            }
        });

        $(".data_button").click(function(){
            if ($("#county_data_display").hasClass("hide_element")){
                $("#county_data_display").removeClass("hide_element").addClass("show_element");
            }
        });


        $("#pop_data").click(function(){

            $(".data_type").text("Population");

        });

        $("#demo_data").click(function(){
            $(".data_type").text("Demographics");

        });

        $("#house_data").click(function(){
            $(".data_type").text("Housing");

        });

        $("#fam_data").click(function(){
            $(".data_type").text("Family");

        });


        $("#pop_hist_map").click(function(e){
            if (!chloropleth_selected) {
                
                default_tooltip = false, 
                density = false,
                chloropleth_selected = true,
                button = 1;
                
                mapColorValues("history", defaults.getDomain(1), null, null);
                populationSliderHandler($("#population_slider").slider("value"));
            }
        });

        $("#pop_dens_map").click(function(){
            if (!density){
                
                default_tooltip = false, 
                chloropleth_selected = false, 
                density = true,
                button = 2;

                mapColorValues("density", defaults.getDomain(2), null, null);
                populationSliderHandler($("#population_slider").slider("value"));
            }

        });

        $("#population_slider").slider({
            range : "max",
            min : 1790,
            max : 2000,
            value : 2000,
            step : 10,
            slide : function(e, u){
                $("#slider_value").text(u.value);
                populationSliderHandler(u.value);
            },
            create : function(e, u){
                $("#slider_value").text($(this).slider("value"));
            }
        });
    }

    //render the colors to the map by altering the fill and stroke values of the elements
    function renderValues(){
        var data = null;

        if (button == 1) {
            data = jsonData.pop;
        } else {
            data = jsonData.density;
        }
        
        var popDomain = defaults.getDomain(button);
        var scale = defaults.getScale(popDomain[0], popDomain[1], 9);
        var colors = defaults.getPopColors();

        for (key in data){
            if (data[key] == 0) {
                $("." + key).css("fill", "#FFFFFF")
                            .css("stroke", "#000000");

            } 
            else if (data[key] > scale[scale.length - 1]) {
                $("." + key).css("fill", colors[colors.length - 1])
                            .css("stroke", "#000000");
            }

            else {

                for (var i = 0; i < scale.length; i++){
                    if (data[key] <= scale[i]){
                        $("." + key).css("fill", colors[i + 1])
                                    .css("stroke", "#000000");
                        break;
                    }

                    else if (scale[i + i] !== undefined && data[key] > scale[i] && data[key] <= scale[i + 1]){
                        $("." + key).css("fill", colors[i + 2])
                                    .css("stroke", "#000000");
                        break;
                    }
                }
            }
        }
    }

    //create map color value boxes and fill them with color
    function mapColors(){
        var colors = defaults.getPopColors();
        var appendString = "";

        for (var i = 0; i < colors.length; i++)
            appendString += "<div class = 'chloropleth_boxes' id = 'chloropleth_" + i + "'>" + 
                            "<div class = 'box_label' id = 'box_" + i + "'></div></div>"

        $("#map_colors").append(appendString);

        for (var i = 0; i < colors.length; i++) 
            $("#chloropleth_" + i).css("background-color", colors[i]);
            
    }

    //set the color map values
    function mapColorValues(type, domain, prefix, suffix){
        var scale = defaults.getScale(domain[0], domain[1], 10);
        var colors = defaults.getPopColors().length;
        var append = "",
            prepend = "";

        if (suffix !== undefined || suffix !== null)
            append = suffix;

        if (prefix !== undefined || prefix !== null)
            prepend = prefix;

        for (var i = 0; i < colors; i++)
            $("#box_" + i).text(prepend + Math.floor(scale[i]) + append);
    }


});