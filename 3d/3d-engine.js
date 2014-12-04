"use strict"

var canv = document.getElementById('myCanvas');
var out = document.getElementById('out');
var modelSelect = document.getElementById('model');
var showNormals = document.getElementById('normals');
var showEdges = document.getElementById('showEdges');
var polyCount = document.getElementById('count');
var info = document.getElementById('info');
var rotX = document.getElementById('rotX');
var rotY = document.getElementById('rotY');
var rotZ = document.getElementById('rotZ');
var xRot = document.getElementById('xRot');
var yRot = document.getElementById('yRot');
var zRot = document.getElementById('zRot');

var identity = [[1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]];

var camera = [0, 0, canv.width/2];
var light = [1000,-500,1500];
var normalSize = 30.0;

var red = 127, green = 0, blue = 0;

var getRadians = function(degrees){
   return degrees * (Math.PI / 180);
};

var delay = function(){
   return parseInt(document.getElementById('delay').value);
};

var fill = function(){
   return document.getElementById('fill').checked;
};

var rotateMatrix = function(x,y,z){
   var output = identity.slice(0);

   x = getRadians(x);
   y = getRadians(y);
   z = getRadians(z);

   output[0][0] = Math.cos(y) * Math.cos(z);
   output[0][1] = -Math.cos(y) * Math.sin(z);
   output[0][2] = Math.sin(y);

   output[1][0] = (Math.cos(x) * Math.sin(z)) + (Math.sin(x) * Math.sin(y) * Math.cos(z));
   output[1][1] = (Math.cos(x) * Math.cos(z)) - (Math.sin(x) * Math.sin(y) * Math.sin(z));
   output[1][2] = -Math.sin(x) * Math.cos(y);

   output[2][0] = (Math.sin(x) * Math.sin(z)) - (Math.cos(x) * Math.sin(y) * Math.cos(z));
   output[2][1] = (Math.sin(x) * Math.cos(z)) + (Math.cos(x) * Math.sin(y) * Math.sin(z));
   output[2][2] = Math.cos(x) * Math.cos(y);

   return output;
};

var transform = function(points, matrix){
   var output = [];

   for(var v = 0; v < points.length; v++){
      output[v] = [];
      output[v][0] = (points[v][0] * matrix[0][0]) +
                     (points[v][1] * matrix[0][1]) +
                     (points[v][2] * matrix[0][2]);

      output[v][1] = (points[v][0] * matrix[1][0]) +
                     (points[v][1] * matrix[1][1]) +
                     (points[v][2] * matrix[1][2]);

      output[v][2] = (points[v][0] * matrix[2][0]) +
                     (points[v][1] * matrix[2][1]) +
                     (points[v][2] * matrix[2][2]);
   };

   return output;
};

var project = function(shape, scale){
   var output = [];
   var aspect = 1.0;

   scale = scale || 50;

   for(var v in shape){
      var vertex = shape[v];
      output[v] = [];

      var x = vertex[0];
      var y = vertex[1];
      var z = vertex[2];

      output[v][0] = scale * (vertex[0] + camera[0]) / (camera[2] - vertex[2]); // X
      output[v][1] = scale * (vertex[1] + camera[1]) / (camera[2] - vertex[2]); // Y
      output[v][2] = scale * vertex[2];
   }

   return output;
};

var normalise = function(v){
   var output = v.slice(0);

   // calculate vector magnitude
   var magnitude = Math.sqrt(output[0] * output[0] +
                             output[1] * output[1] +
                             output[2] * output[2]);

   // normalise vector;
   output[0] /= magnitude;
   output[1] /= magnitude;
   output[2] /= magnitude;

   return output;
};

var crossProduct = function(points, triangle){
   var v = [points[triangle[1]][0] - points[triangle[0]][0],
            points[triangle[1]][1] - points[triangle[0]][1],
            points[triangle[1]][2] - points[triangle[0]][2]];

   var w = [points[triangle[2]][0] - points[triangle[0]][0],
            points[triangle[2]][1] - points[triangle[0]][1],
            points[triangle[2]][2] - points[triangle[0]][2]];

   var normal = [(v[1] * w[2]) - (v[2] * w[1]),
                 (v[2] * w[0]) - (v[0] * w[2]),
                 (v[0] * w[1]) - (v[1] * w[0])];

   return normal;
};

