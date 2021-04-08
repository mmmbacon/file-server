const { fstat } = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const stdin = process.stdin;
const stdout = process.stdout;
const fs = require('fs');
let connection;

const interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const COMMANDS = {
  LIST_FILES: new RegExp("ls"),
  GET_FILE: new RegExp("get")
};

/**
 * Setup User Interface
 * Specifically, so that we can handle user input via stdin
 */
const setupInput = function(conn) {
  connection = conn;
  //stdin.setEncoding('utf8');
  handleUserInput(connection);
  //return stdin;
  interface.setPrompt(">> ");
  interface.prompt();
};

const request = (connection, command, args) => {
  connection.write(JSON.stringify({
    command: command,
    arguments: args
  }));
};

//Callback for setupInput
const handleUserInput = function(connection) {

  console.log("Connected to Fileserver");

  interface.on('line', (input) => {

    const split = input.split(" ");
    let notRecognized = false;

    //First check for the command
    if (split[0].match(COMMANDS.LIST_FILES)) {
      request(connection, 'list');
    }

    if (split[0].match(COMMANDS.GET_FILE)) {
      if (split.length < 2) {
        stdout.write(chalk.red(`Command requires a file argument\n`));
        interface.prompt();
      } else {
        const files = fs.readdirSync('./downloads');
        let doesExist = false;
        
        for (let file of files) { //Search to see if the file already exists
          if (file.includes(split[1])) {
            doesExist = true;
          }
        }
        if (doesExist) { //If file doesnt exist, proceed
          interface.question('File already exists. Overwrite? (Y/N) ', (input)=>{
            if (input === 'Y') {
              request(connection, 'getfile', split[1]);
            } else if (input === 'N') {
              stdout.write(chalk.red(`File was not downloaded\n`));
              interface.prompt();
            } else {
              stdout.write(chalk.red(`Please try again\n`));
              interface.prompt();
            }
          });
        }
      }
    }

    if (notRecognized) {
      stdout.write(`Command not recognized\n`);
    }

  });
};

module.exports = {
  setupInput,
  interface
};