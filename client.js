const { setupInput, interface } = require('./input');
const { IP, PORT } = require('./constants');
const net = require('net');
const chalk = require('chalk');
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

    let chunk = message.split('|');
    chunk = chunk.filter(function(el) {
      return el !== '';
    });

    for (const pipe of chunk) {
      //Either string or buffer

      const data = JSON.parse(pipe);
      

      if (data.type === 'success') {
        interface.output.write(chalk.green(`Success:` + data.message + `\n`));
  
      }

      if (data.type === 'failure') {
        interface.output.write(chalk.red(`Error:` + data.message + `\n`));
      }

      if (data.type === 'list') {
        interface.output.write(`\n`);
        for (let file of data.data) {
          interface.output.write(file + `\n`);
        }
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

      interface.prompt();
    }
  });

  connection.on('close', () => {
    interface.output.write(chalk.red("Server has terminated the connection\n"));
    interface.close();
  });

  return connection;
};

setupInput(connection());

