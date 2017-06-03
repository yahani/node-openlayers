
var count = 0;

window.onload = function () {
    // Map views always need a projection.  Here we just want to map image
    // coordinates directly to map coordinates, so we create a projection that uses
    // the image extent in pixels.
    $('html').each(function () {

        $(this)[0].oncontextmenu = function () {
            return false;
        };
    });
    //context menu
    $(document).bind("mousedown", function (e)
    {
        // If the clicked element is not the menu
        if (!$(e.target).parents(".custom-menu").length > 0)
        {
            // Hide it
            $(".custom-menu").hide(100);
        }
    });

    var extent = [0, 0, 1024, 968];
    var projection = new ol.proj.Projection({
        code: 'xkcd-image',
        units: 'pixels',
        extent: extent
    });

    var map = new ol.Map({
        layers: [
            new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    url: 'images/online_communities.png',
                    projection: projection,
                    imageExtent: extent
                })
            })
        ],
        target: 'map',
        logo: false,
        controls: ol.control.defaults({
            attribution: false,
            zoom: false,
        }).extend([new ol.control.FullScreen()]),
        interactions: ol.interaction.defaults({doubleClickZoom: false, mouseWheelZoom: false, pinchZoom: false, dragPan: false}),
        view: new ol.View({
            projection: projection,
            center: ol.extent.getCenter(extent),
            zoom: 2,
            maxZoom: 8
        })
    });
    //create a new vector layer to work on
    var allAreasLayer = new ol.layer.Vector(
            {
                source: new ol.source.Vector({wrapX: false})
            });
    //add layer to the map
    map.addLayer(allAreasLayer);
    //load all polygon areas saved by other users onto the vector layer
    //currently reading data from a geojson file. need to use a database later
    var format = new ol.format.GeoJSON();
    var x = new XMLHttpRequest();

    x.onreadystatechange = function () {
        if (x.status === 200 && x.readyState === 4) {
            // Read features from geojson file
            console.log((x.responseText));
            var features = format.readFeatures(x.responseText);
            features.forEach(function (feature) {
                feature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#b28c4d',
                        width: 2
                    })
                }));
            });
            allAreasLayer.getSource().addFeatures(features);// add to the vector layer
        }
    }

    x.open('GET', '/userdata', true);
    x.send();

    var workspaces = {};
    //get 
    var y = new XMLHttpRequest();

    y.onreadystatechange = function () {
        if (y.status === 200 && y.readyState === 4) {
            // Read features from geojson file
            console.log("user shapes: " + (y.responseText));
            var features = format.readFeatures(y.responseText);
            features.forEach(function (feature) {
                var userid = feature.get("userid");
                var shapetype = feature.get("shapetype");
                var layer = workspaces[userid];
                if (count < userid) {
                    count = userid;
                }
                if (typeof layer === 'undefined') {
                    layer = new ol.layer.Vector(
                            {
                                source: new ol.source.Vector({wrapX: false})
                            });
                    workspaces[userid] = layer;
                    map.addLayer(layer);
                }
                if (shapetype === "Go") {
                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0,128,0, 0.9)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(0,128,0, 0.2)'//'rgba(0,128,0, 0.2)'
                        })
                    }));
                }
                else if (shapetype === "NoGo") {
                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,0,0, 0.2)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0, 0.2)'//'rgba(200, 200, 125, 0.2)'
                        })
                    }));
                }
                else if (shapetype === "SlowGo") {
                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0,0,255, 0.9)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(0,0,255, 0.2)'//'rgba(200, 200, 125, 0.2)'
                        })
                    }));
                }
                else {
                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#b28c4d',
                            width: 2
                        })
                    }));
                }
                layer.getSource().addFeature(feature);// add to the vector layer    
            });

        }
    }

    y.open('GET', '/usershapes', true);
    y.send();

    bindEvents(map, allAreasLayer, workspaces);
    $(".save").removeClass("buttonColor").addClass("disable-button");
    $(".save").attr('disabled', true)
	
	var client = new Tuio.Client({
		host: "http://localhost:3000"
	}),
	onAddTuioCursor = function(addCursor) {
            var $addCursor = $('<div class="tuioCursor"></div>');
                $("body").append($addCursor);
                cursors[addCursor.getCursorId()] = $addCursor;
                onUpdateTuioCursor(addCursor);
},

onUpdateTuioCursor = function(updateCursor) {
  console.log(updateCursor);
},

onRemoveTuioCursor = function(removeCursor) {
  console.log(removeCursor);
},

onAddTuioObject = function(addObject) {
    console.log(addObject);
},

onUpdateTuioObject = function(updateObject) {
    console.log(updateObject);
},

onRemoveTuioObject = function(removeObject) {
    console.log(removeObject);
},

onRefresh = function(time) {
  console.log(time);
};

client.on("addTuioCursor", onAddTuioCursor);
client.on("updateTuioCursor", onUpdateTuioCursor);
client.on("removeTuioCursor", onRemoveTuioCursor);
client.on("addTuioObject", onAddTuioObject);
client.on("updateTuioObject", onUpdateTuioObject);
client.on("removeTuioObject", onRemoveTuioObject);
client.on("refresh", onRefresh);
client.connect();
};

