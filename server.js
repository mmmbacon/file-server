const net = require('net');
const chalk = require('chalk');
const fs = require('fs');

const options = {
  host: 'localhost',
  port: 8080
};

const FILEPATH = './files/';

const server = new net.Server();
server.listen(options);

console.log(chalk.green("Fileserver is now running"));

server.on('connection', (client) => {

  client.on('data', (message)=>{
    const data = JSON.parse(message);

    if (data.command === 'list') {
      console.log('Reading Directory..');

      const files = fs.readdirSync(FILEPATH);

      let json = JSON.stringify({
        data: files,
        type: 'list'
      });
      client.write(json);
    }

    if (data.command === 'getfile') {

      console.log('get');

      const files = fs.readdirSync(FILEPATH);
      let doesExist = false;
      let date = new Date();
      let size = 0;
      let elapsed;

      //Search for the file
      for (let file of files) {
        if (file.includes(data.arguments)) {
          doesExist = true;
        }
      }

      //If file doesnt exist, let the client know
      if (!doesExist) {
        client.write(JSON.stringify({
          type: 'failure',
          message: 'File does not exist on the server'
        }));
      //Otherwise carry on with file fetching
      } else {

        let stream = fs.createReadStream(FILEPATH + data.arguments);
        
        client.write(JSON.stringify({
          type: 'fileinit',
          data: data.arguments
        }));
  
        stream.on('readable', function() {

          console.log(chalk.yellow("Connected user fetched file " + FILEPATH + data.arguments));
          let chunk;
          //While stream is reading... and chunk is not empty
          while ((chunk = this.read()) !== null) {

            size += chunk.length;

            //send chunk
            let json = JSON.stringify({
              chunk: chunk,
              type: 'chunk'
            });

            client.write(json);
          }
        });

        stream.on('error', (error)=>{
          client.write(JSON.stringify({
            type: 'failire',
            message: 'File could not be read, please try again. Error: ' + error
          }));
        });
  
        stream.on('end', function() {
          elapsed = new Date() - date;
          client.write(JSON.stringify({
            type: 'success',
            message: `${size}kb file transferred in ${elapsed * 0.001} seconds`
          }));
        });
      }
    }
  });
});

server.on('data', (client) => {
  console.log("");
});