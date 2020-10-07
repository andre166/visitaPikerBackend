const getVisita = require('../visitaPicker');

function VisitaDAO( ){

}

VisitaDAO.prototype.filtrarVisitas = function( req ){
    return getVisita( req );
};


module.exports = function(){
    return VisitaDAO;
}
