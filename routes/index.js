var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require('path');

var pg = require("pg");
 
var conString = "postgres://postgres:postgres@127.0.0.1:5432/geodata";

/* GET map page. */
router.get('/', function (req, res) {
    res.render('map', {
        title: 'static-image'
    });
});

/*/saveuserdata: saved to a json file. TODO: save to a database */
router.post('/saveuserdata', function (req, res) {
    var body = [];
    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        var jsObj = JSON.parse(body);
        var features = jsObj["features"];
        features.forEach(function (feature) {
            var properties = feature["properties"];
            var userid = properties["userid"];
            var userName = properties["username"];
            var geometry = feature["geometry"];
            var client = new pg.Client(conString);
            client.connect();
            var queryText = 'INSERT INTO "allareas" (userId, userName, the_geom) values($1, $2, ST_GeomFromGeoJSON( $3)) RETURNING areaid'
            var query = client.query(queryText, [userid, userName, JSON.stringify(geometry)], function(err, result) {
                if(err){
                    console.log(err);
                } 
                else {
                    console.log(result.rows[0].id)
                    res.end('It Works!!');
                }
              });  
        });

//        var jsonPath = path.join(__dirname, '..', 'data', 'geojson.json');
//        fs.writeFile(jsonPath, body, function (err) {
//            if (err) {
//                return console.log(err);
//            }
//
//            console.log("The file was saved!");
//        });
//        res.end('It Works!!');
    });
});


/*/saveuserdata: saved to a json file. TODO: save to a database */
router.post('/saveusershapes', function (req, res) {
    var body = [];
    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        var jsObj = JSON.parse(body);
        var features = jsObj["features"];
        features.forEach(function (feature) {
            var properties = feature["properties"];
            var userid = properties["userid"];
            var shapetype = properties["shapetype"];
            var geometry = feature["geometry"];
            var client = new pg.Client(conString);
            client.connect();
            var queryText = 'INSERT INTO "allshapes" (userId, shapetype, the_geom) values($1, $2, ST_GeomFromGeoJSON( $3))'
            var query = client.query(queryText, [userid, shapetype, JSON.stringify(geometry)], function(err, result) {
                if(err){
                    console.log(err);
                } 
                else {
                    res.end('It Works!!');
                }
              });  
        });

//        var jsonPath = path.join(__dirname, '..', 'data', 'geojson.json');
//        fs.writeFile(jsonPath, body, function (err) {
//            if (err) {
//                return console.log(err);
//            }
//
//            console.log("The file was saved!");
//        });
//        res.end('It Works!!');
    });
});

/*/userdata: loaded from a json file. TODO: get from a database */
router.get('/userdata', function (req, res) {

    var client = new pg.Client(conString);
    client.connect();
    var query = client.query("SELECT row_to_json(fc) "
            + "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "
            + "FROM (SELECT 'Feature' As type "
                + ", ST_AsGeoJSON(lg.the_geom)::json As geometry "
                + ", row_to_json(lp) As properties "
                + "FROM allareas As lg "
                    + "INNER JOIN (SELECT areaid, userid, username FROM allareas) As lp "
                    + "ON lg.areaid = lp.areaid  ) As f )  As fc");
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
            res.send(result.rows[0].row_to_json);
            res.end();
        });
//    filePath = path.join(__dirname, '..', 'data', 'geojson.json');
//
//    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
//        if (!err) {
//            //console.log('received data: ' + data);
//            res.writeHead(200, { 'Content-Type': 'text/html' });
//            res.write(data);
//            res.end();
//        } else {
//            console.log(err);
//        }
//    });
});

/*/userdata: loaded from a json file. TODO: get from a database */
router.get('/usershapes', function (req, res) {

    var client = new pg.Client(conString);
    client.connect();
    var query = client.query("SELECT row_to_json(fc) "
            + "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "
            + "FROM (SELECT 'Feature' As type "
                + ", ST_AsGeoJSON(lg.the_geom)::json As geometry "
                + ", row_to_json(lp) As properties "
                + "FROM allshapes As lg "
                    + "INNER JOIN (SELECT shapeid, userid, shapetype FROM allshapes) As lp "
                    + "ON lg.shapeid = lp.shapeid  ) As f )  As fc");
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
            res.send(result.rows[0].row_to_json);
            res.end();
        });
//    filePath = path.join(__dirname, '..', 'data', 'geojson.json');
//
//    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
//        if (!err) {
//            //console.log('received data: ' + data);
//            res.writeHead(200, { 'Content-Type': 'text/html' });
//            res.write(data);
//            res.end();
//        } else {
//            console.log(err);
//        }
//    });
});
module.exports = router;

