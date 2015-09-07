
var express = require('express');
var app=express();
var http=require('http');
var server = http.createServer(app)
server.listen(process.env.PORT || 3000);
console.log("connected");

var data_uri=require('data-uri');
var io = require('socket.io')(server);
var time = require('time');
var readFile = require('read-file');
var crypto = require('crypto');
var ls = require('ls');
var mongoose = require('mongoose');
var path="files"
mongoose.connect('mongodb://heroku:jhpUPVX4RHmPKP-DaLi2167sjVvUQZtQNoacq7m5sZIauVc7ij3t17jV5r3Dhn4ka47pd9pz3WhB7d4o9Z3dow@kahana.mongohq.com:10066/app29542750');
var peerConnection = mongoose.model('peer', { id: String, items:Array,time:Number });
var database = mongoose.connection;
//this does an initall clearing
peerConnection.where().sort({time:-1}).exec(function(e,x){
  for(i in x){
    x[i].remove();
  }
});


//startup
function hash(x){
  var shasum = crypto.createHash('sha512');
  shasum.update(x);
  return shasum.digest('hex');
}
//path most be defined, do not end with /
var docs=[]
var directory=ls(path+"/*");
for(i in directory){
  if((directory[i].full).indexOf(".mp4")>-1){/*||(directory[i].full).indexOf(".png")>-1||(directory[i].full).indexOf(".bmp")>-1||
      (directory[i].full).indexOf(".gif")>-1||(directory[i].full).indexOf(".jpeg")>-1||(directory[i].full).indexOf(".mp4")>-1)*/
    var nameN=directory[i].name;
    data_uri.encode(directory[i].full, function(results){
      docs[nameN]={path:Object.keys(results)[0],hash:hash(results[Object.keys(results)[0]].dataUri)};
    });
  }else{
  docs[directory[i].name]={path:directory[i].full,hash:hash(readFile.readFileSync(directory[i].full))};}
}
//console.log(docs);
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});
app.use(express.static(__dirname + '/public'));


io.on('connection', function (socket) {
  socket.emit('connected',socket.id);
  socket.on('disconnect', function(data){
      peerConnection.findOne({id:socket.id}).remove(console.log);//this should work without console.log in the remove

    // if socket's id == room  he is the master and kick other sockets from this
    // room and join them to a room of their own identified by their ids.
  });
  var newPeer= new peerConnection({items:[],id:socket.id,time:0});//this should make a new one peerconnection, this will need to be altered
  socket.on('request',function(data){
    //console.log(data.name)
    var name=data.name;

    peerConnection.find({items:{$in:[name]}}).sort({time:"asc"}).select('id').findOne(function(err,peerOffering){
      if(peerOffering){
        peerOffering.time = time.Date.parse(time.Date());//do I need to save
        peerOffering.save(function(err){
          if (err)throw Error(err);
        });
        socket.emit("reply",{
          name:name,
          hash:docs[name].hash,
          peerID:peerOffering.id
        });
      }
      else{
        var dataToSend;
        //console.log(name);
        console.log(docs["magic"]);
        if((docs[name].path).indexOf(".mp4")>-1){/*
          ||(docs[name].path).indexOf(".png")>-1||(docs[name].path).indexOf(".bmp")>-1||
              (docs[name].path).indexOf(".gif")>-1||(docs[name].path).indexOf(".jpeg")>-1||(docs[name].path).indexOf(".mp4")>-1*/
          data_uri.encode(docs[name].path, function(results){
            dataToSend=results[Object.keys(results)[0]].dataUri;
            //console.log('over here now');
            socket.emit("reply",{
              name:name,
                data:{name:name,data:dataToSend},
                peerID:0});
            newPeer.items.push(name);
            newPeer.items.push(name);
            newPeer.save(function(err){
              if (err)throw Error(err);
            });
          });
      }
      else{
        dataToSend=readFile.readFileSync(docs[name].path);
        //console.log('over here now');
        socket.emit("reply",{
          name:name,
            data:{name:name,data:dataToSend},
            peerID:0});
        newPeer.items.push(name);
        newPeer.items.push(name);
        newPeer.save(function(err){
          if (err)throw Error(err);
        });}
      }

    //look for things that have it
    //get latest things
    //cycle things in order of quesitons (probaly give the new one a different last request)

    });
  });
  socket.on('recieved',function(name){
    database.findOne({id:socket.id}).items.push(name);
  })
  //note socket will register with socket.id
});
