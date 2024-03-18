var path = require("path");
var net = require('net');
var sql = require("mssql");
var sockets = [];
const XlsxPopulate = require('xlsx-populate');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
// var moment = require('moment');
// var net = require("net");
// var hostIp=require('./js/ip_port')
var express = require("express"),
  app = require("express")(),
  http = require("http").Server(app),
  io = require("socket.io")(http);

const EventEmitter = require('node:events');
const eventEmitter = new EventEmitter();


var HOST = "127.0.0.1";
var PORT = 8081;
global.MYVAR = "connected!";
global.MYVAR2 = "connected!";


// amruta sql connection strt //
const sqlConfig = {
  user: "admin",
  password: "admin",
  database: "EMS",
  server: 'localhost\\MSSQLSERVER2022',
	// server: '192.168.1.14\\MSSQLSERVER2022',
  // server: "DESKTOP-FCCFFB0",
  // server: "DESKTOP-FCCFFB0",
	

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 1500000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: false,
  },
};
// amruta sql connection end //
// Create a database connection pool
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.then(() => {
  console.log('Connected to the database::', sqlConfig);
}).catch(err => {
  console.error('Error connecting to database:', err);
});

// connection.connect();
http.listen(9000, function () {
  console.log("Connected to :9000");
  console.log("Connected to", sqlConfig);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname + "/login.html"));
});
app.get("/index", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});
app.get("/overview", function (req, res) {
  res.sendFile(path.join(__dirname + "/overview.html"));
});
app.get("/report", function (req, res) {
  res.sendFile(path.join(__dirname + "/report.html"));
});
app.get("/mail", function (req, res) {
  res.sendFile(path.join(__dirname + "/mailindex.html"));
});
app.get("/trend", function (req, res) {
  res.sendFile(path.join(__dirname + "/trend.html"));
});
app.get("/trend11", function (req, res) {
  res.sendFile(path.join(__dirname + "/trend11.html"));
});
app.get("/livemeter", function (req, res) {
  res.sendFile(path.join(__dirname + "/livemeter.html"));
});
app.get("/cardstrend", function (req, res) {
  res.sendFile(path.join(__dirname + "/cardstrend.html"));
});




/////////////// mail strt//////////////////

// Nodemailer transporter configuration
const senderEmailId = 'rieteremp@gmail.com';
const senderEmailPass = 'kekamakfibbuhjjt';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: senderEmailId,
    pass: senderEmailPass,
  },
});


async function sendMail() {
  try {
    const data = await fetchYesterdaysData();
    if (data.length > 0) {
      const mailOptions = {
        from: senderEmailId,
        to: 'piu6048@gmail.com, rnd8.orbi@gamil.com',
        subject: 'Yesterday\'s Data',
        html: composeEmailBody(data),
      };
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully.');
    } else {
      console.log('No data found for yesterday.');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function fetchYesterdaysData() {
  return new Promise((resolve, reject) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().slice(0, 10);
    var data_arr = [];

    // const query = `SELECT meter_id, SUM(kWh) AS total_kWh FROM taco_treceability.energy_consumption WHERE date_time LIKE '%${formattedDate}%' GROUP BY meter_id`;


    const mailquery = `SELECT meter_id, SUM(kWh) AS total_kWh
    FROM taco_treceability.taco_treceability.energy_consumption
    WHERE CAST(date_time AS DATE) = '${formattedDate}'
    GROUP BY meter_id`;

    console.log("mailquery",mailquery);
    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(mailquery, function (err, loginrecordset) {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject(err);
          return;
        }
        if (!loginrecordset) {
          console.error('No recordset returned from SQL query.');
          reject('No recordset returned from SQL query.');
          return;
        }

        var result = loginrecordset.recordset;
        for (i in result) {
          var meter = result[i].meter_id;
          var kwh = result[i].total_kWh;

          data_arr.push({ meter_id: meter, kWh: kwh });
        }
        console.log("data_arr::::::", data_arr);
        resolve(data_arr);
      });
    });
  });
}

function composeEmailBody(data) {
  let body = '<h2>Yesterday\'s Data</h2><ul>';
  data.forEach(row => {
    body += `<li>Meter ID: ${row.meter_id}, kWh: ${row.total_kWh}</li>`;
  });
  body += '</ul>';
  return body;
}
/////////////// mail end//////////////////

var curdate = new Date();
var yr = curdate.getFullYear();
var month = ("0" + (curdate.getMonth() + 1)).slice(-2);
var day = ("0" + curdate.getDate()).slice(-2);
var today_date_dd = yr + "-" + month + "-" + day + "" + curdate.getHours() + ":" + curdate.getMinutes() + ":" + curdate.getSeconds();
var today_date = yr + "-" + month + "-" + day + "";
// console.log("today_date:::", today_date)


/********************************************************* Merged KWH ************************************************/
////////////// Initialising Global Variable /////////////
var base_date = new Date();
// console.log('Base date', base_date)

//var base_date = new Date("Feb 08, 2024 07:00:00");
var running_date;
var diff_checker_HR = 0;
var diff_checker_MIN = 0;
var ignore_flag = 0;
var total_meter_count = 0;


// Declare Global variable meter count for meters strt //
var SelectQuery = `SELECT count(meter_id) as totalMeters FROM [EMS].[dbo].ems_master`;
console.log("SelectQue1::::", SelectQuery);
sql.connect(sqlConfig, function (err) {
  var requestsel = new sql.Request();
  requestsel.query(SelectQuery, function (err, recordset) {
    var result = recordset.recordset;
    if (err) {

    } else {
      total_meter_count = result[0].totalMeters;
      console.log("getmetercount::", total_meter_count);
      for (var i = 1; i <= parseInt(total_meter_count); i++) {
        eval("global.prev_kwh_M" + i + "_value" + " = " + "0");
        eval("global.prev_kvah_M" + i + "_value" + " = " + "0");

        eval("global.perHr_consumption_M" + i + " = " + "0");
        eval("global.perHr_consumption_kvah_M" + i + " = " + "0");

      }
    }
  });
});
// Declare Global variable meter count for meters end //

var curdate = new Date();
var yr = curdate.getFullYear();
var month = ("0" + (curdate.getMonth() + 1)).slice(-2);
var day = ("0" + curdate.getDate()).slice(-2);
var today_date_dd = yr + "-" + month + "-" + day + " " + curdate.getHours() + ":" + curdate.getMinutes() + ":" + curdate.getSeconds();
var today_date = yr + "-" + month + "-" + day + "";
// console.log("today_date:::", today_date)


// Subtract one day from the current date
var yesterday = new Date(curdate);
yesterday.setDate(curdate.getDate() - 1);

var yr = yesterday.getFullYear();
var month = ("0" + (yesterday.getMonth() + 1)).slice(-2);
var day = ("0" + yesterday.getDate()).slice(-2);
var yesterday_date_dd = yr + "-" + month + "-" + day + " " + yesterday.getHours() + ":" + yesterday.getMinutes() + ":" + yesterday.getSeconds();
var yesterday_date = yr + "-" + month + "-" + day + "";



var live_KWh_M1_value = 0;
// var perHr_consumption_M1 = 0;
// var perHr_consumption_kvah_M1 = 0;
// var prev_kvah_M1_value = 0;
var live_Kvah_M1_value = 0;
var i = 0;

var meter_id_M1 = 0;
var load_name_M1;
var Vry_M1 = 0;
var Vyb_M1 = 0;
var Vbr_M1 = 0;
var Ir_M1 = 0;
var Iy_M1 = 0;
var Ib_M1 = 0;
var PF_M1 = 0;
var F_M1 = 0;
var kWh_M1 = 0;
var kVAh_M1 = 0;

//////////////////////////////// Read data from Gateway /////////////////////////



// first server listening on port 5001
const server1 = net.createServer();
server1.on('connection', handleConnection);
server1.listen(5001, function () {
  console.log('Server 1 listening on port 5001');
});

// second server listening on port 5003
// const server2 = net.createServer();
// server2.on('connection', handleConnection);
// server2.listen(5003, function () {
//   console.log('Server 2 listening on port 5003');
// });


