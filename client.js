const { setupInput, interface } = require('./input');
const { IP, PORT } = require('./constants');
const net = require('net');
const chalk = require('chalk');
const { stdout } = require('process');
const fs = require('fs');

const connection = function() {

  const connection = net.createConnection({
    host: IP,
    port: PORT
  });

  let stream;

  // interpret incoming data as text
  connection.setEncoding('utf8');

  connection.on('data', message => {

    const data = JSON.parse(message);

    if (data.type === 'success') {
      stdout.write(chalk.green(`Success:` + data.message));
      interface.prompt();
    }

    if (data.type === 'list') {
      for (let file of data.data) {
        stdout.write(file + `\n`);
      }
      interface.prompt();
    }

    //Initialize our stream for writing
    if (data.type === 'fileinit') {
      stream = fs.createWriteStream("./downloads/" + data.data);
    }

    if (data.type === 'chunk') {

      if (stream) {
        stream.write(Buffer.from(data.chunk));
      }

    }

    if (data.type === 'failure') {
      stdout.write(chalk.red(`Error:` + data.message));
      interface.prompt();
    }

  });

  return connection;
};

setupInput(connection());

