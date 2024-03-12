const net = require('net');
const sql = require('mssql');
const { log } = require('async');
const express = require('express');
const http = require('http');
const io = require('socket.io');

const app = express();
const server = http.createServer(app);
 

// Database configuration
const sqlConfig = {
    user: "admin",
    password: "admin",
    database: "taco_treceability",
    server: 'OMKAR',
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

// Create a database connection pool
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.then(() => {
    console.log('Connected to the database::', sqlConfig);
}).catch(err => {
    console.error('Error connecting to database:', err);
});


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
    var SelectQuery = `SELECT count(meter_id) as totalMeters FROM taco_treceability.taco_treceability.master`;
    // console.log("SelectQue1::::", SelectQuery);
    sql.connect(sqlConfig, function (err) {
        var requestsel = new sql.Request();
        requestsel.query(SelectQuery, function (err, recordset) {
            var result = recordset.recordset;
            if (err) { 
                
            } else {
                total_meter_count = result[0].totalMeters;
                console.log("getmetercount::", total_meter_count);
                for (var i= 1; i <= parseInt(total_meter_count); i++ ) {
                eval("global.prev_kwh_M"+i+"_value" + " = " + "0" );
                eval("global.prev_kvah_M"+i+"_value" + " = " + "0" );

                eval("global.perHr_consumption_M"+i+ " = " + "0" );
                eval("global.perHr_consumption_kvah_M"+i+ " = " + "0" );
                
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

    /******** Create a TCP server ********/
    //    const server = net.createServer();

    // // Listen for incoming connections
    //     server.on('connection', handleConnection);
    //     server.listen(5003, function () {
    //         console.log('server listening to %j', server.address());
    //     });



// Create first server instance listening on port 5001
    const server1 = net.createServer();
    server1.on('connection', handleConnection);
    server1.listen(5001, function () {
        console.log('Server 1 listening on port 5001');
    });

    // Create second server instance listening on port 5003
    const server2 = net.createServer();
    server2.on('connection', handleConnection);
    server2.listen(5003, function () {
        console.log('Server 2 listening on port 5003');
    });

   
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
    //console.log('Connection data - %s', dataString);

    var msg ;
    // console.log('data[o]',dataString[0])
    if(dataString[0] == 'D'){
         msg = dataString.split('|');
         console.log('msg',msg)
         
    if(msg[0] == "Deactive"){
        // console.log('msg[1]',msg[1])
        // console.log('activeMeters before',activeMeters)
        const index = activeMeters.indexOf(msg[1]);
        if (index > -1) { // only splice array when item is found
            activeMeters.splice(index, 1); // 2nd parameter means remove one item only
            // console.log('activeMeters after',activeMeters)
        }      
    }
    }
    else{
        const values = dataString.split(',');
        const meter_id_M1_value = values[0]; 
        const index = activeMeters.indexOf(meter_id_M1_value);
        if (index > -1) { // only splice array when item is found
          
        }
        else{
            activeMeters.push(meter_id_M1_value);
        }
       
        
   
    // Fetch load name from master table based on meter ID
    const loadNameQuery = `SELECT meter_id, load_name FROM taco_treceability.master WHERE meter_id = '${meter_id_M1_value}'`;
    console.log("loadNameQuery::::", loadNameQuery);
   
    sql.connect(sqlConfig, function(err) {
    var request = new sql.Request();
    request.query(loadNameQuery, function(err, result) {
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
                const insertQuery = `INSERT INTO taco_treceability.master_live_data_m${meter_id_M1_value} (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh)
                VALUES ('${meter_id_M1_value}', '${load_name_M1}', '${Vry_M1_value}', '${Vyb_M1_value}', '${Vbr_M1_value}', '${Ir_M1_value}', '${Iy_M1_value}', '${Ib_M1_value}', '${PF_M1_value}', '${F_M1_value}', '${temp_prekwh}', '${temp_prekvah}')`;
                    
               // console.log("insertQuery::", insertQuery);
                
                    // Execute insertion query
                sql.connect(sqlConfig, function(err) {
                    var request = new sql.Request();
                    request.query(insertQuery, function(err) {
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

                         console.log('formattedDate::::::::', formattedDate);
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

     socket.emit('meterCounts', { activeMeters, inactiveMeterCount });

     console.log("Active meters:", activeMeters);
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
        var SelectQue1 = `SELECT * FROM taco_treceability.taco_treceability.average_m${mNum} where date_time like '${dateformat}%'`;
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
                    var SelectQue2 = `SELECT * FROM taco_treceability.taco_treceability.master_live_data_m${mNum} where date_time like '${dateformat}%'`;
                    // console.log("SelectQue2::::", SelectQue2);

                    sql.connect(sqlConfig, function (err) {
                        var requestsel = new sql.Request();
                        requestsel.query(SelectQue2, function (err, meterecordset) {
                            if (err) {
                            } else { }
                            var result = meterecordset.recordset;

                            if (result.length > 0) {
                                const avgQuery = `
                                INSERT INTO taco_treceability.average_m${mNum} (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
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
                                FROM taco_treceability.master_live_data_m${mNum}
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
                                            dailyData(dateformat, mNum);
                                            weeklyData(dateformat, mNum);
                                            monthlyData(dateformat, mNum);
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
        const truncateQuery = `DELETE taco_treceability.master_live_data_m${meterN} where date_time like '${dateformat}%'`;
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
        console.log("yesterdayDate", yesterdayDate);

        var formattedYesterdayDate = getDateString(yesterdayDate);
        console.log("formattedYesterdayDate", formattedYesterdayDate);
    
        // Build the query to check if data for yesterday exists
        var checkQuery = `SELECT COUNT(*) AS count FROM taco_treceability.energy_consumption WHERE date_time >= '${formattedYesterdayDate} 00:00:00'`;
    
        // Execute the check query
        sql.connect(sqlConfig, function (err) {
            var checkRequest = new sql.Request();
            checkRequest.query(checkQuery, function (err, checkResult) {
                if (err) {
                    console.error('Error checking for existing data:', err);
                } else {
                    var count = checkResult.recordset[0].count;
                    if (count === 0) {
                        // If no data exists for yesterday, insert the data
                        var dayQuery = `
                            INSERT INTO taco_treceability.energy_consumption (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
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
                                   DATEADD(DAY, DATEDIFF(DAY, 0, '${formattedYesterdayDate}'), 0) AS date_time
                            FROM taco_treceability.average_m${mNum} WHERE date_time >= '${formattedYesterdayDate} 00:00:00'  GROUP BY meter_id, load_name`;
    
                        // Execute the insert query
                        sql.connect(sqlConfig, function (err) {
                            var insertRequest = new sql.Request();
                            insertRequest.query(dayQuery, function (err) {
                                if (err) {
                                    console.error('Error inserting data into energy_consumption table:', err);
                                } else {
                                    console.log('Data inserted successfully for date:', formattedYesterdayDate);
                                }
                            });
                        });
                    } else {
                        console.log('Data for date already processed.', formattedYesterdayDate);
                    }
                }
            });
        });
    }
    
    //////////// Function to get data from average to energy_consumption /////////////


   
   ////////////////////// from energy_consumption table to energy consumption_weekly strt //////////////////////////// 
    function weeklyData(dateformat, mNum) {
      
        var currentDate = new Date();
        var currentDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
        var lastMonday = new Date(currentDate);
        lastMonday.setDate(currentDate.getDate() - currentDay - 6); 

        var lastSunday = new Date(currentDate);
        lastSunday.setDate(currentDate.getDate() - currentDay); 

        // Format the start and end dates as "YYYY-MM-DD"
        var startDate = lastMonday.toISOString().split('T')[0];
        var endDate = lastSunday.toISOString().split('T')[0];
        console.log("getDate:::", startDate, endDate);

        // query to check if data for the entire last week is available
        var checkWeekQuery = `SELECT COUNT(*) AS count FROM taco_treceability.average_m${mNum} WHERE CONVERT(date, date_time) BETWEEN '${startDate}' AND '${endDate}'`;

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
        var weeklyQuery = `
            INSERT INTO taco_treceability.energy_consumption_weekly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh)
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
                AVG(kVAh) AS avg_kVAh
            FROM taco_treceability.energy_consumption
            WHERE CONVERT(date, date_time) BETWEEN '${startDate}' AND '${endDate}'
            GROUP BY meter_id, load_name`;

        sql.connect(sqlConfig, function(err) {
            var insertRequest = new sql.Request();
            insertRequest.query(weeklyQuery, function(err) {
                if (err) {
                    console.error('Error inserting data into energy_consumption_weekly table:', err);
                } else {
                    console.log('Data inserted successfully for week:', startDate, 'to', endDate);
                }
            });
        });
    }
   /////////////////////// from energy_consumption table to energy consumption_weekly end /////////////////////////////


   //////////////////////// from energy_consumption table to energy consumption_monthly strt ///////////////////////////
    function monthlyData(dateformat, mNum) {
        // query to check if data for the entire month is available
        var checkMonthQuery = `SELECT COUNT(DISTINCT DATEPART(week, date_time)) AS week_count
                               FROM taco_treceability.energy_consumption
                               WHERE YEAR(date_time) = YEAR(GETDATE()) AND MONTH(date_time) = ${mNum}`;

        sql.connect(sqlConfig, function(err) {
            var checkMonthRequest = new sql.Request();
            checkMonthRequest.query(checkMonthQuery, function(err, result) {
                if (err) {
                    console.error('Error checking for data for the entire month:', err);
                } else {
                    var weekCount = result.recordset[0].week_count;
                    if (weekCount >= 4) {
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
        // Calculate the date one hour ago
        var currentDate = new Date();
        var oneHourBefore = new Date(currentDate.getTime() - (1 * 3600 * 1000));

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

        var checkQuery = `SELECT COUNT(*) AS count FROM taco_treceability.energy_consumption_monthly WHERE date_time LIKE '${dateformat + ':00:00'}%'`;

        sql.connect(sqlConfig, function (err) {
            var checkRequest = new sql.Request();
            checkRequest.query(checkQuery, function (err, checkResult) {
                if (err) {
                    console.error('Error checking for existing data:', err);
                } else {
                    var count = checkResult.recordset[0].count;
                    console.log("checkResult", count)
                    if (count === 0) {
                
                        var monthlyQuery = `
                        INSERT INTO taco_treceability.energy_consumption_monthly (meter_id, load_name, Vry, Vyb, Vbr, Ir, Iy, Ib, PF, F, kWh, kVAh, date_time)
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
                            FORMAT(date_time, 'yyyy-MM-dd HH:mm:ss') AS date_time_formatted
                        FROM taco_treceability.energy_consumption
                        WHERE YEAR(date_time) = YEAR(DATEADD(MONTH, -1, GETDATE())) AND MONTH(date_time) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                        GROUP BY meter_id, load_name, FORMAT(date_time, 'yyyy-MM-dd HH:mm:ss')`;
                    
                        console.log("monthlyQuery::", monthlyQuery);

                        sql.connect(sqlConfig, function (err) {
                            var insertRequest = new sql.Request();
                            insertRequest.query(monthlyQuery, function (err) {
                                if (err) {
                                    console.error('Error inserting data into energy_consumption_monthly table:', err);
                                } else {
                                    console.log('Data inserted successfully for month:', formattedDate);
                                }
                            });
                        });
                    } else {
                        console.log('Data for this month already processed.');
                    }
                }
            });
        });

    }