function handleConnection(conn) {
  const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;

  // Log new client connection
  // console.log('new client connection from %s', remoteAddress);

  // Set up event listeners for the connection
  conn.on('data', onConnData);
  conn.once('close', onConnClose);
  conn.on('error', onConnError);

  let activeMeterCount = 0;
  let inactiveMeterCount = 0;

  const totalMeterCount = parseInt(total_meter_count);
  console.log('totalMeterCount', totalMeterCount)
  let activeMeters = [];

  // function resetCounts() {
  //     // activeMeterCount = Object.keys(activeMeters).length;
  //     // inactiveMeterCount = totalMeterCount - activeMeterCount;
  //     // activeMeters = {}; 
  // }

  // resetCounts();
  // setInterval(resetCounts, 60000); 


  function onConnData(data) {
    const dataString = data.toString();
    console.log('Connection data - %s', dataString);

    var msg;
    // console.log('data[o]',dataString[0])
    if (dataString[0] == 'D') {
      msg = dataString.split('|');
      //  console.log('msg',msg)

      if (msg[0] == "Deactive") {
        // console.log('msg[1]',msg[1])
        // console.log('activeMeters before',activeMeters)
        const index = activeMeters.indexOf(msg[1]);
        if (index > -1) {
          activeMeters.splice(index, 1);
          // console.log('activeMeters after',activeMeters)
        }
      }

    }
    else {
      const values = dataString.split(',');
      const meter_id_M1_value = values[0];
      const index = activeMeters.indexOf(meter_id_M1_value);
      if (index > -1) { // only splice array when item is found

      }
      else {
        activeMeters.push(meter_id_M1_value);
      }



      // Fetch load name from ems_master table based on meter ID
      const loadNameQuery = `SELECT meter_id, load_name FROM [EMS].[dbo].ems_master WHERE meter_id = '${meter_id_M1_value}'`;
      //console.log("loadNameQuery::::", loadNameQuery);

      sql.connect(sqlConfig, function (err) {
        var request = new sql.Request();
        request.query(loadNameQuery, function (err, result) {
          if (err) {
            console.error('Error fetching load name:', err);
          } else {
            const load_name_M1 = result.recordset[0].load_name;
            const Vry_M1_value = values[1];
            const Vyb_M1_value = values[2];
            const Vbr_M1_value = values[3];
            const Ir_M1_value = values[4];
            const Iy_M1_value = values[5];
            const Ib_M1_value = values[6];
            const PF_M1_value = values[7];
            const F_M1_value = values[8];
            const live_KWh_M1_value = values[9];
            const live_Kvah_M1_value = values[10];

            ignore_flag++;
            base_date = new Date();

            // Calculate per hour consumption
            eval(`var perHr_consumption_M${meter_id_M1_value} = parseFloat(live_KWh_M1_value) - parseFloat(prev_kwh_M${meter_id_M1_value}_value)`);
            eval(`var perHr_consumption_kvah_M${meter_id_M1_value} = parseFloat(live_Kvah_M1_value) - parseFloat(prev_kvah_M${meter_id_M1_value}_value)`);

            // Update previous kWh and kVAh values
            eval(`prev_kwh_M${meter_id_M1_value}_value = live_KWh_M1_value`);
            eval(`prev_kvah_M${meter_id_M1_value}_value = live_Kvah_M1_value`);

            if (ignore_flag != 1) {
              eval(`var temp_prekwh = perHr_consumption_M${meter_id_M1_value}`);
              eval(`var temp_prekvah = perHr_consumption_kvah_M${meter_id_M1_value}`);
              temp_prekwh = temp_prekwh.toFixed(2);
              temp_prekvah = temp_prekvah.toFixed(2);

              // Make DB entry with received data
              const insertQuery = `INSERT INTO [EMS].[dbo].master_live_data_m${meter_id_M1_value} (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh)
            VALUES ('${meter_id_M1_value}', '${load_name_M1}', '${Vry_M1_value}', '${Vyb_M1_value}', '${Vbr_M1_value}', '${Ir_M1_value}', '${Iy_M1_value}', '${Ib_M1_value}', '${PF_M1_value}', '${F_M1_value}', '${temp_prekwh}', '${temp_prekvah}')`;

              // console.log("insertQuery::", insertQuery);

              // Execute insertion query
              sql.connect(sqlConfig, function (err) {
                var request = new sql.Request();
                request.query(insertQuery, function (err) {
                  if (err) {
                    console.error('Error inserting data into database:', err);
                  } else {
                    // console.log('Data inserted successfully in:', meter_id_M1_value);
                  }
                });
              });
              /************************* calculate time one hr before current hr ************************/
              var currentDate = new Date();
              // Subtract one hour from the current date
              var oneHourBefore = new Date(currentDate.getTime() - (1 * 3600 * 1000));

              // Function to pad single digits with leading zeros
              function pad(number) {
                if (number < 10) {
                  return '0' + number;
                }
                return number;
              }

              // Format the date and time as "YYYY-MM-DD HH:mm:ss"
              var formattedDate = oneHourBefore.getFullYear() + '-' +
                pad(oneHourBefore.getMonth() + 1) + '-' +
                pad(oneHourBefore.getDate()) + ' ' +
                pad(oneHourBefore.getHours());
              // pad(oneHourBefore.getMinutes()) + ':' +
              // pad(oneHourBefore.getSeconds());

              //console.log('formattedDate::::::::', formattedDate);
              // insertAverageData(formattedDate, meterNum);
              insertAverageData(formattedDate, values[0]);

              /************************* calculate time one hr before current hr end ************************/
            }
          }
        });
      });

      // activeMeterCount = Object.keys(activeMeters).length;
      console.log("inactiveMeterCount = totalMeterCount - activeMeters.length",inactiveMeterCount, totalMeterCount , activeMeters.length)
      inactiveMeterCount = totalMeterCount - activeMeters.length;
      var tempact = activeMeters.length;
      eventEmitter.emit('sendActiveToFront', { tempact, inactiveMeterCount });
      //socket.emit('meterCounts', { activeMeters, inactiveMeterCount });

     // console.log("Active meters:", activeMeters);
      console.log("Inactive meters:", inactiveMeterCount);
    }
  }

  function onConnClose() {
    // console.log('connection from %s closed', remoteAddress);
  }

  function onConnError(err) {
    console.error('Connection %s error: %s', remoteAddress, err.message);
  }
}



function insertAverageData(dateformat, mNum) {

  dailyData(dateformat, mNum);
  weeklyData(dateformat, mNum);
  monthlyData(dateformat, mNum);

  var SelectQue1 = `SELECT * FROM [EMS].[dbo].average_m${mNum} where date_time like '${dateformat}%'`;
  // console.log("SelectQue1::::", SelectQue1);

  sql.connect(sqlConfig, function (err) {
    var requestsel = new sql.Request();
    requestsel.query(SelectQue1, function (err, meterecordset) {
      if (err) { } else { }
      var result = "";
      result.length = 0;
      try {
        result = meterecordset.recordset;

      } catch {

      }
      if (result.length > 0) { }
      else {
        var SelectQue2 = `SELECT * FROM [EMS].[dbo].master_live_data_m${mNum} where date_time like '${dateformat}%'`;
        // console.log("SelectQue2::::", SelectQue2);

        sql.connect(sqlConfig, function (err) {
          var requestsel = new sql.Request();
          requestsel.query(SelectQue2, function (err, meterecordset) {
            if (err) {
            } else { }
            var result = meterecordset.recordset;

            if (result.length > 0) {
              const avgQuery = `
                            INSERT INTO [EMS].[dbo].average_m${mNum} (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
                            SELECT
                                meter_id,
                                load_name,
                                AVG(Vry),
                                AVG(Vyb),
                                AVG(Vbr),
                                AVG(Ir),
                                AVG(Iy),
                                AVG(Ib),
                                AVG(PF),
                                AVG(F),
                                AVG(kWh),
                                AVG(kVAh),
                            '${dateformat + ':00:00'}'
                            FROM [EMS].[dbo].master_live_data_m${mNum}
                            WHERE date_time like '${dateformat}%' GROUP BY meter_id, load_name`;
              //console.log("avgQuery:::::", avgQuery)
              pool.request().query(avgQuery, (err, avgResult) => {
                if (err) {
                  console.error('Error calculating and inserting average data:', err);
                } else {
                  console.log('Average data inserted successfully in::', mNum);
                  // Check if average data was inserted successfully
                  if (avgResult && avgResult.rowsAffected && avgResult.rowsAffected.length > 0 && avgResult.rowsAffected[0] > 0) {
                    truncateMasterLiveData(dateformat, mNum); // Truncate the data

                  } else {
                    console.log('No rows affected by the average data insertion. Skipping truncation.');
                  }
                }
              });

            }
            else {
            }
          });
        });
      }
    });
  });
}
///////// Function to calculate average end ////////////



/////////// Function to delete live hourly consumption strt ////////////
function truncateMasterLiveData(dateformat, meterN) {
  const truncateQuery = `DELETE [EMS].[dbo].master_live_data_m${meterN} where date_time like '${dateformat}%'`;
  console.log("truncateQuery:::::", truncateQuery)
  pool.request().query(truncateQuery, (err, truncateResult) => {
    if (err) {
      console.error('Error truncating table:', err);
    } else {
      console.log('Table truncated successfully::', meterN);
    }
  });
}
/////////// Function to delete live hourly consumption end ////////////


function dailyData(dateformat, mNum) {
  var currentDate = new Date();

  // Function to pad single digits with leading zeros
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  // Function to get the date string in YYYY-MM-DD format
  function getDateString(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  // Get yesterday's date
  var yesterdayDate = new Date(currentDate.getTime() - (24 * 3600 * 1000));
  // console.log("yesterdayDate", yesterdayDate);

  var formattedYesterdayDate = getDateString(yesterdayDate);
  //console.log("formattedYesterdayDate", formattedYesterdayDate);


  var selectq = `SELECT COUNT(meter_id) as count FROM [EMS].[dbo].energy_consumption WHERE meter_id='${mNum}' and date_time like '${today_date}%'`;
  // console.log('dayQueryeeeeeeeeeeeeeeeeeee',selectq)
  // Execute the insert query
  sql.connect(sqlConfig, function (err) {
    var insertRequest = new sql.Request();
    insertRequest.query(selectq, function (err, recordset) {
      if (err) {
        // console.log('tiiiiiiiiiii',err)
      } else {
        var result = recordset.recordset;
        // console.log('wwwwwwwww',result)
        if (result[0].count > 0) {
          // console.log('qqqqqqqqqqq')
          // If no data exists for yesterday, insert the data
          var dayQuery = `
                   INSERT INTO [EMS].[dbo].energy_consumption (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
                   SELECT meter_id,
                          load_name,
                          AVG(Vry) AS avg_Vry,
                          AVG(Vyb) AS avg_Vyb,
                          AVG(Vbr) AS avg_Vbr,
                          AVG(Ir) AS avg_Ir,
                          AVG(Iy) AS avg_Iy,
                          AVG(Ib) AS avg_Ib,
                          AVG(PF) AS avg_PF,
                          AVG(F) AS avg_F,
                          SUM(kWh) AS total_kWh,
                          AVG(kVAh) AS avg_kVAh,
                          CONVERT(char(10), GetDate(),126) AS date_time
                   FROM [EMS].[dbo].average_m${mNum} WHERE date_time >= '${today_date} 00:00:00'  GROUP BY meter_id, load_name`;
          // console.log('dayQueryeeeeeeeeeeeeeee',dayQuery)
          // Execute the delete query
          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(dayQuery, function (err) {
              if (err) {
                //  console.error('Error inserting data into energy_consumption table:', err);
              } else {
                //  console.log('Data inserted successfully for date:', today_date);

                var dayQueryW = `DELETE TOP (1) [EMS].[dbo].energy_consumption WHERE meter_id='${mNum}' and date_time like '${today_date}%'`;
                //  console.log('deletingggggggggggggggggggggggggg',dayQueryW)
                // Execute the insert query
                sql.connect(sqlConfig, function (err) {
                  var insertRequest = new sql.Request();
                  insertRequest.query(dayQueryW, function (err) {
                    if (err) {
                      //  console.error('Error updating data into energy_consumption table:', err);
                    } else {
                      //  console.log('Data Deleted successfully for date:', today_date);
                    }
                  });
                });
              }
            });
          });
        }
        else {
          // console.log('ttttttttttt')
          // If no data exists for yesterday, insert the data
          var dayQuery = `
                   INSERT INTO [EMS].[dbo].energy_consumption (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
                   SELECT meter_id,
                          load_name,
                          AVG(Vry) AS avg_Vry,
                          AVG(Vyb) AS avg_Vyb,
                          AVG(Vbr) AS avg_Vbr,
                          AVG(Ir) AS avg_Ir,
                          AVG(Iy) AS avg_Iy,
                          AVG(Ib) AS avg_Ib,
                          AVG(PF) AS avg_PF,
                          AVG(F) AS avg_F,
                          SUM(kWh) AS total_kWh,
                          AVG(kVAh) AS avg_kVAh,
                          CONVERT(char(10), GetDate(),126) AS date_time
                   FROM [EMS].[dbo].average_m${mNum} WHERE date_time >= '${today_date} 00:00:00'  GROUP BY meter_id, load_name`;
          //console.log('dayQueryeeeeeeeeeeeeeee',dayQuery)
          // Execute the delete query
          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(dayQuery, function (err) {
              if (err) {
                //  console.error('Error inserting data into energy_consumption table:', err);
              } else {
                //  console.log('Data inserted successfully for date:', today_date);
              }
            });
          });
        }

      }
    });
  });
}

