// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();
var buf = new ArrayBuffer(12);
// Create a data view of it
var view = new DataView(buf);

var VryV; //
var VybV;
var VbrV;
var IrV;
var IyV;
var IbV;
var PfV;
var FreqV;
var KwhV;
var Kvah;
var globalID = 1;
///////////////////////////////TCP Client code

var net = require('net');
 
client.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 });
var client2 = new net.Socket();
client2.connect(5001, '192.168.56.161', function() {//192.168.0.170
console.log('Connected');

});

client2.on('data', function(data) {
	 
});

client2.on('close', function() {
	console.log('Connection closed');
});
////////////////////////////////TCP Client end


///////////// simulating KWH for 27 MFM ////////////////

// setInterval(() => {
  
//   var tempNum = (Math.random() * (2.120 - 2.0200) + 0.1200).toFixed(4)
//   KwhV = parseFloat(KwhV) + parseFloat(tempNum);

//   var tempNum = (Math.random() * (2.120 - 2.0200) + 0.0200).toFixed(4)
//   Kvah = parseFloat(Kvah) + parseFloat(tempNum);
//  // console.log('KWH',live_KWh_M1_value.toFixed(2))
// }, 1000);
/////////////// simulating KWH for 27 MFM end /////////////


 
setInterval(function () {
  // for(var i=0;i<readvalue.length;i++){
 
  client.setID(globalID);
  console.log('seting ID',globalID);
  pararead();
  
  //}
}, 1000);

