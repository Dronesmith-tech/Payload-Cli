/**
 * CLI for Lasers
 *
 * @copyright 2015 Skworks Aerial Systems, all rights reserved.
 * @author Geoff Gardner <geoff@skyworksas.com>
 */
var SerialPort =  require('serialport').SerialPort,
    mavlink =     require('mavlink'),
    // repl =        require('repl'),
    readline =    require('readline'),
    _ =           require('underscore');

// Global vars
var replMode = false;

var MAVLINK_BAUD = 57600;

var connectionCnt = 0;
var lastMsg = null;
var connectionGood = false;

var mav = null;
var serial = null;

// global routines
function sendCmd(params) {
  if (!serial || !mav) {
    return;
  }

  mav.createMessage('SEND_PAYLOAD_CMD', {
    'target_system':        0, /* any */
    'target_component':     0, /* any */
    'cmd':                  params
  }, function(msg) {
    // console.log(msg.buffer);
    serial.write(msg.buffer);
  });
}

function execScript(fname, blocking) {
  var script = null;
  try {
    script = require(fname);

    if (script.length > 0) {
      console.log('Running script in background...');

      function runScript(index) {
        if (index >= script.length) {
          console.log('Script finished.');
          if (blocking) {
            process.exit(0);
          }
          return;
        }

        sendCmd(_.toArray(script[index].cmd));

        setTimeout(function() {
          index++;
          runScript(index);
        }, script[index].time);
      }

      runScript(0);

    } else {
      throw new Error("Not a valid script file!");
    }
  } catch(e) {
    console.log(e);
  }
}

// Check connection interval
setInterval(function() {
  if (connectionCnt > 1) {
    connectionGood = true;
  } else {
    connectionGood = false;
    console.log('Error: Lost Link');
  }
  connectionCnt = 0;
}, 5000);

// Main
if (process.argv.length < 3) {
  console.log('Usage:');
  console.log('node pewpew.js <serialport> <script.json> [--repl]');
  console.log('Add `--repl` to run the script in interactive mode.');
  process.exit(1);
} else {
  if (_.find(process.argv, function(val) {return val == '--repl'})) {
    replMode = true;
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.setPrompt('pew> ');
    rl.prompt();

    rl.on('line', function(line) {
      var line = line.trim().split(' ');
      switch (line[0]) {
        case 'help':
          console.log('> quit \t\t\t Exit application.');
          console.log('> status \t\t Get status of connection link.');
          console.log('> exec [chars] \t\t Send a command to the drone.');
          console.log('> script `filename` \t Load and run a script');
          break;
        case 'status':
          if (connectionGood) {
            console.log('Connected to drone.');
          } else {
            console.log('Error, lost connection. Quit app and restart.');
          }
          console.log('Last received ping from drone:', lastMsg);
          break;
        case 'exec':
          if (line.length < 2) {
            console.log('You must enter a command to send!');
          } else {
            sendCmd(_.toArray(line[1]));
          }
          break;
        case 'script':
          if (line.length < 2) {
            console.log('You must enter a script path to load!');
          } else {
            execScript(line[1], false);
          }
          break;
        case 'exit':
        case 'quit':
          process.exit(0);
          break;
      }
      rl.prompt();
    });

  } else {
    var scriptLoc = process.argv[3] || null;
    if (!scriptLoc) {
      console.log('Must include a script!');
      process.exit(1);
    }
  }

  var serialDev = process.argv[2] || null;

  serial = new SerialPort(serialDev, {
    baudrate: MAVLINK_BAUD
  });

  mav = new mavlink(1, 1);

  mav.on('ready', function() {
    serial.on('open', function(error) {
      if (error) {
        console.log("Failed to open serial. Reason:", error);
      } else {
        console.log("Serial opened sucessfully.");
        connectionGood = true;

        if (!replMode) {
          execScript(scriptLoc, true);
        }

        serial.on('data', function(data) {
          mav.parse(data);
        });

        mav.on('HEARTBEAT', function(data, fields) {
          connectionCnt++;
          lastMsg = new Date();
        });

        // mav.on('COMMAND_ACK', function(data, fields) {
        //   console.log('ACK: ', fields);
        // });
      }
    });
  });
}
