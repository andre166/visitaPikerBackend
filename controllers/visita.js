module.exports.filtrarVisita = function( app, req, res){

    var omDao = new app.models.visitaDAO();

    async function pegarVisita(){
        let response = await omDao.filtrarVisitas( req.body );
        res.send( response )
    }

    pegarVisita();
    
}