function getUserId(workspaces) {
    var layer = workspaces[count];
    while (typeof layer !== 'undefined') {
        layer = workspaces[++count];
    }
    return count;
}

function bindEvents(map, allAreasLayer, workspaces) {

    $(".save").click(function (evt) {
        if ($(".save").attr('disabled') === 'disabled') {
            return false;
        }
        //create a new interaction
        var format = new ol.format.GeoJSON();
        var str = format.writeFeatures(allAreasLayer.getSource().getFeatures());//TODO:save the shapes
        var x = new XMLHttpRequest();

        x.onreadystatechange = function () {
            if (x.status === 200 && x.readyState === 4) {
                // Optional callback for when request completes
                console.log(x.responseText);
            }
        }

        x.open('POST', '/saveuserdata', true);
        x.send(str);

        //save shapes saveusershapes
        for (var id in workspaces) {
            var layer = workspaces[id];
            var str = format.writeFeatures(layer.getSource().getFeatures());
            var y = new XMLHttpRequest();

            y.onreadystatechange = function () {
                if (y.status === 200 && y.readyState === 4) {
                    // Optional callback for when request completes
                    console.log(y.responseText);
                }
            }

            y.open('POST', '/saveusershapes', true);
            y.send(str);
        }


    });

    map.getViewport().addEventListener("contextmenu", function (event) {
        var obj = map.forEachFeatureAtPixel(map.getEventPixel(event),
                function (feature, layer)
                {
                    if (layer) {
                        return {feature: feature, layer: layer};
                    }
                });
        //display the menu
        if (obj) {
            var layer = obj.layer;
            $(".custom-menu").html("");
            var $customMenu = $(".custom-menu");
            var $gobutton = $.dynaButton({
                buttontext: "Go",
                action: function (e)
                {
                    //add go interaction
                    //create a new interaction
                    var interaction2 = new ol.interaction.Draw({
                        source: layer.getSource(),
                        type: /** @type {ol.geom.GeometryType} */ 'Polygon', //or LineString for unclosed shape
                        //freehand: true,
//                        style: new ol.style.Style({
//                            image: new ol.style.Circle({
//                                radius: 5,
//                                fill: new ol.style.Fill({
//                                    color: '#008000'
//                                })
//                            }),
//                            geometry: function (feature) {
//                                // return the coordinates of the first ring of the polygon
//                                var coordinates = feature.getGeometry().getCoordinates()[0];
//                                return new ol.geom.MultiPoint(coordinates);
//                            }
//                        }),
                        freehandCondition: function (evt) {
                            var coord = evt.coordinate;
                            var myArea = layer.getSource().getFeatures()[0];//area is the first feature of the layers feature collection
                            var y = myArea.getGeometry().intersectsCoordinate(coord);
                            map.getInteractions().getArray()
                            //console.log("go")
                            return ol.events.condition.noModifierKeys(evt) && y;
                        }
                    });

                    interaction2.on('drawend', function (event) {
                        var feature = event.feature;
                        feature.set('userid', layer.get('userid'));
                        feature.set('shapetype', "Go");
                        feature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: 'rgba(0,128,0, 0.9)',
                                width: 2
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(0,128,0, 0.2)'//'rgba(0,128,0, 0.2)'
                            })
                        }));
                        map.removeInteraction(interaction2);
                    });
                    //add interaction  to the map
                    map.addInteraction(interaction2);
                    $(".custom-menu").hide(100);
                }
            });
            var $nogobutton = $.dynaButton({
                buttontext: "No Go",
                action: function (e)
                {
                    //add go interaction
                    //create a new interaction
                    var interaction3 = new ol.interaction.Draw({
                        source: layer.getSource(),
                        type: /** @type {ol.geom.GeometryType} */ 'Polygon', //or LineString for unclosed shape
                        //freehand: true,
//                        style: new ol.style.Style({
//                            image: new ol.style.Circle({
//                                radius: 5,
//                                fill: new ol.style.Fill({
//                                    color: '#FF0000'
//                                })
//                            }),
//                            geometry: function (feature) {
//                                // return the coordinates of the first ring of the polygon
//                                var coordinates = feature.getGeometry().getCoordinates()[0];
//                                return new ol.geom.MultiPoint(coordinates);
//                            }
//                        }),
                        freehandCondition: function (evt) {
                            var coord = evt.coordinate;
                            var myArea = layer.getSource().getFeatures()[0];//area is the first feature of the layers feature collection
                            var y = myArea.getGeometry().intersectsCoordinate(coord);
                            //console.log("no go")
                            return ol.events.condition.noModifierKeys(evt) && y;
                        }
                    });

                    interaction3.on('drawend', function (event) {
                        var feature = event.feature;
                        feature.set('userid', layer.get('userid'));
                        feature.set('shapetype', "NoGo");
                        feature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: 'rgba(255,0,0, 0.2)',
                                width: 2
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255,0,0, 0.2)'//'rgba(200, 200, 125, 0.2)'
                            })
                        }));
                        map.removeInteraction(interaction3);
                    });
                    //add interaction  to the map
                    map.addInteraction(interaction3);
                    $(".custom-menu").hide(100);
                }
            });
            var $slowgobutton = $.dynaButton({
                buttontext: "Slow Go",
                action: function (e)
                {
                    //TODO: slow go implementation
                    //add go interaction
                    var interaction3 = new ol.interaction.Draw({
                        source: layer.getSource(),
                        type: /** @type {ol.geom.GeometryType} */ 'Polygon', //or LineString for unclosed shape
//                        style: new ol.style.Style({
//                            image: new ol.style.Circle({
//                                radius: 5,
//                                fill: new ol.style.Fill({
//                                    color: '#0000FF'
//                                })
//                            }),
//                            geometry: function (feature) {
//                                // return the coordinates of the first ring of the polygon
//                                var coordinates = feature.getGeometry().getCoordinates()[0];
//                                return new ol.geom.MultiPoint(coordinates);
//                            }
//                        }),
                        condition: function (evt) {
                            var coord = evt.coordinate;
                            var myArea = layer.getSource().getFeatures()[0];//area is the first feature of the layers feature collection
                            var y = myArea.getGeometry().intersectsCoordinate(coord);
                            return ol.events.condition.noModifierKeys(evt) && y;
                        }
                    });

                    interaction3.on('drawend', function (event) {
                        var feature = event.feature;
                        feature.set('userid', layer.get('userid'));
                        feature.set('shapetype', "SlowGo");
                        feature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: 'rgba(0,0,255, 0.9)',
                                width: 2
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(0,0,255, 0.2)'//'rgba(200, 200, 125, 0.2)'
                            })
                        }));
                        map.removeInteraction(interaction3);
                    });
                    //add interaction  to the map
                    map.addInteraction(interaction3);
                    $(".custom-menu").hide(100);
                }
            });
            $customMenu.append($gobutton).append($nogobutton).append($slowgobutton);
        }
        else {
            $(".custom-menu").html("");
            var $customMenu = $(".custom-menu");
            var $selectareabutton = $.dynaButton({
                buttontext: "SelectArea",
                action: function (e)
                {
                    //get user details from poiner data
                    //add go interaction
                    var myVectorLayer = new ol.layer.Vector(
                            {
                                source: new ol.source.Vector({wrapX: false})
                            });
                    //add layer to the map
                    map.addLayer(myVectorLayer);

                    //create a new interaction
                    var interaction1 = new ol.interaction.Draw({
                        source: myVectorLayer.getSource(),
                        type: /** @type {ol.geom.GeometryType} */ 'Polygon', //or LineString for unclosed shape
                        freehand: true
                    });

                    interaction1.on('drawstart', function () {
                        myVectorLayer.getSource().once('addfeature', function (evt) {
                            var drawnPolygon = evt.feature;
                            var polygonGeom = drawnPolygon.getGeometry();
                            var overlap = false;
                            var format = new ol.format.GeoJSON();

                            //loop through the featurs having intersecting extents
                            allAreasLayer.getSource().forEachFeatureIntersectingExtent(polygonGeom.getExtent(), function (feature) {
                                // use to turf.js to intersect each feature with drawn feature
                                var intersection = turf.intersect(
                                        format.writeFeatureObject(drawnPolygon),
                                        format.writeFeatureObject(feature));
                                if (intersection) {
                                    overlap = true;
                                }
                            });
                            if (overlap) {
                                //TODO: display error message
                                //remove invalid polygon
                                this.removeFeature(drawnPolygon);
                            }
                            else {
                                var id = getUserId(workspaces);
                                drawnPolygon.set("userid", id);
                                drawnPolygon.set("username", "user_" + id);
                                myVectorLayer.setExtent(drawnPolygon.getGeometry().getExtent());
                                myVectorLayer.set("userid", id);
                                myVectorLayer.set("username", "user_" + id);
                                workspaces[id] = myVectorLayer;
                                allAreasLayer.getSource().addFeature(drawnPolygon);
                                map.removeInteraction(interaction1);
                                //disable select area button
                                $(".save").removeClass("disable-button").addClass("buttonColor");
                                $(".save").attr('disabled', false)
                            }
                        });
                    });
                    interaction1.on('drawend', function (event) {
                        var feature = event.feature;
                        feature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#b28c4d',
                                width: 2
                            })
                        }));
                    });

                    //add interaction  to the map
                    map.addInteraction(interaction1);
                    $(".custom-menu").hide(100);
                }
            });
            $customMenu.append($selectareabutton);
        }
        $(".custom-menu").finish().toggle(100).css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });
    });
}

$.dynaButton = function (param)
{
    // Default options
    var settings = $.extend({
        background: ''
        , width: ''
        , height: ''
        , border: 'none'
        , position: 'relative'
    }, param);

    var $button = $('<li>');
    $button.css({
        width: settings.width
        , height: settings.height
        , background: settings.background
    });
    $button.text(settings.buttontext);
    $button.click(function ()
    {
        settings.action();
        return false;
    });

    return $button;

};