var dot = function(l,r){
   return l[0] * r[0] +
          l[1] * r[1] +
          l[2] * r[2];
};

var phong = function(normal, triangle, points){
   var lightColor = 255;
   var ambient = parseFloat(document.getElementById('ambient').value);
   var diffuse = parseFloat(document.getElementById('diffuse').value);
   var shininess = parseFloat(document.getElementById('shininess').value);
   var specular = parseFloat(document.getElementById('specular').value);

   var x=0, y=0, z=0;
   for(var i=0; i<triangle.length; i++){
      x += points[triangle[i]][0];
      y += points[triangle[i]][1];
      z += points[triangle[i]][2];
   }

   var facePos = [ x, y, z ];

   var color = ambient * lightColor;
   var lightDir = normalise([
      light[0] - facePos[0],
      light[1] - facePos[1],
      light[2] - facePos[2]
   ]);

   color += dot(lightDir, normal) * diffuse * lightColor;
   var cameraPos = normalise(camera);
   var viewDir = normalise([
      cameraPos[0] - facePos[0],
      cameraPos[1] - facePos[1],
      cameraPos[2] - facePos[2]
   ]);
   var halfVec = normalise([
      light[0] + viewDir[0],
      light[1] + viewDir[1],
      light[2] + viewDir[2]
   ]);

   color += Math.pow(dot(normal, halfVec), shininess) * specular * lightColor;

   return color;
};

var plotObject = function(original, shape, object, xOff, yOff, scale, ctx){
   var polysDrawn = 0;
   var lightVertex = normalise(light);
   var solid = fill();
   var wireframe = !solid;

   for(var i = 0; i < object.triangles.length; i++){
      var t = object.triangles[i];

      var projectionNormal = normalise(crossProduct(shape, t));
      var normal = normalise(crossProduct(original, t));
      var visible = projectionNormal[2] >= 0;

      if(visible || wireframe) {
         polysDrawn++;

         var lightIntensity = dot(normal, lightVertex);
         lightIntensity = lightIntensity < 0 ? 0 : lightIntensity;

         ctx.lineWidth = 1;
         ctx.beginPath();

         ctx.moveTo(xOff + shape[t[0]][0] * scale, yOff + shape[t[0]][1] * scale);
         for(var j=0; j < t.length; j++){
            ctx.lineTo(xOff + (shape[t[j]][0] * scale), yOff + (shape[t[j]][1] * scale));
         }

         ctx.closePath();
         if(solid){
            ctx.fillStyle = 'rgb(' + (red + phong(normal, t, original)).toFixed(0) + ','
                                + (green + phong(normal, t, original)).toFixed(0) + ','
                                + (blue + phong(normal, t, original)).toFixed(0) + ')';
            ctx.fill();
         }

         ctx.strokeStyle = (showEdges.checked || wireframe) ? (visible ? '#900' : '#400') : ctx.fillStyle;
         ctx.stroke();

         if(showNormals.checked){
            var nXs = object.scale * (object.normals[i][0] - camera[0]) / (camera[2] + object.normals[i][2]);
            var nYs = object.scale * (object.normals[i][1] - camera[1]) / (camera[2] + object.normals[i][2]);

            var nXf = (object.scale * (object.normals[i][0] + (normal[0] / object.scale) * normalSize)) / (camera[2] + (object.normals[i][2] + ((normal[2] / object.scale) * normalSize)));
            var nYf = (object.scale * (object.normals[i][1] + (normal[1] / object.scale) * normalSize)) / (camera[2] + (object.normals[i][2] + ((normal[2] / object.scale) * normalSize)));

            ctx.beginPath();
            ctx.strokeStyle = visible ? '#0b0' : '#050';
            ctx.lineWidth = 3;
            ctx.moveTo(xOff + (nXs * scale), yOff + (nYs * scale));
            ctx.lineTo(xOff + (nXf * scale), yOff + (nYf * scale));
            ctx.stroke();
         }
      }
   }

   polyCount.innerText = ' (' + polysDrawn + ' rendered)';
};

var sortByZIndex = function(transformedPoints, object){
   object.triangles.sort(function(a,b){
      var aDistance = 0;
      for(var i=0; i<a.length; i++){
         aDistance += transformedPoints[a[i]][2];
      }

      var bDistance = 0;
      for(var i=0; i<b.length; i++){
         bDistance += transformedPoints[b[i]][2];
      }

      return aDistance - bDistance;
   });
};

