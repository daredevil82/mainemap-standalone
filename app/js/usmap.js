/*
    File:   usmap.js
    Author: Jason Johns
    Date:   1-14-2014
    Desc:   Render map of paths input from specified JSON file and handle user interactions
*/

$(document).ready(function(){

    var defaults = new Defaults(),
        g,
        projection,
        path,
        zoom, 
        maineSvg,
        tooltip,
        data,
        pop;

    var url = "",
    button = -1;

    init();

    function init(){

        //  initialize projection with default scale. 
        //  Available projections: 
        //      Mercator, Transverse Mercator, Albers, Albers-USA, 
        //      Azimuthal (Equal Area, Equidistant),
        //      Conic (Conformal, Equal Area, Equal Distant), 
        //      EquiRectangular, Gnomonic, Orthographic, Stereographic
        //
        //  See details at https://github.com/mbostock/d3/wiki/Geo-Projections  
        projection = d3.geo.mercator()
                        .scale(5500)
                        .translate([0, 0])
                        .center([-71.8, 47.5])
                        .precision(0);

        //create a geographic path generator with the specified projection
        path = d3.geo.path()
                    .projection(projection);

        //define zoom behavior and set limit of [1, 3]
        zoom = d3.behavior.zoom()
                    .scaleExtent([1, 3])
                    .on("zoom", zoom);

        //initialize map element maineSvg with basic attribute settings
        maineSvg = createSvg("map_container", defaults.getWidth(), defaults.getHeight()); 

        //set the background rectangle
        countrySvg = createSvg("country_container", 1200, 800);

        //initialize tooltip overlay element and bind to body element
        tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip");

        //add div to overlay
        tooltip.append("div")
            .attr("id", "countyName");

        //add template html to overlay
        $("#countyName").append(defaults.defaultTooltipTemplate());    

        //Get path data and draw maineSvg
        d3.json(defaults.getUrls().maine, function(e, map){ 
            generateMap(e, map, maineSvg);           
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

    function createSvg(elemName, width, height){
        var svg =  d3.select("#" + elemName)
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("transform", "translate(-5, -5)")
                        .call(zoom);   

        svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height);

        return svg;
    }

    function generateMap(e, map, svg){
        g = svg.append("g"); //initialze new g element as a child of svg elem

        g.append("g")                       //append a new g layer
            .attr("class", "counties")      //layer id
            .selectAll("path")              //select all paths
            .data(map.features)             //set the map paths as a relational join https://github.com/mbostock/d3/wiki/Selections#data
            .enter()                        //returns placeholder nodes for each data element for which no DOM node was found
            .append("path")                 //create new path element
            .attr("d", path)                //add coordinate-to-pixel data to path
            .attr("class", function(d){     //set the county name as a DOM class value
                return d.properties.name;
            })
            .on("mouseover", showTooltip)   //mouseover event handler, show the tooltip
            .on("mousemove", updateTooltip) //have tooltip follow mouse within boundaries of current county path
            .on("mouseout", hideTooltip);   //hide the tooltip
    }

});