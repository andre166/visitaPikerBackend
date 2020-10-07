module.exports = function(app){

    app.post("/getVisita", function(req, res){

        app.controllers.visita.filtrarVisita(app, req, res)

    });

}
