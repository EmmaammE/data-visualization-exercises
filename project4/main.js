(function () {
    var template = {
        size: [400, 400],
        file: 'top1000.csv',
        graph:'#cloud'
    }

    function getScaleValues(data) {
        var debug =  true;

        var domain = [0,75];
        var range = d3.extent(data,d=>d.num);

        debug && console.log(range);
        return {
            domain: domain,
            range: range
        }
    }

    function createWordCloud(data) {

        const { domain,range } = getScaleValues(data);
        var wordScale = d3.scaleLinear().domain(domain).range(range);
        d3.layout.cloud().size(template.size)
            .words(data)
            .rotate(0)
            .fontSize(d => wordScale(d.num))
            .on("end",draw)
            .start();

    }

    function initGraph(graph) {
        return d3.select(graph).append("svg").append("g").attr("transform","translate(200,200)");
    }
    function draw(words) {
        var $word = initGraph(template.graph);
        console.log("draw");
        $word.selectAll("text")
            .data(words)
            .enter()
            .append("text")
            // .style("font-size",d=>d.size+"px")
            .style("fill",'#4F442B')
            .text(d=>{
                console.log("object");
                console.log(d.name);
                return d.name;
            })
    }
    function loadData(file) {
        return new Promise((resolve, reject) => {
            d3.csv(file, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    // change "num" to Number
                    data.map(value => {
                        value.num = +value.num;
                    })
                    resolve(data);
                }
            });
        });
    }

    loadData(template.file)
        .then(parsed_data => {
           var debug = true;
           debug && console.log(parsed_data);

           createWordCloud(parsed_data.slice(0,20));
        })
        .catch(error => {
            console.log(error);
        });
})()