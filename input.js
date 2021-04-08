const { fstat } = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const stdin = process.stdin;
const fs = require('fs');
let connection;

const interface = readline.createInterface({
  input: process.stdin,
  output: process.stdin
});

const COMMANDS = {
  LIST_FILES: new RegExp("ls"),
  GET_FILE: new RegExp("getfile"),
  LIST_COMMANDS: new RegExp("commands")
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

  console.log("Connected to Fileserver - type 'commands' to list all commands");

  interface.on('line', (input) => {

    let notRecognized = false;
    let directory = 'downloads'; //Default directory

    const split = input.split(" ");

    //First check for the command
    if (split[0].match(COMMANDS.LIST_FILES)) {
      request(connection, 'list');
    } else if (split[0].match(COMMANDS.GET_FILE)) {
      
      if (split.length < 2) {
        interface.output.write(chalk.red(`Command requires a file argument\n`));
      } else {

        //Add new directory
        if (split[2]) {

          directory = split[2];

          if (!fs.existsSync(split[2])) {
            fs.mkdirSync(split[2]);
          }
        }
        
        const files = './' + directory;
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
              interface.output.write(chalk.red(`File was not downloaded\n`));
            } else {
              interface.output.write(chalk.red(`Please try again\n`));
            }
          });
        } else {
          request(connection, 'getfile', split[1]);
        }
      }
    } else if (split[0].match(COMMANDS.LIST_COMMANDS)) {
      interface.output.write(`${chalk.bold(`commands`)}\t\tLists all commands\n`);
      interface.output.write(`${chalk.bold(`ls`)}\t\t\tLists files in directory\n`);
      interface.output.write(`${chalk.bold(`getfile [filename]`)}\tFetches file with given filename\n`);
    } else {
      interface.output.write(chalk.red(`Error: Command not recognized\n`));
    }

    interface.prompt();
  });
};

module.exports = {
  setupInput,
  interface
};