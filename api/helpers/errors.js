module.exports = {
  
  forRetrieval: function(err, req, res, entityName){
    if ( Array.isArray(err) ) {
      res.status(err[0]).json({ message: err[1] });
    }
    else {
      switch ( err.name ) {
        case 'CastError':
          res.status(400).json({ message: 'Illegal ID.' });
        break;
        default:
          res.status(500).json({ message: 'An unknown error occurred.' });
        break;
      }
    }
  },
  
  mongooseFailed: function(err){
    console.log(err);
  },
  
  swaggerFailed: function(err){
    console.log(err);
  }
  
};