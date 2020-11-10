const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const axios =require('axios');
const { JSDOM } = require('jsdom');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



function stripHtml(html)
{
    let obj=[];

    const dom = new JSDOM(html);

    let brand = dom.window.document.querySelector(".page-heading-1").textContent.split('Available').shift().trim()

    let data = dom.window.document.querySelectorAll('.data-row');

    Array.from(data).forEach(function(el) {
        obj.push({
            medicine_name:el.querySelector('.data-row-top').innerHTML.trim().split('<span').shift(),
            category:el.querySelector('.data-row-top').innerHTML.trim().split('<span').pop().split('>').slice(1).slice(0,1).toString().split('<').slice(0,1).join(''),
            strength:el.querySelector('.data-row-strength').textContent.trim(),
            generic_name:el.querySelector('.data-row-strength + .col-xs-12').innerHTML.trim(),
            price:el.querySelector('.packages-wrapper').textContent.replace(/(\r\n|\n|\r)/gm,"").trim().replace( /^\D+/g, ''),
            brand
        })
    });

    return obj;
}

app.get('/',(req,res,next)=>{
    if(req.query.page){
        axios.get(req.query.page)
        .then(response=> {
            let fileName = response.config.url.split('/').pop();
            const data = stripHtml(response.data);

            const csvWriter = createCsvWriter({
                path:'data/'+fileName+'.csv',
                header: [
                    {id: 'medicine_name', title: 'Medicine Name'},
                    {id: 'category', title: 'Category'},
                    {id: 'strength', title: 'Strength'},
                    {id: 'generic_name', title: 'Generic Name'},
                    {id: 'price', title: 'Price'},
                    {id: 'brand', title: 'Brand'},
                ]
            });

            csvWriter.writeRecords(data)
            .then(() => {
                console.log('...Done');
               // res.send("<h1>Hello World.</h1>");
            });


        })
        .catch(res=>{
            console.log("Exception : ",res);
        })
    }

    res.send("<h1>Hello World.</h1>");
})


app.listen(3000,()=>console.log("server running on port:3000"))