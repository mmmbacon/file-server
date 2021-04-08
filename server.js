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

  console.log(chalk.yellow(`Client @${client.address().address}:${client.address().port}(${client.address().family}) connected`));

  client.on('data', (message) => {

    const data = JSON.parse(message);

    console.log(data);

    if (data.command === 'list') {
      console.log('Reading Directory..');
  
      const files = fs.readdirSync(FILEPATH);

      client.write(JSON.stringify({
        data: files,
        type: 'list'
      }) + '|');
    }
  
    if (data.command === 'getfile') {
        
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
          
        //Let the client know we are ready to write the stream
        client.write(JSON.stringify({
          type: 'fileinit',
          data: data.arguments
        }));
    
        //Once the file is readable, begin stream
        stream.on('readable', function() {
          console.log(chalk.yellow("Connected user fetched file " + FILEPATH + data.arguments));
            
          let chunk;
          //While stream is reading... and chunk is not empty
          while ((chunk = this.read()) !== null) {
  
            size += chunk.length;
  
            client.write('|' + JSON.stringify({
              chunk: chunk,
              type: 'chunk'
            }));
          }
  
        });
  
        stream.on('error', (error)=>{
          client.write('|' + JSON.stringify({
            type: 'failire',
            message: 'File could not be read, please try again. Error: ' + error
          }));
        });
    
        stream.on('end', function() {
          elapsed = new Date() - date;
          client.write('|' + JSON.stringify({
            type: 'success',
            message: `${size}kb file transferred in ${(elapsed).toFixed(2)}ms`
          }));
        });
  
      }
    }

  });
});

server.on('data', (client) => {
  console.log("");
});