//////////// Function to get data from average to energy_consumption /////////////



////////////////////// from energy_consumption table to energy consumption_weekly strt //////////////////////////// 
function weeklyData(dateformat, mNum) {

  // var currentDate = new Date();
  // var currentDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
  // var lastMonday = new Date(currentDate);
  // lastMonday.setDate(currentDate.getDate() - currentDay - 6); 

  // var lastSunday = new Date(currentDate);
  // lastSunday.setDate(currentDate.getDate() - currentDay); 

  // // Format the start and end dates as "YYYY-MM-DD"
  // var startDate = lastMonday.toISOString().split('T')[0];
  // var endDate = lastSunday.toISOString().split('T')[0];
  // console.log("getDate:::", startDate, endDate);
  // Get current date
  var currentDate = new Date();

  var currentDayOfWeek = currentDate.getDay();

  // Calculate the start date of the current week
  var startDateOfWeek = new Date(currentDate);
  startDateOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

  // Calculate the end date of the current week
  var endDateOfWeek = new Date(startDateOfWeek);
  endDateOfWeek.setDate(startDateOfWeek.getDate() + 6);

  // console.log("Start date of the current week:", startDateOfWeek.toDateString());
  // console.log("End date of the current week:", endDateOfWeek.toDateString());

  var startDate = startDateOfWeek.toISOString().split('T')[0];
  var endDate = endDateOfWeek.toISOString().split('T')[0];
  // console.log("getDate:::", startDate, endDate);

  // query to check if data for the entire last week is available
  var checkWeekQuery = `SELECT COUNT(*) AS count FROM [EMS].[dbo].average_m${mNum} WHERE CONVERT(date, date_time) BETWEEN '${startDate}' AND '${endDate}'`;
  //  console.log('wwwwwwwwwwwwww',checkWeekQuery);
  sql.connect(sqlConfig, function (err) {
    var checkWeekRequest = new sql.Request();
    checkWeekRequest.query(checkWeekQuery, function (err, result) {
      if (err) {
        console.error('Error checking for data for the entire last week:', err);
      } else {
        var count = result.recordset[0].count;
        if (count > 0) {
          executeWeeklyInsertion(dateformat, mNum, startDate, endDate);
        } else {
          console.log('Data for the entire last week is not available yet.');
        }
      }
    });
  });
}

function executeWeeklyInsertion(dateformat, mNum, startDate, endDate) {

  var selectq = `SELECT COUNT(meter_id) as count FROM [EMS].[dbo].energy_consumption_weekly WHERE meter_id='${mNum}' and CONVERT(date, date_time) BETWEEN '${startDate}' AND '${endDate}'`;
  //console.log('dayQueryeeeeeeeeeeeeeeeeeee',selectq)
  // Execute the insert query
  sql.connect(sqlConfig, function (err) {
    var insertRequest = new sql.Request();
    insertRequest.query(selectq, function (err, recordset) {
      if (err) {
        // console.log('tiiiiiiiiiii',err)
      } else {
        var result = recordset.recordset;
        //console.log('wwwwwwwww',result)
        if (result[0].count > 0) {

          var weeklyQuery = `
                  INSERT INTO [EMS].[dbo].energy_consumption_weekly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh,date_time)
                  SELECT 
                      meter_id,
                      load_name,
                      AVG(Vry) AS avg_Vry,
                      AVG(Vyb) AS avg_Vyb,
                      AVG(Vbr) AS avg_Vbr,
                      AVG(Ir) AS avg_Ir,
                      AVG(Iy) AS avg_Iy,
                      AVG(Ib) AS avg_Ib,
                      AVG(PF) AS avg_PF,
                      AVG(F) AS avg_F,
                      SUM(kWh) AS total_kWh,
                      AVG(kVAh) AS avg_kVAh,
                      CONVERT(char(10), GetDate(),126)
                  FROM [EMS].[dbo].energy_consumption
                  WHERE  meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'
                  GROUP BY meter_id, load_name`;

          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(weeklyQuery, function (err) {
              if (err) {
                console.error('Error inserting data into energy_consumption_weekly table:', err);
              } else {
                // console.log('Data inserted successfully for week:', startDate, 'to', endDate);

                var dayQueryW = `DELETE TOP (1) [EMS].[dbo].energy_consumption_weekly WHERE meter_id='${mNum}' and date_time like '${today_date}%'`;
                // console.log('deletingggggggggggggggggggggggggg',dayQueryW)
                // Execute the insert query
                sql.connect(sqlConfig, function (err) {
                  var insertRequest = new sql.Request();
                  insertRequest.query(dayQueryW, function (err) {
                    if (err) {
                      //   console.error('Error updating data into energy_consumption table:', err);
                    } else {
                      //  console.log('Data Deleted successfully for date:', today_date);
                    }
                  });
                });
              }
            });
          });


        }

        else {
          console.log(' first ntry for week')
          var weeklyQuery = `
                  INSERT INTO [EMS].[dbo].energy_consumption_weekly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh,date_time)
                  SELECT 
                      meter_id,
                      load_name,
                      AVG(Vry) AS avg_Vry,
                      AVG(Vyb) AS avg_Vyb,
                      AVG(Vbr) AS avg_Vbr,
                      AVG(Ir) AS avg_Ir,
                      AVG(Iy) AS avg_Iy,
                      AVG(Ib) AS avg_Ib,
                      AVG(PF) AS avg_PF,
                      AVG(F) AS avg_F,
                      SUM(kWh) AS total_kWh,
                      AVG(kVAh) AS avg_kVAh,
                      CONVERT(char(10), GetDate(),126)
                  FROM [EMS].[dbo].energy_consumption
                  WHERE meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'
                  GROUP BY meter_id, load_name`;

          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(weeklyQuery, function (err) {
              if (err) {
                //   console.error('Error inserting data into energy_consumption_weekly table:', err);
              } else {
                // console.log('Data inserted successfully for week:', startDate, 'to', endDate);
              }
            });
          });
        }
      }
    })
  })
}
/////////////////////// from energy_consumption table to energy consumption_weekly end /////////////////////////////


//////////////////////// from energy_consumption table to energy consumption_monthly strt ///////////////////////////
function monthlyData(dateformat, mNum) {


  // Get current date
  var currentDate = new Date();

  // Get the first day of the current month
  var firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Get the last day of the current month
  var lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  //  console.log("Starting date of the current month:", firstDayOfMonth.toDateString());
  //  console.log("Ending date of the current month:", lastDayOfMonth.toDateString());

  var startDate = firstDayOfMonth.toISOString().split('T')[0];
  var endDate = lastDayOfMonth.toISOString().split('T')[0];

  // query to check if data for the entire month is available
  var checkMonthQuery = `SELECT COUNT(meter_id)  AS week_count
                            FROM [EMS].[dbo].energy_consumption
                            WHERE meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'`;

  sql.connect(sqlConfig, function (err) {
    var checkMonthRequest = new sql.Request();
    checkMonthRequest.query(checkMonthQuery, function (err, result) {
      if (err) {
        console.error('Error checking for data for the entire month:', err);
      } else {
        var weekCount = result.recordset[0].week_count;
        if (weekCount > 0) {
          executeMonthlyInsertion(dateformat, mNum);
        } else {
          console.log('Data for the entire month is not available yet.');
        }
      }
    });
  });
}

