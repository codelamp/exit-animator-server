var simpleGit = require('../../node_modules/simple-git')('/Users/codelamp/Projects/exit/animator/exit-animator/data');

simpleGit.log(function(){
  
  console.log(arguments);
  
});

/*

GIT JS VERSION DISABLED

IT IS PROBABLY BETTER TO ACTUALLY CREATE A GIT
SERVER MYSELF AND PROGRAMMATICALLY WORK WITH THAT.

var modes = require('../../node_modules/js-git/lib/modes');

// Create a repo by creating a plain object.
var repo = {};

// This provides an in-memory storage backend that provides the following APIs:
// - saveAs(type, value) => hash
// - loadAs(type, hash) => hash
// - saveRaw(hash, binary) =>
// - loadRaw(hash) => binary
require('../../node_modules/js-git/mixins/mem-db')(repo);

// This adds a high-level API for creating multiple git objects by path.
// - createTree(entries) => hash
require('../../node_modules/js-git/mixins/create-tree')(repo);

// This provides extra methods for dealing with packfile streams.
// It depends on
// - unpack(packStream, opts) => hashes
// - pack(hashes, opts) => packStream
require('../../node_modules/js-git/mixins/pack-ops')(repo);

// This adds in walker algorithms for quickly walking history or a tree.
// - logWalk(ref|hash) => stream<commit>
// - treeWalk(hash) => stream<object>
require('../../node_modules/js-git/mixins/walkers')(repo);

// This combines parallel requests for the same resource for effeciency under load.
require('../../node_modules/js-git/mixins/read-combiner')(repo);

// This makes the object interface less strict.  See it's docs for details
require('../../node_modules/js-git/mixins/formats')(repo);

repo.saveAs("blob", "Hello World\n", function(err, blobHash){
  
  var treeObject = {
    "greeting.txt": {
      mode: modes.file,
      hash: blobHash
    }
  };
  
  repo.saveAs("tree", treeObject, function(err, treeHash){
    
    var commitObject = {
      author: {
        name: "Tim Caswell",
        email: "tim@creationix.com"
      },
      tree: treeHash,
      message: "Test commit\n"
    };
    
    repo.saveAs("commit", commitObject, function(err, commitHash){
      
      console.log(commitHash);
      
      
      repo.logWalk(commitHash, function(err, logStream){
        
        logStream.read(function(err, commit){
          
          repo.treeWalk(commit.tree, function(err, treeStream){
            
            treeStream.read(function(err, object){
              console.log(object);
            });
            
          });
        
        });
        
      });
      
    
    });
    
  });
  
});

console.log(repo);
*/