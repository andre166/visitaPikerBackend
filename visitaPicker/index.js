const parseKMZ = require('parse2-kmz');
var classifyPoint = require("robust-point-in-polygon");
const {Client} = require("@googlemaps/google-maps-services-js");

const client = new Client({});

module.exports = visitapicker;

async function visitapicker( reqBody ){

    let carro = reqBody.carro;
    let arrayVisitas = reqBody.visitas;
    let hora = reqBody.hora;

    let coordenadasDoPoligonoDoCarro = await gerarJsonDeCoordenadas( carro );

    let visita = await verificarVisitasInPolingono( coordenadasDoPoligonoDoCarro, arrayVisitas, carro, hora );
    return visita;

}

async function desempatePorProximidadeGeografica( listaDeVisitas, carro ){

    let carroLatLng = carro.lat + "," + carro.lng;
    let visitaValue = 0;
    let visitaFinal = [];

    for (const visita of listaDeVisitas) {  
        
        let visitasLatLng = parseFloat(visita.lat) + ',' + parseFloat(visita.lng);
        
        await client.directions({
            params: {
                origin: carroLatLng,
                destination: visitasLatLng,
                key: "AIzaSyC0HwPwbL6VG9d7vCF4py3T6RsY9DYEX0o",
            },
        }).then( response =>{

            if( visitaValue === 0 ){
    
                visitaValue =  response.data.routes[0].legs[0].distance.value;
                visitaFinal[0] = visita; 

            }else if( visitaValue > response.data.routes[0].legs[0].distance.value ){
                visitaValue = response.data.routes[0].legs[0].distance.value;
                visitaFinal[0] = visita; 
            }
    
        }).catch( c =>{
            console.log("erro: ", c)
        })
        
    }

    return visitaFinal;
}

async function definirPrioridade( visitaValendo, carro ){

    let listaOrdenada = [];
    let prioridade = '';
    let listaDeVisitasFinal = [];

    listaOrdenada = visitaValendo.sort(function(a, b){ //Ordena a lista pela prioridade da menor para a maior 
        return ( a.prioridade > b.prioridade ) ? 1 : ((a.prioridade < b.prioridade ) ? -1 : 0);
    });

    // verifica a lista ordenada e adidicona na lista final todas as visitas com a prioridade mais baixa
    for (const visita of listaOrdenada) {  

        if( prioridade === '' ){
            prioridade = visita.prioridade;
        }

        if( visita.prioridade > prioridade){
            break;
        }

        listaDeVisitasFinal.push(visita);
    }

    if( listaDeVisitasFinal.length > 1){

        return await desempatePorProximidadeGeografica( listaDeVisitasFinal, carro );

    }else{
        return listaDeVisitasFinal;
    }

}

function verificarVisitasInPolingono( coordenadasPoligonoCarro, arrayVisitas, carro, hora ){

    var polygon = coordenadasPoligonoCarro;
    let visitaValendo = [];
    let supervisorFlag = false;
    let supervisorCarro = false;
    let tardeEmMinutos = 720;

    let formatHora = hora.split(':');

    let horaDoCarro = formatHora[0] * 60 + parseInt(formatHora[1]);

    if( carro.tipo == 'supervisor' ){
        supervisorCarro = true;
    }

    arrayVisitas.map( visita => { // popula um array com as visitas do poligono do carro

        let verificacao = classifyPoint(polygon, [ parseFloat(visita.lng), parseFloat(visita.lat) ]);

        if( verificacao == -1 ){

            if( visita.supervisor ){ //verifica se tem alguma visita para supervisor

                supervisorFlag = true;

                if( supervisorCarro ){

                    if( visita.turno == 'tarde' && horaDoCarro > tardeEmMinutos ){
                        visitaValendo.push(visita);
                    }else if( visita.turno == 'manhã' && horaDoCarro <= tardeEmMinutos ){
                        visitaValendo.push(visita);
                    }else if( !visita.turno ){
                        visitaValendo.push(visita);
                    }

                }   

            }else{

                if( visita.tipo == carro.tipo){

                    if( visita.turno == 'tarde' && horaDoCarro > tardeEmMinutos){

                        visitaValendo.push(visita);

                    }else if( visita.turno == 'manhã' && horaDoCarro <= tardeEmMinutos ){

                        visitaValendo.push(visita);

                    }else if( !visita.turno ){
                        visitaValendo.push(visita);
                    }


                }

            }

        }

    });



    if( supervisorFlag && carro.tipo == 'supervisor'){ // se o carro for supervisor e tiver alguma visita no array que seja supervisor

        let visitasComFlag = [];

        visitaValendo.map( visita => { // popula um array só com visitas com flagSupervisor = true
           
            if( visita.supervisor ){
                visitasComFlag.push(visita)
            }

        })

        if(visitasComFlag.length == 1){ // caso só tenha uma retorna ela própria caso mais de 1 defini a prioridade
            return visitasComFlag;
        }else{
            return definirPrioridade( visitasComFlag, carro )
        }

    }else if( !supervisorFlag && carro.tipo == 'supervisor' ){
        return ['Sem visita para supervisor']
    }else{
        return definirPrioridade( visitaValendo, carro );
    }


}

async function gerarJsonDeCoordenadas( carro ){

    let coordenadas = [];

    let parsedKmz = await parseKMZ.toJson('./visitaPicker/cercasItaborai.kmz');  //Converter kmz para json

    Object.keys(parsedKmz.features).forEach(function(item){  // gera um array de objetos name e coordenadas => { name: 'ÁREA 03 - ITB 03', coordenadas: [ [Array] ] },

        coordenadas.push( { name: parsedKmz.features[item].properties.name, coordenadas: parsedKmz.features[item].geometry.coordinates})

    });
    
    let coordenadasDoPoligonoDoCarro = coordenadas.find( e => e.name == carro.cercaDeAtuacao);
    
    return coordenadasDoPoligonoDoCarro.coordenadas[0];

}