// Function to execute monthly insertion
function executeMonthlyInsertion(dateformat, mNum) {

  // Get current date
  var currentDate = new Date();

  // Get the first day of the current month
  var firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Get the last day of the current month
  var lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  var startDate = firstDayOfMonth.toISOString().split('T')[0];
  var endDate = lastDayOfMonth.toISOString().split('T')[0];

  var checkQuery = `SELECT COUNT(*) AS count FROM [EMS].[dbo].energy_consumption_monthly WHERE meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'`;

  sql.connect(sqlConfig, function (err) {
    var checkRequest = new sql.Request();
    checkRequest.query(checkQuery, function (err, checkResult) {
      if (err) {
        console.error('Error checking for existing data:', err);
      } else {
        var count = checkResult.recordset[0].count;
        // console.log("checkResult", count)
        if (count === 0) {

          var monthlyQuery = `
                      INSERT INTO [EMS].[dbo].energy_consumption_monthly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
                      SELECT
                          meter_id,
                          load_name,
                          AVG(Vry) AS avg_Vry,
                          AVG(Vyb) AS avg_Vyb,
                          AVG(Vbr) AS avg_Vbr,
                          AVG(Ir) AS avg_Ir,
                          AVG(Iy) AS avg_Iy,
                          AVG(Ib) AS avg_Ib,
                          AVG(PF) AS avg_PF,
                          AVG(F) AS avg_F,
                          SUM(kWh) AS total_kWh,
                          AVG(kVAh) AS avg_kVAh,
                          CONVERT(char(10), GetDate(),126)
                      FROM [EMS].[dbo].energy_consumption
                      WHERE meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'
                      GROUP BY meter_id, load_name`;

          //console.log("monthlyQuery::", monthlyQuery);

          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(monthlyQuery, function (err) {
              if (err) {
                //  console.error('Error inserting data into energy_consumption_monthly table:', err);
              } else {
                //console.log('Data inserted successfully for month:', formattedDate);
              }
            });
          });
        } else {
          // console.log('Data for this month already processed.');

          var monthlyQuery = `
                      INSERT INTO [EMS].[dbo].energy_consumption_monthly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
                      SELECT
                          meter_id,
                          load_name,
                          AVG(Vry) AS avg_Vry,
                          AVG(Vyb) AS avg_Vyb,
                          AVG(Vbr) AS avg_Vbr,
                          AVG(Ir) AS avg_Ir,
                          AVG(Iy) AS avg_Iy,
                          AVG(Ib) AS avg_Ib,
                          AVG(PF) AS avg_PF,
                          AVG(F) AS avg_F,
                          SUM(kWh) AS total_kWh,
                          AVG(kVAh) AS avg_kVAh,
                          CONVERT(char(10), GetDate(),126)
                      FROM [EMS].[dbo].energy_consumption
                      WHERE meter_id='${mNum}' and CONVERT(date,date_time) BETWEEN '${startDate}' AND '${endDate}'
                      GROUP BY meter_id, load_name`;

          // console.log("monthlyQuery::", monthlyQuery);

          sql.connect(sqlConfig, function (err) {
            var insertRequest = new sql.Request();
            insertRequest.query(monthlyQuery, function (err) {
              if (err) {
                console.error('Error inserting data into energy_consumption_monthly table:', err);
              } else {
                // console.log('Data inserted successfully for month: ')
                var dayQueryW = `DELETE TOP (1) [EMS].[dbo].energy_consumption_monthly WHERE meter_id='${mNum}' and date_time like '${today_date}%'`;
                // console.log('deletingggggggggggggggggggggggggg',dayQueryW)
                // Execute the insert query
                sql.connect(sqlConfig, function (err) {
                  var insertRequest = new sql.Request();
                  insertRequest.query(dayQueryW, function (err) {
                    if (err) {
                      // console.error('Error updating data into energy_consumption table:', err);
                    } else {
                      // console.log('Data Deleted successfully for date:', today_date);
                    }
                  });
                });
              }
            });
          });
        }
      }
    });
  });

}
//////////////////////// from energy_consumption table to energy consumption_monthly end ///////////////////////////

/****************************************************** Merged KWH ********************************************/





////////////// eb consumption data strt ////////////

