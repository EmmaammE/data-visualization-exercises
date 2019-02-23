const BASIC_STRENGTH = 0.09

function smoothScroll(target, duration) {
    var target = document.querySelector(target);
    var targetPosition = target.getBoundingClientRect().top;
    var startPosition = window.pageYOffset;
    var distance = targetPosition - startPosition;
    var startTime = null;

    function animationScroll(currentTime) {
        if (startTime === null) {
            startTime = currentTime;
        }

        var timeElapsed = currentTime - startTime;
        var run = ease(timeElapsed, startPosition, distance, duration)
        window.scrollTo(0, run);

        if (timeElapsed < duration) {
            requestAnimationFrame(animationScroll)
        }
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    requestAnimationFrame(animationScroll);
}

let ele = document.querySelector("a[href='#']");
ele.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScroll('.section2', 1000);
})

function loadData(file) {
    return new Promise((resolve, reject) => {
        d3.csv(file, function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

function displayRelationNodes(data, type) {
    let width = window.innerWidth
    let height = window.innerHeight
    let svg = d3.select('svg')
        .attr('width', 0.9 * width)
        .attr('height', 1000)

    const linkForce = d3.forceLink().id(link => link.name)
        .distance(() => 100)
        .strength(link => link.strength);

    // simulatin setup with all forces
    let simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-18))
        .force('center', d3.forceCenter(width / 2, height * 0.75))

    function getNodeColor(node) {
        return node.relation === '自己' ? 'red' : 'gray'
    }

    if (type === 2) {
        // svg.selectAll('circle')
        //     .data([])
        //     .exit()
        //     .remove();
        // svg.selectAll('text').data([]).exit().remove();
        svg.selectAll('g').data([]).exit().remove();
    }

    let links = createLinks();

    const nodeElements = svg.append('g')
        .selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('r', 10)
        .attr('fill', getNodeColor)

    const textElements = svg.append('g')
        .selectAll('text')
        .data(data)
        .enter().append('text')
        .text(node => node.name)
        .attr('font-size', 10)
        .attr('dx', 15)
        .attr('dy', 4)

    const nickNames = svg.append('g')
        .selectAll('text')
        .data(data)
        .enter().append('text')
        .text(node => node.nickname)
        .attr('font-size', 10)
        .attr('dx', 20)
        .attr('dy', 18)

    const linkElements = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke-width', 0.7)
        .attr('stroke', '#E5E5E5')

    simulation.nodes(data).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)
            .attr('cy', node => node.y)
        textElements
            .attr('x', node => node.x)
            .attr('y', node => node.y)
        nickNames
            .attr('x', node => node.x)
            .attr('y', node => node.y)
        linkElements
            .attr('x1', link => link.source.x)
            .attr('y1', link => link.source.y)
            .attr('x2', link => link.target.x)
            .attr('y2', link => link.target.y)
    })

    // for links

    simulation.force('link', d3.forceLink()
        .id(link => link.name)
        .strength(link => link.strength))

    simulation.force('link').links(links);


    function createLinks() {
        let links = [];

        data.forEach(ele => {
            if (ele.relation !== '自己') {
                if (ele.group !== '无党派') {
                    let link = {};
                    link.target = ele.group;
                    link.source = ele.name;
                    link.strength = BASIC_STRENGTH;
                    links.push(link)
                }
            }
        })
        console.log(links);
        return links;
    }

    const dragDrop = d3.drag()
        .on('start', node => {
            node.fx = node.x
            node.fy = node.y
        })
        .on('drag', node => {
            simulation.alphaTarget(0.5).restart()
            node.fx = d3.event.x
            node.fy = d3.event.y
        })
        .on('end', node => {
            if (!d3.event.active) {
                simulation.alphaTarget(0)
            }
            node.fx = null
            node.fy = null
        })

    nodeElements.call(dragDrop)
}

loadData('./data/relation.csv')
    .then(data => {
        console.log(data);
        /**
         * relation data:
         *
         */
        displayRelationNodes(data)

        window.addEventListener('resize', () => {
            displayRelationNodes(data, 2)
        }, false);
    })
    .catch(error => {
        console.log(error);
    });