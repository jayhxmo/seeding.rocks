console.log('test');
var socket = io.connect('http://pennapps-2014f.herokuapp.com');
var peerID;
var receivedData;
function hash(x){
  var temp=new jsSHA(x, "TEXT");
  return temp.getHash("SHA-512", "HEX");
}



function handleData(peerData){
  foundAlready[peerData.name].data=peerData.data.data;
  var destination=foundAlready[peerData.name].destination;
  if(destination==="innerHTML"){
    foundAlready[peerData.name].element.innerHTML=peerData.data.data;
  }
  else if(destination==="src"){
    console.log('here');
    foundAlready[peerData.name].element.src=peerData.data.data;//I can have multiple parts there
  }else{
    console.log(destination);
  foundAlready[peerData.name].element.innerHTML=peerData.data.data;}
  //foundAlready[data.name].element.setAttribute(data.destination,data.data);
}
var foundAlready={};
socket.on("connected",function(id){
  var peer = new Peer(id,{　host:'peerjs-pennapps-2014f.herokuapp.com', port:443,debug:3,secure:true, key: 'peerjs'});//
  //var peer = new Peer( id +""        , {key: "i3e1fybrlyehr529"});
  peer.on('open',function(){
    peerID=id;
    socket.on('reply', function (data) {
      if(data.peerID){
        var conn = peer.connect(data.peerID);
        conn.on('open',function(){
          conn.send({name:data.name});
        });
        conn.on('data', function(peerData){
          if(hash(peerData.data)===data.hash){
            handleData({data:peerData,name:data.name});
          }
          else{
            socket.emit('request',{name:data.name});
          }
        });
      }else{
        handleData(data);
      }
    });
    peer.on('connection', function(conn) {
      conn.on("data",function(requestData){
        if(foundAlready[requestData.name]){

          conn.send({data:foundAlready[requestData.name].data});
        }
        else{
          console.log("error")
          conn.send({hash:-1});
        }
      });
    });

      var elements=document.getElementsByTagName('*');
      for(i in elements){
        if(elements[i].getAttribute){
          var name=elements[i].getAttribute("data-name");
          if(name && !foundAlready[name]){
            var destination=elements[i].getAttribute("data-destination");
            if(destination){
              foundAlready[name]={destination:destination,element:elements[i]};
            }else{
              foundAlready[name]={destination:"innerHTML",element:elements[i]};
            }

            socket.emit('request',{name:name});
          }
        }
      }
    });
});
