App = {
  web3Provider: null,
  contracts: {},

  init: async function() {

    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Award.json', function (data) {
      var AwardArtifact = data;
      App.contracts.Award = TruffleContract(AwardArtifact);
      App.contracts.Award.setProvider(App.web3Provider);
    });
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-submit', App.handleSubmit);
    $(document).on('click', '.check', App.checkSubmit);
    $(document).on('click', '.addInstitution', App.AddInstitution);
  },

  checkSubmit: function(event) {
    event.preventDefault();
    var current_file_hash;
    var exists = false;
    var awardInstance;
    var institution_Addr = $("#institutionAddress").val().toLowerCase();
    var box=document.getElementById('box');  
    var fileReader = new FileReader(),
        blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,  
        file = document.getElementById("file").files[0],  
        chunkSize = 2097152,  
        // read in chunks of 2MB  
        chunks = Math.ceil(file.size / chunkSize),  
        currentChunk = 0,  
        spark = new SparkMD5();
    
    fileReader.onload = function(e) {  
        console.log("read chunk nr", currentChunk + 1, "of", chunks);  
        spark.appendBinary(e.target.result); // append binary string  
        currentChunk++;  
  
        if (currentChunk < chunks) {  
            loadNext();  
        }  
        else {  
            console.log("finished loading");   
            current_file_hash = spark.end();
        }  
    };

    function loadNext() {  
      var start = currentChunk * chunkSize,  
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;  

      fileReader.readAsBinaryString(blobSlice.call(file, start, end));  
    };  

    loadNext();
    
    App.contracts.Award.deployed().then(function(instance){
      awardInstance = instance;
      
      let events = awardInstance.allEvents({fromBlock: 0, toBlock: 'latest'});
      events.get((error, res) => {
        if (error)
          console.log('Error getting events: ' + error);
        else
          for(var i = 0; i<res.length; i++){
            var result = res[i];
            var args = result['args'];
            var hash = args['file_hash'];
            var institution = args['institution'];
            console.log(current_file_hash == hash);
            console.log(res);
            if (current_file_hash == hash){
              if(institution_Addr == institution){
                exists =true;
              }
            }
          }
          if(exists == true){
            box.innerText = 'This degree certificate is authentic.';
          }else{
            box.innerText = 'This degree certificate is fake.';
          }
          
    });
      
    }).catch(function (error) {
      console.log(error.message);
    });

  },


  AddInstitution: function(event) {
    event.preventDefault();
    var institutionAddr = $("#add").val();
    var box=document.getElementById('box2');  
    web3.eth.getAccounts(function(error, accounts){
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 
      App.contracts.Award.deployed().then(function(instance){
        awardInstance = instance;
        awardInstance.addInstitution(institutionAddr, { from: account });
      }).catch(function (error) {
        console.log(error.message);
      });
      
    });
    
  },


  handleSubmit: function(event) {
    event.preventDefault();
    var awardInstance;
    var file_hash;
    var fileReader = new FileReader(),
        box=document.getElementById('box');  
        blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,  
        file = document.getElementById("file").files[0],  
        chunkSize = 2097152,  
        // read in chunks of 2MB  
        chunks = Math.ceil(file.size / chunkSize),  
        currentChunk = 0,  
        spark = new SparkMD5();
    
    fileReader.onload = function(e) {  
        console.log("read chunk nr", currentChunk + 1, "of", chunks);  
        spark.appendBinary(e.target.result); // append binary string  
        currentChunk++;  
  
        if (currentChunk < chunks) {  
            loadNext();  
        }  
        else {  
            console.log("finished loading");   
            file_hash = spark.end();
        }  
    };

    function loadNext() {  
      var start = currentChunk * chunkSize,  
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;  

      fileReader.readAsBinaryString(blobSlice.call(file, start, end));  
    };  

    loadNext();
    
    web3.eth.getAccounts(function(error, accounts){
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 
      App.contracts.Award.deployed().then(function(instance){
        awardInstance = instance;
        return awardInstance.publish(account, file_hash, { from: account });
        
      }).catch(function (error) {
        console.log(error.message);
      });
      
    });
    
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