// eb consumption live strt
app.get('/live_consumption_endpoint', (req, res) => {

  const Load_dataArr = [];

  // const liveData_Query = `
  //   WITH LatestLoadValues AS (
  //     SELECT load_name, load_value, ROW_NUMBER() OVER (PARTITION BY load_name ORDER BY date_time DESC) AS row_num
  //     FROM taco_treceability.taco_treceability.energy_consumption
  //     WHERE date_time LIKE '%${today_date}%'
  //   )
  //   SELECT load_name, load_value FROM LatestLoadValues WHERE row_num = 1
  // `;

  // const liveData_Query = `SELECT TOP 1 KWH FROM taco_treceability.taco_treceability.energy_consumption
  //                         WHERE date_time LIKE '%${today_date}%' ORDER BY date_time DESC`;

  // const liveData_Query = `DECLARE @currentDate DATE = CAST(GETDATE() AS DATE);
  //                         SELECT SUM(kWh) AS totalKWH  FROM taco_treceability.energy_consumption
  //                         WHERE date_time >= @currentDate AND date_time < DATEADD(DAY, 1, @currentDate)`;
  const liveData_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption
                            WHERE date_time >= '${today_date}'`;

  // console.log("liveData_Query::::", liveData_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(liveData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          // const load_name = result[i].load_name;
          const KWH = result[i].total_kWh;

          Load_dataArr.push({ KWH: KWH });

          console.log("Live_load_dataArrrrrrr:::::::", Load_dataArr)
        }

        res.json(Load_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
// eb consumption live end 

// eb consumption yest strt
app.get('/yesterday_consumption_endpoint', (req, res) => {
  const yest_dataArr = [];

  // const yestData_Query = `SELECT SUM(kWh) AS totalKWH FROM [taco_treceability].[taco_treceability].[energy_consumption]
  // WHERE date_time >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 1, 0) AND date_time < DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0)`;
  const yestData_Query = `SELECT SUM(kWh) AS total_kWh 	FROM [EMS].[dbo].energy_consumption 
	                        WHERE CAST(date_time AS DATE) = CAST(GETDATE() - 1 AS DATE)`;

   console.log("yestData_Querrrrrrrrrrrrrrrrrrry::::", yestData_Query)
  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(yestData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }
      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          yest_dataArr.push({ KWH: kwh });

          console.log("yest_dataArr::::", yest_dataArr)
        }
        res.json(yest_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
// eb consumption yest end

// eb consumption monthly strt 
app.get('/monthly_consumption_endpoint', (req, res) => {
  const month_dataArr = [];

  // const monthData_Query = `SELECT SUM(kWh) AS totalKWH FROM taco_treceability.energy_consumption
  //  WHERE date_time >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0)
  //  AND date_time < DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) + 1, 0)`;

  const monthData_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption
                           WHERE MONTH(date_time) = MONTH(GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())`;


  // console.log("monthData_Query::::", monthData_Query)
  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(monthData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          month_dataArr.push({ KWH: kwh });
          console.log("month_dataArrhhhhhh:::::::", month_dataArr)
        }

        res.json(month_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
// eb consumption monthly end

///////////// eb consumption data end ///////////////



///////////// power factor data strt //////////////
app.get('/live_powerFactor_endpoint', (req, res) => {
  const power_dataArr = [];

  // const livePowerData_Query = `SELECT TOP 1 PF FROM taco_treceability.energy_consumption
  //                              WHERE date_time LIKE '%${today_date}%' ORDER BY date_time DESC`;

  const livePowerData_Query = `SELECT SUM(PF) AS total_PF FROM [EMS].[dbo].energy_consumption
                             WHERE date_time >= '${today_date}'`;

  // console.log("livePowerData_Query::::", livePowerData_Query);
  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(livePowerData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }
      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const power_value = result[i].total_PF;

          power_dataArr.push({ PowerFactor: power_value });

          console.log("power_dataArr:::::::", power_dataArr)
        }
        res.json(power_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
app.get('/yesterday_powerFactor_endpoint', (req, res) => {
  const yestpower_dataArr = [];

  // const yestPowerData_Query = `SELECT SUM(PF) AS totalpower_factor FROM taco_treceability.energy_consumption
  //                              WHERE date_time >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 1, 0)
  //                              AND date_time < DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0)`;

  const yestPowerData_Query = `SELECT SUM(PF) AS total_PF FROM [EMS].[dbo].energy_consumption
                               WHERE CAST(date_time AS DATE) = DATEADD(DAY, -1, CAST(GETDATE() AS DATE))`;

  console.log("yestPowerData_Query::::", yestPowerData_Query)
  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(yestPowerData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const power_value = result[i].total_PF;

          yestpower_dataArr.push({ PowerFactor: power_value });

          console.log("yestpower_dataArrtttttt:::::::", yestpower_dataArr)
        }

        res.json(yestpower_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
app.get('/monthly_powerFactor_endpoint', (req, res) => {
  const monthPower_dataArr = [];

  // const monthlyPowerData_Query = `SELECT SUM(PF) AS total_power_factor FROM taco_treceability.energy_consumption
  //                                 WHERE  date_time >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0)
  //                                 AND date_time < DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) + 1, 0)`;

  const monthlyPowerData_Query = `SELECT SUM(PF) AS total_PF FROM [EMS].[dbo].energy_consumption
                                  WHERE MONTH(date_time) = MONTH(GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())`;


  console.log("monthlyPowerData_Query::::", monthlyPowerData_Query)
  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(monthlyPowerData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const power_value = result[i].total_PF;

          monthPower_dataArr.push({ PowerFactor: power_value });

          console.log("monthPower_dataArrrrrr:::::::", monthPower_dataArr)
        }

        res.json(monthPower_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
///////////// power factor data end //////////////




//////////////////////////// priyanka code strt //////////////////////////
/******trasnformer live strt *****/
app.get('/live_trasnformer_consumption_endpoint', (req, res) => {

  const Load_dataArr = [];
  const liveData_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption
                            WHERE date_time LIKE '%${today_date}%' AND meter_id = '1'`;

  //console.log("liveData_Query::::", liveData_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(liveData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          // const load_name = result[i].load_name;
          const KWH = result[i].total_kWh;

          Load_dataArr.push({ KWH: KWH });

          console.log("Live_load_dataArrrrrrr:::::::", Load_dataArr)
        }

        res.json(Load_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/*****trasnformer consumption live end *****/

/******trasnformer consumption yest strt ******/
app.get('/yesterday_trasnformer_consumption_endpoint', (req, res) => {

  const yest_dataArr = [];
  const yestData_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption 
                          WHERE CAST(date_time AS DATE) = CAST(GETDATE() - 1 AS DATE)
                          AND meter_id = 1`; // Filter for meter_id = 1
  //console.log("yestData_Query::::", yestData_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(yestData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }
      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          yest_dataArr.push({ KWH: kwh });

          console.log("yest_dataArr::::", yest_dataArr)
        }
        res.json(yest_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/******trasnformer consumption yest end ******/

/****** trasnformer consumption monthly strt ******/
app.get('/monthly_trasnformer_consumption_endpoint', (req, res) => {

  const month_dataArr = [];
  const monthData_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption
                           WHERE MONTH(date_time) = MONTH(GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())
                           AND meter_id = 1`;
  // console.log("monthData_Query::::", monthData_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(monthData_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          month_dataArr.push({ KWH: kwh });
          console.log("month_dataArrhhhhhh:::::::", month_dataArr)
        }

        res.json(month_dataArr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/****** trasnformer consumption monthly end ******/

///////////// trasnformer consumption data end ///////////////



///////////// generator consumption data strt ////////////////
/******generator live strt *****/
app.get('/live_Generator_consumption_endpoint', (req, res) => {

  const Load_Arr = [];
  const live_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].average_m27 WHERE date_time LIKE '%${today_date}%' AND meter_id = '27'`;

  console.log("live_Query::::", live_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(live_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        console.log('resulttttttttttttttt', recordset)
        const result = recordset.recordset;
        for (const i in result) {
          // const load_name = result[i].load_name;
          const KWH = result[i].total_kWh;

          Load_Arr.push({ KWH: KWH });

          console.log("Load_Arr generator:::::::", Load_Arr)
        }

        res.json(Load_Arr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/*****generator consumption live end *****/

/******generator consumption yest strt ******/
app.get('/yesterday_Generator_consumption_endpoint', (req, res) => {
  const yest_Arr = [];
  const yest_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption 
                              WHERE CAST(date_time AS DATE) = CAST(GETDATE() - 1 AS DATE)
                              AND meter_id = 27`;
  console.log("yest_Query::::", yest_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(yest_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }
      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          yest_Arr.push({ KWH: kwh });

          console.log("yest_Arr::::", yest_Arr)
        }
        res.json(yest_Arr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/******generator consumption yest end ******/

/****** generator consumption monthly strt ******/
app.get('/monthly_Generator_consumption_endpoint', (req, res) => {
  const month_Arr = [];
  const month_Query = `SELECT SUM(kWh) AS total_kWh FROM [EMS].[dbo].energy_consumption
                              WHERE MONTH(date_time) = MONTH(GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())
                              AND meter_id = 27`;
  console.log("month_Query::::", month_Query);

  sql.connect(sqlConfig, (err) => {
    const requestsel = new sql.Request();
    requestsel.query(month_Query, (err, recordset) => {
      if (err) {
        // console.error("Error executing query:", err);
      }

      if (recordset) {
        const result = recordset.recordset;
        for (const i in result) {
          const kwh = result[i].total_kWh;

          month_Arr.push({ KWH: kwh });
          console.log("month_Arr generator:::::::", month_Arr)
        }

        res.json(month_Arr);
      } else {
        console.error("Recordset is undefined");
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
});
/****** generator consumption monthly end ******/

/////////////// generator consumption data end ///////////////////



var Load_dataArr = [];

io.sockets.on("connection", (socket) => {



  //////rec trigger from mter data////

  eventEmitter.on('sendActiveToFront', (data) => {
    socket.emit('meterCounts', data);
  });
  ///////rec emitter ends////

  var curdate = new Date();
  var yr = curdate.getFullYear();
  var month = ("0" + (curdate.getMonth() + 1)).slice(-2);
  var day = ("0" + curdate.getDate()).slice(-2);
  var today_date_dd = yr + "-" + month + "-" + day + "" + curdate.getHours() + ":" + curdate.getMinutes() + ":" + curdate.getSeconds();
  var today_date = yr + "-" + month + "-" + day + "";
  // var today_date = day + "-" + month + "-" + yr + " " + curdate.getHours() + ":" + curdate.getMinutes() + ":" + curdate.getSeconds();


  // login strt 
  socket.on('getLogin_data', function (user_id, password) {
    var login_arr = [];

    var loginQuery = `SELECT * FROM [EMS].[dbo].ems_users WHERE user_name = '${user_id}' AND pass = '${password}'`;
    console.log("loginQuery::::", loginQuery);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(loginQuery, function (err, loginrecordset) {
        if (err) { }
        var result = loginrecordset.recordset;
        for (i in result) {
          var user_name = result[i].user_name;
          var password = result[i].pass;

          login_arr.push(user_name);
          login_arr.push(password);

        }
        socket.emit("send_Login_pass", login_arr);
        console.log("send_Login_pass::::::", login_arr);

      });
    });
  });
  // login end 


  /******* report page start **********/
  // get meter name for dropdown strt
  socket.on('getMeter_Namelist', function () {

    var meter_Arr = [];
    var SelectQue = `  SELECT DISTINCT sr_no, meter_id FROM [EMS].[dbo].ems_master ORDER BY sr_no ASC;`;

    console.log("SelectQue::::", SelectQue);
    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(SelectQue, function (err, meterecordset) {
        if (err) { }
        var result = meterecordset.recordset;
        for (i in result) {

          var meter_id = result[i].meter_id;

          meter_Arr.push(meter_id);

        }
        socket.emit("sendMeter_namelist", meter_Arr);
        console.log("sendMeter_namelist::::::", meter_Arr);

      });
    });
  });
  // get meter name for dropdown end

  // get load name for dropdown strt
  socket.on('getLoad_Namelist', function () {

    var load_Arr = [];
    var Queryload = `SELECT DISTINCT load_name FROM [EMS].[dbo].ems_master`;

    console.log("Queryload::::", Queryload);
    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(Queryload, function (err, meterecordset) {
        if (err) { }
        var result = meterecordset.recordset;
        for (i in result) {

          var load_id = result[i].load_name;

          load_Arr.push(load_id);

        }
        socket.emit("sendLoad_namelist", load_Arr);
        console.log("sendLoad_namelist::::::", load_Arr);

      });
    });
  });
  // get load name for dropdown end


  // get meter details for table data strt 
  // socket.on("view_meter_details", function (meter, toDate, fromDate) {
  //   var table_array = [];
   
  //   var Query1 = `SELECT DISTINCT meter_id, load_name, kWh, kVAh, Vry, Ir, F, PF, date_time FROM [EMS].[dbo].energy_consumption  WHERE meter_id  LIKE '${meter}' AND date_time LIKE '%${toDate}%' AND date_time LIKE '%${fromDate}%'`;
  //   console.log("selectallll::", Query1);

  //   sql.connect(sqlConfig, function (err) {
  //     if (err) {
  //       console.log(err);
  //       return;
  //     }
  //     var request = new sql.Request();
  //     request.query(Query1, function (err, recordset) {
  //       if (err) {
  //         console.log(err);
  //         return;
  //       }
  //       // if (recordset && recordset.recordset.length > 0) {
  //       recordset.recordset.forEach(function (row) {
  //         table_array.push({
  //           meter_id: row.meter_id,
  //           load_name: row.load_name,
  //           kWh: row.kWh,
  //           I: row.Ir,
  //           V: row.Vry,
  //           frequency: row.F,
  //           power_factor: row.PF,
  //           date: row.date_time,
  //         });
  //       });
  //       socket.emit("get_meter_details", table_array);
  //       console.log("get_meter_details::::::", table_array);
  //       // }
  //     });
  //   });
  // });

  socket.on("view_meter_details", function (meter, toDate, fromDate) {
    var table_array = [];
   
    var Query1 = `SELECT DISTINCT meter_id, load_name, kWh, kVAh, Vry, Ir, F, PF, date_time FROM [EMS].[dbo].energy_consumption`;

    // Check if meter ID is selected
    if (meter) {
        Query1 += ` WHERE meter_id = '${meter}'`;
    }

    // Check if toDate and fromDate are provided and construct the query accordingly
    if (toDate && fromDate) {
        Query1 += `${meter ? ' AND' : ' WHERE'} date_time BETWEEN '${fromDate}' AND '${toDate}'`;
    }

    console.log("selectallll::", Query1);

    sql.connect(sqlConfig, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        var request = new sql.Request();
        request.query(Query1, function (err, recordset) {
            if (err) {
                console.log(err);
                return;
            }
            // if (recordset && recordset.recordset.length > 0) {
            recordset.recordset.forEach(function (row) {
                table_array.push({
                    meter_id: row.meter_id,
                    load_name: row.load_name,
                    kWh: row.kWh,
                    I: row.Ir,
                    V: row.Vry,
                    frequency: row.F,
                    power_factor: row.PF,
                    date: row.date_time,
                });
            });
            socket.emit("get_meter_details", table_array);
            console.log("get_meter_details::::::", table_array);
            // }
        });
    });
});

  // get meter details for table data end 


  // get bydefault meter details table data strt 
  socket.on("bydefault_view_meter_details", function (startDate, endDate) {
    var table_array = [];
    var DefaultQuery1 = `SELECT DISTINCT meter_id, load_name, kWh, kVAh, Vry, Ir, F, PF, date_time FROM [EMS].[dbo].energy_consumption  WHERE  date_time LIKE '%${startDate}%' AND date_time LIKE '%${endDate}%'`;
    console.log("DefaultQuery1::", DefaultQuery1);

    sql.connect(sqlConfig, function (err) {
      if (err) {
        console.log(err);
        return;
      }
      var request = new sql.Request();
      request.query(DefaultQuery1, function (err, recordset) {
        if (err) {
          console.log(err);
          return;
        }
        // if (recordset && recordset.recordset.length > 0) {
        recordset.recordset.forEach(function (row) {
          table_array.push({
            meter_id: row.meter_id,
            load_name: row.load_name,
            kWh: row.kWh,
            I: row.Ir,
            V: row.Vry,
            frequency: row.F,
            power_factor: row.PF,
            date: row.date_time,
          });
        });
        socket.emit("default_get_meter_details", table_array);
        console.log("default_get_meter_details::::::", table_array);
        // }
      });
    });
  });
  // get  bydefault meter details table data end 

  // get trend chart data strt 
  socket.on("filter_details", function (meterName, load_Data) {
    var graph_array = [];
    var Query2 = `SELECT DISTINCT meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].energy_consumption  WHERE meter_id LIKE'%${meterName}%' AND load_name LIKE '%${load_Data}%'`;
    console.log("Query2::", Query2);

    sql.connect(sqlConfig, function (err) {
      if (err) {
        console.log(err);
        return;
      }
      var request = new sql.Request();
      request.query(Query2, function (err, recordset) {
        if (err) {
          console.log(err);
          return;
        }
        // if (recordset && recordset.recordset.length > 0) {
        recordset.recordset.forEach(function (row) {
          graph_array.push({
            meter_id: row.meter_id,
            load_name: row.load_name,
            kWh: row.kWh,
            kVAh: row.kVAh,
            Ir: row.Ir,
            Vry: row.Vry,
            F: row.F,
            PF: row.PF,
            date: row.date_time,
          });
        });
        socket.emit("filter_trend_Chart", graph_array);
        console.log("filter_trend_Chart::::::", graph_array);
        // }
      });
    });
  });
  // get trend chart data end 
  /********* report page end **********/


  /********* admin start **********/
  // get admin details strt
  socket.on("getmasterData", function (dept, sub_Dept, meter_id, meter_name, load_name, added_by) {

    var form_array = [];
    var Query2 = `INSERT INTO [EMS].[dbo].ems_master (department, sub_department, meter_id, meter_name, load_name, added_by)
                VALUES ('${dept}', '${sub_Dept}', '${meter_id}', '${meter_name}', '${load_name}', '${added_by}')`;

    console.log("Query2::", Query2);

    sql.connect(sqlConfig, function (err) {
      if (err) {
        console.log(err);
        return;
      }
      var request = new sql.Request();
      request.query(Query2, function (err, recordset) {
        if (err) {
          console.log(err);
          return;
        }
        // socket.emit("get_meter_details", table_array);
        console.log("Inserted Successfully");
        // }
      });
    });
  });
  // get admin details strt
  /********* admin end **********/



  // get data for live meter strt //
  socket.on('get_live_load_data_Chart', function () {
    var selectQuery = '';
    var meterCountQuery = `SELECT COUNT(*) AS meter_count FROM [EMS].[dbo].ems_master`;

      sql.connect(sqlConfig, function (err) {
          var requestMeterCount = new sql.Request();
          requestMeterCount.query(meterCountQuery, function (err, recordset) {
            if (err) {
                console.error("Error getting meter count:", err);
                return;
            }
            var meterCount = recordset.recordset[0].meter_count;
            selectQuery = '';

            for (let i = 1; i <= meterCount; i++) {
                selectQuery += `SELECT TOP(1) sr_no,meter_id, kWh FROM [EMS].[dbo].master_live_data_m${i}`;
                    //WHERE CONVERT(date, date_time) = CONVERT(date, GETDATE())
                    //AND DATEPART(HOUR, date_time) = DATEPART(HOUR, GETDATE())`;

                // selectQuery += `
                // SELECT '1' AS meter_id, kWh FROM [taco_treceability].[taco_treceability].[average_m1]
                // WHERE CONVERT(date, date_time) = CONVERT(date, GETDATE())
                //     AND DATEPART(HOUR, date_time) = DATEPART(HOUR, GETDATE())
                // UNION ALL
                // SELECT '2' AS meter_id, kWh FROM [taco_treceability].[taco_treceability].[average_m2]
                // WHERE CONVERT(date, date_time) = CONVERT(date, GETDATE())
                //     AND DATEPART(HOUR, date_time) = DATEPART(HOUR, GETDATE()) 
                // UNION ALL
                // SELECT '3' AS meter_id, kWh FROM [taco_treceability].[taco_treceability].[average_m3]
                // WHERE CONVERT(date, date_time) = CONVERT(date, GETDATE())
                //     AND DATEPART(HOUR, date_time) = DATEPART(HOUR, GETDATE())`;

                // Add UNION ALL except for the last iteration
                if (i < meterCount) {
                    selectQuery += ' UNION ALL ';
                }
            }
              // ORDER BY statement to sort by meter_id
              selectQuery += ' ORDER BY sr_no DESC;';
              console.log("selectQuery:::", selectQuery);
              executeQuery(selectQuery);
          });
      });

  });

  function executeQuery(query) {
    console.log("selectQuery::::", query);
    sql.connect(sqlConfig, function (err) {
      if (err) {
        console.error("Error connecting to SQL server:", err);
        return;
      }

      var requestsel = new sql.Request();
      requestsel.query(query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var meter_no = result[i].meter_id
            var kWh = result[i].kWh;

            Load_dataArr.push(meter_no);
            Load_dataArr.push(kWh);
          }
          socket.emit("send_meter_count", Load_dataArr);
          console.log("send_meter_count::::::", Load_dataArr);
        }
      });
    });
  }
  // get data for live meter end //


  /************************************** index sockets strt ************************************/

  /********bar chart og *********/
  // socket.on("get_load_data_Chart", function () {
  //   var Load_dataArr = [];

  //   // var selectQuery = `WITH LatestLoadValues AS (SELECT load_name, kWh, ROW_NUMBER() OVER (PARTITION BY load_name ORDER BY date_time DESC) AS row_num
  //   //           FROM taco_treceability.taco_treceability.energy_consumption
  //   //           WHERE date_time LIKE '%${today_date}%')
  //   //           SELECT load_name, kWh FROM LatestLoadValues WHERE row_num = 1`;

  //   var selectQuery = `SELECT load_name, SUM(kWh) AS total_kWh FROM [taco_treceability].[energy_consumption]
  //     WHERE DATEPART(WEEK, date_time) = DATEPART(WEEK, GETDATE())  AND YEAR(date_time) = YEAR(GETDATE()) GROUP BY load_name`;

  //   console.log("selectQuery::::", selectQuery);

  //   sql.connect(sqlConfig, function (err) {
  //     var requestsel = new sql.Request();
  //     requestsel.query(selectQuery, function (err, recordset) {
  //       if (err) {
  //         console.error("Error executing query:", err);
  //         return;
  //       }
  //       if (recordset) {
  //         var result = recordset.recordset;
  //         for (var i in result) {
  //           var load_name = result[i].load_name;
  //           var kWh = result[i].total_kWh;

  //           Load_dataArr.push(load_name);
  //           Load_dataArr.push(kWh);
  //         }

  //         socket.emit("send_load_data_Chart", Load_dataArr);
  //         console.log("send_load_data_Chart::::::", Load_dataArr);
  //       }
  //     });
  //   });
  // });
  /********bar chart og *********/

  // get kwh count bar chart strt
  socket.on("get_load_data_Chart", function (interval) {
    var Load_dataArr = [];
    var selectQuery;

    switch (interval) {
      case 'hourly':
        var meterCountQuery = `SELECT meter_id FROM [EMS].[dbo].ems_master`;
        // Execute the query to get the meter IDs
        sql.connect(sqlConfig, function (err) {
          var requestMeterIds = new sql.Request();
          requestMeterIds.query(meterCountQuery, function (err, recordset) {
            if (err) {
              console.error("Error getting meter IDs:", err);
              return;
            }

            var meterIds = recordset.recordset;
            var availableTables = [];

            meterIds.forEach(function (meter) {
              var tableName = `[EMS].[dbo].average_m${meter.meter_id}`;
              var tableExistsQuery = `SELECT COUNT(*) AS table_exists FROM information_schema.tables WHERE table_schema = '[EMS].[dbo]' AND table_name = 'average_m${meter.meter_id}'`;
              // Execute query to check if the table exists
              sql.query(tableExistsQuery, function (err, recordset) {
                if (err) {
                  console.error(`Error checking existence of table ${tableName}:`, err);
                  return;
                }
                // If the table exists, add it to the list of available tables
                if (recordset.recordset[0].table_exists > 0) {
                  availableTables.push(tableName);
                }

                // If this is the last iteration, generate and execute the SELECT queries
                if (meter === meterIds[meterIds.length - 1]) {
                  generateAndExecuteQueries(availableTables);
                }
              });
            });
          });
        });
        break;
      case 'weekly':
        selectQuery = `SELECT load_name, DATEPART(WEEK, date_time) AS week_number, SUM(kWh) AS kWh
                          FROM [[EMS].[dbo]].[energy_consumption]
                          WHERE DATEPART(WEEK, date_time) = DATEPART(WEEK, GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())
                          GROUP BY load_name, DATEPART(WEEK, date_time)`;
        executeQuery(selectQuery);
        break;
      case 'monthly':
        selectQuery = `SELECT load_name, SUM(kWh) AS kWh
                          FROM [EMS].[dbo].energy_consumption
                          WHERE MONTH(date_time) = MONTH(GETDATE()) AND YEAR(date_time) = YEAR(GETDATE())
                          GROUP BY load_name`;
        executeQuery(selectQuery);
        break;
      default:
        // Default query if no valid interval is provided
        selectQuery = `SELECT load_name, kWh FROM [EMS].[dbo].energy_consumption`;
        executeQuery(selectQuery);
        break;
    }

    function executeQuery(query) {
      sql.query(query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var load_name = result[i].load_name;
            var kWh = result[i].kWh;
            Load_dataArr.push(load_name);
            Load_dataArr.push(kWh);
          }
          socket.emit("send_load_data_Chart", Load_dataArr);
          console.log("send_load_data_Chart::::::", Load_dataArr);
        }
      });
    }

    function generateAndExecuteQueries(availableTables) {
      var dynamicSelectQuery = '';

      availableTables.forEach(function (tableName, index) {
        var meterId = index + 1; // Increment the meter ID starting from 1
        dynamicSelectQuery += `SELECT meter_id, load_name, date_time, kWh 
                               FROM ${tableName}
                               WHERE CONVERT(date, date_time) = CONVERT(date, GETDATE())`;
        //AND DATEPART(HOUR, date_time) = DATEPART(HOUR, GETDATE())`;

        if (index < availableTables.length - 1) {
          dynamicSelectQuery += ' UNION ALL ';
        }
      });

      dynamicSelectQuery += ' ORDER BY date_time;';

      console.log("SELECT query:", dynamicSelectQuery);

      sql.query(dynamicSelectQuery, function (err, recordset) {
        if (err) {
          console.error("Error executing dynamic SELECT queries:", err);
          return;
        }
        console.log("Resultset:", recordset);

        var Load_dataArr = [];
        for (var i in recordset.recordset) {
          var load_name = recordset.recordset[i].load_name;
          var kWh = recordset.recordset[i].kWh;
          Load_dataArr.push(load_name);
          Load_dataArr.push(kWh);
        }
        socket.emit("send_load_data_Chart", Load_dataArr);
        console.log("send_load_data_Chart::::::", Load_dataArr);
      });
    }
  });
  // get kwh count bar chart end


  //////////////////// transformer graph strt ///////////////////////////////
  socket.on("get_transformer_data_Chart", function () {
    var Load_dataArr = [];

    var currentDate = new Date();
    var start_of_week = new Date(currentDate);
    start_of_week.setDate(currentDate.getDate() - 6);
    start_of_week.setHours(0, 0, 0, 0);

    var end_of_week = new Date(currentDate);
    end_of_week.setHours(23, 59, 59, 999);

    const selectQuery1 = `DECLARE @start_of_week DATETIME;
                          DECLARE @end_of_week DATETIME;
            
        SET @start_of_week = '${start_of_week.toISOString()}'; 
        SET @end_of_week = '${end_of_week.toISOString()}'; 

        SELECT  DATEPART(WEEKDAY, date_time) AS day_of_week, SUM(kWh) AS total_kWh
        FROM [EMS].[dbo].energy_consumption
        WHERE  date_time >= @start_of_week AND date_time <= @end_of_week AND meter_id = '1'
        GROUP BY  DATEPART(WEEKDAY, date_time)`;
    console.log("Query:::", selectQuery1);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(selectQuery1, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var day_of_week = result[i].day_of_week;
            var total_kWh = result[i].total_kWh;

            Load_dataArr.push({
              day_of_week: day_of_week,
              total_kWh: total_kWh
            });
          }

          socket.emit("send_transformer_data_Chart", Load_dataArr);
          console.log("send_transformer_data_Chart", Load_dataArr);
        }
      });
    });
  });
  //////////////////// transformer graph end ///////////////////////////////


  //////////////////// Generator graph strt //////////////////////////////
  socket.on("get_generator_data_Chart", function () {
    var GEN_Arr = [];

    // Get the start and end dates for the past 7 days
    var currentDate = new Date();
    var start_of_week = new Date(currentDate);
    start_of_week.setDate(currentDate.getDate() - 6);
    start_of_week.setHours(0, 0, 0, 0);

    var end_of_week = new Date(currentDate);
    end_of_week.setHours(23, 59, 59, 999);

    const selectQuery3 = `
        DECLARE @start_of_week DATETIME;
        DECLARE @end_of_week DATETIME;
      
       
        SET @start_of_week = '${start_of_week.toISOString()}';
        SET @end_of_week = '${end_of_week.toISOString()}';

        SELECT  DATEPART(WEEKDAY, date_time) AS day_of_week, SUM(kWh) AS total_kWh
        FROM [EMS].[dbo].energy_consumption
        WHERE  date_time >= @start_of_week AND date_time <= @end_of_week AND meter_id = '27'
        GROUP BY DATEPART(WEEKDAY, date_time)`;
    console.log("Query:::", selectQuery3);


    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(selectQuery3, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var day_of_week = result[i].day_of_week;
            var total_kWh = result[i].total_kWh;

            GEN_Arr.push({
              day_of_week: day_of_week,
              total_kWh: total_kWh
            });
          }

          socket.emit("send_generator_data_Chart", GEN_Arr);
          console.log("send_generator_data_Chart", GEN_Arr);
        }
      });
    });
  });
  //////////////////// Generator graph end ////////////////////////////////

  /*************************************** index sockets end *************************************/


  /*************************************** trend data chart strt *********************************/

  /* trend chart for processmcc1 */
  socket.on("trend_Chart_process_mcc1", function () {

    var param1 = [];
    var param1Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m2  WHERE load_name = 'Process MCC-1'  AND date_time LIKE '%${today_date}%'`;
    console.log("param1Query::::", param1Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param1Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param1.push(V);
            param1.push(I);
            param1.push(power_factor);
            param1.push(frequency);
            param1.push(kwh);
            param1.push(kvah);
            param1.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc1", param1);
          console.log("send_trend_Chart_process_mcc1::::::", param1);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc2 */
  socket.on("trend_Chart_process_mcc2", function () {

    var param2_dataArr = [];
    var param2Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m3  WHERE load_name = 'Process MCC-2'  AND date_time LIKE '%${today_date}%'`;
    console.log("param2Query::::", param2Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param2Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param2_dataArr.push(V);
            param2_dataArr.push(I);
            param2_dataArr.push(power_factor);
            param2_dataArr.push(frequency);
            param2_dataArr.push(kwh);
            param2_dataArr.push(kvah);
            param2_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc2", param2_dataArr);
          console.log("send_trend_Chart_process_mcc2::::::", param2_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc3 */
  socket.on("trend_Chart_process_mcc3", function () {

    var param3_dataArr = [];
    var param3Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m4  WHERE load_name = 'Process MCC-3'  AND date_time LIKE '%${today_date}%'`;
    console.log("param3Query::::", param3Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param3Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param3_dataArr.push(V);
            param3_dataArr.push(I);
            param3_dataArr.push(power_factor);
            param3_dataArr.push(frequency);
            param3_dataArr.push(kwh);
            param3_dataArr.push(kvah);
            param3_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc3", param3_dataArr);
          console.log("send_trend_Chart_process_mcc3::::::", param3_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc4 */
  socket.on("trend_Chart_process_mcc4", function () {

    var param4_dataArr = [];
    var param4Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m6  WHERE load_name = 'Process MCC-4'  AND date_time LIKE '%${today_date}%'`;
    console.log("param4Query::::", param4Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param4Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param4_dataArr.push(V);
            param4_dataArr.push(I);
            param4_dataArr.push(power_factor);
            param4_dataArr.push(frequency);
            param4_dataArr.push(kwh);
            param4_dataArr.push(kvah);
            param4_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc4", param4_dataArr);
          console.log("send_trend_Chart_process_mcc4::::::", param4_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc5 */
  socket.on("trend_Chart_process_mcc5", function () {

    var param5_dataArr = [];
    var param5Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m7  WHERE load_name = 'Process MCC-5'  AND date_time LIKE '%${today_date}%'`;
    console.log("param5Query::::", param5Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param5_dataArr, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param5_dataArr.push(V);
            param5_dataArr.push(I);
            param5_dataArr.push(power_factor);
            param5_dataArr.push(frequency);
            param5_dataArr.push(kwh);
            param5_dataArr.push(kvah);
            param5_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc4", param5_dataArr);
          console.log("send_trend_Chart_process_mcc4::::::", param5_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc6 */
  socket.on("trend_Chart_process_mcc6", function () {

    var param6_dataArr = [];
    var param6Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m8  WHERE load_name = 'Process MCC-6'  AND date_time LIKE '%${today_date}%'`;
    console.log("param6Query::::", param6Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param6_dataArr, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param6_dataArr.push(V);
            param6_dataArr.push(I);
            param6_dataArr.push(power_factor);
            param6_dataArr.push(frequency);
            param6_dataArr.push(kwh);
            param6_dataArr.push(kvah);
            param6_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc4", param6_dataArr);
          console.log("send_trend_Chart_process_mcc4::::::", param6_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc7 */
  socket.on("trend_Chart_process_mcc7", function () {

    var param7_dataArr = [];
    var param7Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m10  WHERE load_name = 'Process MCC-7'  AND date_time LIKE '%${today_date}%'`;
    console.log("param7Query::::", param7Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param7Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param7_dataArr.push(V);
            param7_dataArr.push(I);
            param7_dataArr.push(power_factor);
            param7_dataArr.push(frequency);
            param7_dataArr.push(kwh);
            param7_dataArr.push(kvah);
            param7_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc7", param7_dataArr);
          console.log("send_trend_Chart_process_mcc7::::::", param7_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc8 */
  socket.on("trend_Chart_process_mcc8", function () {

    var param8_dataArr = [];
    var param8Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m11  WHERE load_name = 'Process MCC-8'  AND date_time LIKE '%${today_date}%'`;
    console.log("param8Query::::", param8Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param8Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param8_dataArr.push(V);
            param8_dataArr.push(I);
            param8_dataArr.push(power_factor);
            param8_dataArr.push(frequency);
            param8_dataArr.push(kwh);
            param8_dataArr.push(kvah);
            param8_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc8", param8_dataArr);
          console.log("send_trend_Chart_process_mcc8::::::", param8_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for process_mcc9 */
  socket.on("trend_Chart_process_mcc9", function () {

    var param9_dataArr = [];
    var param9Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m12  WHERE load_name = 'Process MCC-9'  AND date_time LIKE '%${today_date}%'`;
    console.log("param9Query::::", param9Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param9Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param9_dataArr.push(V);
            param9_dataArr.push(I);
            param9_dataArr.push(power_factor);
            param9_dataArr.push(frequency);
            param9_dataArr.push(kwh);
            param9_dataArr.push(kvah);
            param9_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_process_mcc9", param9_dataArr);
          console.log("send_trend_Chart_process_mcc9::::::", param9_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for capacitor_bank1 */
  socket.on("trend_Chart_capacitor_bank1", function () {

    var param10_dataArr = [];
    var param10Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m14  WHERE load_name = 'Capacitor Bank-1'  AND date_time LIKE '%${today_date}%'`;
    console.log("param10Query::::", param10Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param10Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param10_dataArr.push(V);
            param10_dataArr.push(I);
            param10_dataArr.push(power_factor);
            param10_dataArr.push(frequency);
            param10_dataArr.push(kwh);
            param10_dataArr.push(kvah);
            param10_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_capacitor_bank1", param10_dataArr);
          console.log("send_trend_Chart_capacitor_bank1::::::", param10_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for capacitor_bank2 */
  socket.on("trend_Chart_capacitor_bank2", function () {

    var param12_dataArr = [];
    var param12Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m15  WHERE load_name = 'Capacitor Bank-2'  AND date_time LIKE '%${today_date}%'`;
    console.log("param12Query::::", param12Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param12Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param12_dataArr.push(V);
            param12_dataArr.push(I);
            param12_dataArr.push(power_factor);
            param12_dataArr.push(frequency);
            param12_dataArr.push(kwh);
            param12_dataArr.push(kvah);
            param12_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_capacitor_bank2", param12_dataArr);
          console.log("send_trend_Chart_capacitor_bank2::::::", param12_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });
  /* trend chart for capacitor_bank3 */
  socket.on("trend_Chart_capacitor_bank3", function () {

    var param13_dataArr = [];
    var param13Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m16  WHERE load_name = 'Capacitor Bank-3'  AND date_time LIKE '%${today_date}%'`;
    console.log("param13Query::::", param13Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param13Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param13_dataArr.push(V);
            param13_dataArr.push(I);
            param13_dataArr.push(power_factor);
            param13_dataArr.push(frequency);
            param13_dataArr.push(kwh);
            param13_dataArr.push(kvah);
            param13_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_capacitor_bank3", param13_dataArr);
          console.log("send_trend_Chart_capacitor_bank3::::::", param13_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for fire_hydrant */
  socket.on("trend_Chart_fire_hydrant", function () {

    var param14_dataArr = [];
    var param14Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m18  WHERE load_name = 'Fire Hydrant MCC'  AND date_time LIKE '%${today_date}%'`;
    console.log("param14Query::::", param14Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param14Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param14_dataArr.push(V);
            param14_dataArr.push(I);
            param14_dataArr.push(power_factor);
            param14_dataArr.push(frequency);
            param14_dataArr.push(kwh);
            param14_dataArr.push(kvah);
            param14_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_fire_hydrant", param14_dataArr);
          console.log("send_trend_Chart_fire_hydrant::::::", param14_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for lighting_master */
  socket.on("trend_Chart_lighting_master", function () {

    var param15_dataArr = [];
    var param15Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m22  WHERE load_name = 'Lighting Master PDB'  AND date_time LIKE '%${today_date}%'`;
    console.log("param15Query::::", param15Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param15Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param15_dataArr.push(V);
            param15_dataArr.push(I);
            param15_dataArr.push(power_factor);
            param15_dataArr.push(frequency);
            param15_dataArr.push(kwh);
            param15_dataArr.push(kvah);
            param15_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_lighting_master", param15_dataArr);
          console.log("send_trend_Chart_lighting_master::::::", param15_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for ETP_MCC */
  socket.on("trend_Chart_ETP_MCC", function () {

    var param16_dataArr = [];
    var param16Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m23  WHERE load_name = 'ETP MCC'  AND date_time LIKE '%${today_date}%'`;
    console.log("param16Query::::", param16Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param16Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param16_dataArr.push(V);
            param16_dataArr.push(I);
            param16_dataArr.push(power_factor);
            param16_dataArr.push(frequency);
            param16_dataArr.push(kwh);
            param16_dataArr.push(kvah);
            param16_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_ETP_MCC", param16_dataArr);
          console.log("send_trend_Chart_ETP_MCC::::::", param16_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for electrical_chiller1 */
  socket.on("trend_Chart_electrical_chiller1", function () {

    var param17_dataArr = [];
    var param17Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m25  WHERE load_name = 'Electrical Chiller-1'  AND date_time LIKE '%${today_date}%'`;
    console.log("param17Query::::", param17Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param17Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param17_dataArr.push(V);
            param17_dataArr.push(I);
            param17_dataArr.push(power_factor);
            param17_dataArr.push(frequency);
            param17_dataArr.push(kwh);
            param17_dataArr.push(kvah);
            param17_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_electrical_chiller1", param17_dataArr);
          console.log("send_trend_Chart_electrical_chiller1::::::", param17_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /* trend chart for electrical_chiller2 */
  socket.on("trend_Chart_electrical_chiller2", function () {

    var param18_dataArr = [];
    var param18Query = `SELECT DISTINCT Ir, Vry, PF, F, kWh, kVAh, date_time FROM [EMS].[dbo].average_m26  WHERE load_name = 'Electrical Chiller-2'  AND date_time LIKE '%${today_date}%'`;
    console.log("param18Query::::", param18Query);

    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(param18Query, function (err, recordset) {
        if (err) {
          console.error("Error executing query:", err);
          return;
        }
        if (recordset) {
          var result = recordset.recordset;
          for (var i in result) {
            var V = result[i].Vry;
            var I = result[i].Ir;
            var power_factor = result[i].PF;
            var frequency = result[i].F;
            var kwh = result[i].kWh;
            var kvah = result[i].kVAh;
            var date_time = result[i].date_time;

            param18_dataArr.push(V);
            param18_dataArr.push(I);
            param18_dataArr.push(power_factor);
            param18_dataArr.push(frequency);
            param18_dataArr.push(kwh);
            param18_dataArr.push(kvah);
            param18_dataArr.push(date_time);
          }

          socket.emit("send_trend_Chart_electrical_chille2", param18_dataArr);
          console.log("send_trend_Chart_electrical_chiller2::::::", param18_dataArr);
        } else {
          console.error("Recordset is undefined");
        }
      });
    });
  });

  /*************************************** trend data chart end *********************************/


  /**************************************mail strt ***********************************/
  socket.on('get_mail_details', function (mail_id, department) {
    console.log("get_mail_details", mail_id, department);

    var insertQuery = `INSERT INTO taco_treceability.mail_list (mail_id, department) VALUES ('${mail_id}', '${department}')`;
    console.log("insertQuery",insertQuery);
    
    sql.connect(sqlConfig, function (err) {
      var requestsel = new sql.Request();
      requestsel.query(insertQuery, function (err, mailrecordset) {
        if (err) {
          console.error("Error executing SQL query:", err);
          return;
        }
        console.log("Data Inserted Successfully");
      });
    });
  });
   /******************* display gmail list *******************************/
   socket.on("delete_mailid", function () {

    var mail_list = [];
    var globMailList = [];

    var query = `SELECT * FROM taco_treceability.mail_list`;
        console.log("query", query);

        sql.connect(sqlConfig, function (err) {
          var requestsel = new sql.Request();
          requestsel.query(query, function (err, loginrecordset) {
            if (err) {}
            var result = loginrecordset.recordset;
            for (i in result) {
              var sr_no = result[i].sr_no;
              var mail_id = result[i].mail_id;
              var dept = result[i].department;
             
              mail_list.push(sr_no); 
              mail_list.push(mail_id); 
              mail_list.push(dept);        
            
            }
            console.log("delete_data::::", mail_list);
            socket.emit('delete_data', mail_list);

          });
        });
    
   
});
/********************* display gmail list ******************************/

/*********************  delete gmail list *****************************/
socket.on('delete_mail_List', function (sr_no) {
  console.log("mail no***************", sr_no);
   var delQue = `DELETE FROM taco_treceability.mail_list  WHERE sr_no ='${sr_no}'`;
      console.log("delQue",delQue);
  // });

  sql.connect(sqlConfig, function (err) {
    var requestsel = new sql.Request();
    requestsel.query(delQue, function (err, mailrecordset) {
      if (err) {
        console.error("Error executing SQL query:", err);
        return;
      }
      console.log("Mail List Deleted****");
    });
  });
});
/*********************  delete gmail list ******************************/

////////////////////////////edit ////////////////////////////////////////////////
   socket.on("edit_mailid", function () {

    var mail_list = [];
    var globMailList = [];

    var query = `SELECT * FROM taco_treceability.mail_list`;
        console.log("query", query);

        sql.connect(sqlConfig, function (err) {
          var requestsel = new sql.Request();
          requestsel.query(query, function (err, loginrecordset) {
            if (err) {}
            var result = loginrecordset.recordset;
            for (i in result) {
              var sr_no = result[i].sr_no;
              var mail_id = result[i].mail_id;
              var dept = result[i].department;
             
              mail_list.push(sr_no); 
              mail_list.push(mail_id); 
              mail_list.push(dept);        

            }
            console.log("delete_data::::", mail_list);
            socket.emit('delete_data', mail_list);

          });
        });
});

socket.on('edit_mail_List', function (data) {
  var sr_no = data.sr_no;
  var newMailId = data.mail_id;
  var newDepartment = data.department;

  var editQue = `UPDATE taco_treceability.mail_list SET mail_id = '${newMailId}',department = '${newDepartment}'
                 WHERE sr_no = '${sr_no}';`;

  console.log("editQue", editQue);

  sql.connect(sqlConfig, function (err) {
      if (err) {
          console.error("Error connecting to database:", err);
          return;
      }

      var requestsel = new sql.Request();
      requestsel.query(editQue, function (err, mailrecordset) {
          if (err) {
              console.error("Error executing SQL query:", err);
              return;
          }
          console.log("Mail List Edited****");
      });
  });
});
  /**************************************mail end ***********************************/


});