function pararead() {

  console.log('reading ID',globalID);
  client.readHoldingRegisters(3109, 2, function (err, data) {
    //console.log('freq', data.data[1])
     var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
    FreqV = currCount;
     console.log("freq value:",FreqV)
   // FreqV =  data.data[1]

    setTimeout(() => {
      client.readHoldingRegisters(3019, 2, function (err, data) {
       // console.log('Vry',  data.data[1])
        //VryV = data.data[1]
         var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
        VryV = currCount;
         console.log("Vry value:",VryV)
        setTimeout(() => {
          client.readHoldingRegisters(3021, 2, function (err, data) {
           // console.log('Vbr',  data.data[1])
            //VbrV = data.data[1];
             var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
            VbrV = currCount;
             console.log("VbrV value:",VbrV)
            setTimeout(() => {
              client.readHoldingRegisters(3023, 2, function (err, data) {
               // console.log('Vyb',  data.data[1])
                //VybV = data.data[1];
                 var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                VybV = currCount;
                 console.log("VybV value:",VybV)
                setTimeout(() => {
                  client.readHoldingRegisters(2999, 2, function (err, data) {
                    //console.log('Ir',  data.data[1])
                    //IrV = data.data[1];
                    var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                    IrV = currCount;
                    console.log("IrV value:",IrV)
                    setTimeout(() => {
                      client.readHoldingRegisters(3001, 2, function (err, data) {
                        //console.log('Iy',  data.data[1])
                        //IyV = data.data[1];
                         var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                        IyV = currCount;
                         console.log("IyV value:",IyV)
                        setTimeout(() => {
                          client.readHoldingRegisters(3003, 2, function (err, data) {
                            //console.log('ib',  data.data[1])
                            //IbV = data.data[1];
                             var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                            IbV = currCount;
                             console.log("IbV value:",IbV)
                            setTimeout(() => {
                              client.readHoldingRegisters(3193, 2, function (err, data) {
                                //console.log('pf',  data.data[1])
                                //PfV = data.data[1];
                                 var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                                PfV = currCount;
                                 console.log("PfV value:",PfV)
                                setTimeout(() => {
                                  client.readHoldingRegisters(2699, 2, function (err, data) {
                                    //console.log('kwh',  data.data[1])
                                    //KwhV = data.data[1];
                                     var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                                    KwhV = currCount;
                                     console.log("KwhV value:",KwhV)
                                    setTimeout(() => {
                                      client.readHoldingRegisters(2715, 2, function (err, data) {
                                        //console.log('kvah',  data.data[1])
                                        //Kvah = data.data[1];
                                         var v1 = data.data[0];view.setUint16(0, v1);view.setUint16(2, v1);var num = view.getFloat32(0);var currCount = num.toFixed(1);
                                        Kvah = currCount;
                                         console.log("Kvah value:",Kvah)
                         
                                      //  io.emit("sendvalue",VryV,VybV,VbrV,IrV,IyV,IbV,PfV,FreqV,KwhV,Kvah)
                                        /// sending data to server
                                        var EMS = [];
                                        var temp;
                                        //simulation of 27 meters
//                                        if (globalID == 1) {
//                                        temp = "1";
//                                      } else if (globalID == 2) {
//                                          temp = "2";
//                                      } else if (globalID == 3) {
//                                          temp = "3";
//                                      } else if (globalID == 4) {
//                                          temp = "4";
//                                      } else if (globalID == 5) {
//                                          temp = "5";
//                                      } else if (globalID == 6) {
//                                          temp = "6";
//                                      } else if (globalID == 7) {
//                                          temp = "7";
//                                      } else if (globalID == 8) {
//                                          temp = "8";
//                                      } else if (globalID == 9) {
//                                          temp = "9";
//                                      } 
//                                      else if (globalID == 10) {
//                                          temp = "10";
//                                      } else if (globalID == 11) {
//                                          temp = "11";
//                                      } else if (globalID == 12) {
//                                          temp = "12";
//                                      } else if (globalID == 13) {
//                                          temp = "13";
//                                      } else if (globalID == 14) {
//                                          temp = "14";
//                                      } else if (globalID == 15) {
//                                          temp = "15";
//                                      } else if (globalID == 16) {
//                                          temp = "16";
//                                      } 
                                         if (globalID == 17) {
                                          temp = "17";
                                      } 
                                       else if (globalID == 18) {
                                           temp = "18";
                                       } 
                                       else if (globalID == 19) {
                                           temp = "19";
                                       } else if (globalID == 20) {
                                           temp = "20";
                                       } else if (globalID == 21) {
                                           temp = "21";
                                       } else if (globalID == 22) {
                                           temp = "22";
                                       } else if (globalID == 23) {
                                           temp = "23";
                                       } else if (globalID == 24) {
                                           temp = "24";
                                       } else if (globalID == 25) {
                                           temp = "25";
                                       } else if (globalID == 26) {
                                           temp = "26";
                                       } else if (globalID == 27) {
                                           temp = "27";
                                       }
                                      
                                        console.log('temp',temp)
                                          EMS.push(temp);
                                          EMS.push(VryV);
                                          EMS.push(VybV);
                                          EMS.push(VbrV);
                                          EMS.push(IrV);
                                          EMS.push(IyV);
                                          EMS.push(IbV);
                                          EMS.push(PfV);
                                          EMS.push(FreqV);
                                          EMS.push(KwhV);
                                          EMS.push(Kvah);
                                          
                                          // EMS.push('420.5');
                                          // EMS.push('414.5');
                                          // EMS.push('418.5');
                                          // EMS.push('0');
                                          // EMS.push('0');
                                          // EMS.push('0');
                                          // EMS.push('-0.1');
                                          // EMS.push('5.1');
                                          // EMS.push(KwhV);
                                          // EMS.push(Kvah);
                                          // console.log('simulated value KwhV',KwhV)
                                          // console.log('simulated value Kvah',Kvah)
                                          var i = 0;                                          
                                            client2.write(EMS.toString());                                         
                                          globalID++;
                                          console.log('reading completed & now ++',globalID);
                                          if(globalID == 28){
                                          globalID=17;
                                          }
                                        /// sending data end
                                      });
                                    }, 5);
                            
                                 });
                                }, 5);
                        
                              });
                            }, 5);
                    
                         });
                        }, 5);
                
                      });
                    }, 5);
            
                  });
                }, 5);
        
             });
            }, 5);
    
         });
        }, 5);

      });
    }, 5);

  });
}