var calculateCenter = function(points, obj){
   for(var t = 0; t<obj.triangles.length; t++){
      var triangle = obj.triangles[t];
      var cX = 0, cY = 0, cZ = 0;

      for(var v=0; v<triangle.length; v++){
         cX += points[triangle[v]][0];
         cY += points[triangle[v]][1];
         cZ += points[triangle[v]][2];
      }

      cX /= triangle.length;
      cY /= triangle.length;
      cZ /= triangle.length;

      obj.normals[t] = [cX, cY, cZ];
   }
};

var plotShape = function(obj, ctx){
   var transformedPoints = transform(obj.points, rotateMatrix(parseFloat(xRot.value), parseFloat(yRot.value), parseFloat(zRot.value)));
   sortByZIndex(transformedPoints, obj);

   if(showNormals.checked)
      calculateCenter(transformedPoints, obj);

   var twoDPoints = project(transformedPoints, obj.scale);
   plotObject(transformedPoints, twoDPoints, obj, 240, 240, 120, ctx);
   var twoDLight = project(light);
   ctx.FillStyle = '#fff';
   ctx.fillRect(twoDLight[0], twoDLight[1], 2, 2);
};

var clearCanvas = function(ctx){
   ctx.fillStyle = '#000';
   ctx.clearRect(0, 0, canv.width, canv.height);
};

var fixIndexing = function(obj){
   if(obj){
      // Correct for 1-based indexing in exported data.
      for(var i=0; i < obj.triangles.length; i++) {
         for(var j=0; j < obj.triangles[i].length; j++)
            obj.triangles[i][j] -= 1;
      }
   }
};

var displayInfo = function(obj){
   info.innerText = 'Points: ' + obj.points.length + ', polygons: ' + obj.triangles.length;
};

var setColor = function(r, g, b){
   red = parseInt(r);
   green = parseInt(g);
   blue = parseInt(b);
};

var renderSelectedModel = function(){
   clearCanvas(context);

   switch(modelSelect.value){
      default:
      case '0':
         plotShape(cubeObject, context);
         displayInfo(cubeObject);
         break;

      case '1':
         plotShape(sphereObject, context);
         displayInfo(sphereObject);
         break;

      case '2':
         plotShape(torusObject, context);
         displayInfo(torusObject);
         break;

      case '3':
         plotShape(chimpObject, context);
         displayInfo(chimpObject);
         break;

      case '4':
         plotShape(cogObject, context);
         displayInfo(cogObject);
         break;

      case '5':
         plotShape(uvSphereObject, context);
         displayInfo(uvSphereObject);
         break;
   }

   if(rotX.checked) xRot.value = (parseFloat(xRot.value) + 0.5) % 360;
   if(rotY.checked) yRot.value = (parseFloat(yRot.value) + 0.5) % 360;
   if(rotZ.checked) zRot.value = (parseFloat(zRot.value) + 0.5) % 360;

   setTimeout(renderSelectedModel, delay());
};

var calculateScale = function(object){
   var maxMagnitude = 0;

   for(var i=0; i < object.points.length; i++){
      var magnitude = Math.abs( Math.sqrt( object.points[i][0] * object.points[i][0] +
                                           object.points[i][1] * object.points[i][1] +
                                           object.points[i][2] * object.points[i][2] ) );

      if(magnitude > maxMagnitude)
         maxMagnitude = magnitude;
   }

   object.scale = ((canv.width / 2) * Math.sin(getRadians(90))) / maxMagnitude;
};

var initialize = function(){
   // Exported model data has 1-based array indexes.
   fixIndexing(cogObject);
   fixIndexing(cubeObject);
   fixIndexing(torusObject);
   fixIndexing(chimpObject);
   fixIndexing(uvSphereObject);

   calculateScale(cubeObject);
   calculateScale(sphereObject);
   calculateScale(uvSphereObject);
   calculateScale(torusObject);
   calculateScale(chimpObject);
   calculateScale(cogObject);
};

if(canv && canv.getContext){
   var context = canv.getContext('2d');

   if(context){
      initialize();
      renderSelectedModel();
   }
}
